import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { formatearCop } from '../comun/dinero.js';
import {
  EstadoTransaccion,
  MetodoRetiro,
  TipoTransaccion,
} from '../generated/prisma/enums.js';
import {
  ServicioPasarelaSandbox,
  type ResultadoPayout,
} from '../pasarela/servicio-pasarela-sandbox.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { HistorialBilleteraDto } from './dto/historial-billetera.dto.js';
import { SolicitarRetiroDto } from './dto/solicitar-retiro.dto.js';

const RETIRO_MINIMO = 10_000;
const RETIRO_MAXIMO = 5_000_000;

const ETIQUETAS_METODO: Record<MetodoRetiro, string> = {
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  BANCO: 'cuenta bancaria',
};

/**
 * HU-10 — Billetera virtual y retiro de ganancias.
 *
 * El saldo del propietario se abona cuando un pago se completa (HU-06).
 * Al solicitar un retiro, el monto pasa de `saldoDisponible` a
 * `saldoPendiente`; si la dispersión sandbox falla, se devuelve al saldo
 * disponible. Toda variación deja una transacción en el historial.
 */
@Injectable()
export class ServicioBilletera {
  private readonly logger = new Logger(ServicioBilletera.name);

  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly pasarela: ServicioPasarelaSandbox,
  ) {}

  async obtenerBalance(usuarioId: string) {
    const billetera = await this.obtenerOCrearBilletera(usuarioId);
    const retirosEnProceso = await this.prisma.retiro.count({
      where: {
        billeteraId: billetera.id,
        estado: { in: [EstadoTransaccion.PENDIENTE, EstadoTransaccion.PROCESANDO] },
      },
    });

    return {
      usuarioId,
      moneda: billetera.moneda,
      saldoDisponible: billetera.saldoDisponible,
      saldoPendiente: billetera.saldoPendiente,
      totalGanado: billetera.totalGanado,
      totalRetirado: billetera.totalRetirado,
      retirosEnProceso,
      // Alias que ya consume el frontend.
      retirosProceso: retirosEnProceso,
      actualizadoEn: billetera.actualizadoEn.toISOString(),
    };
  }

  async obtenerHistorial(usuarioId: string, dto: HistorialBilleteraDto) {
    const billetera = await this.obtenerOCrearBilletera(usuarioId);

    const transacciones = await this.prisma.transaccionBilletera.findMany({
      where: {
        billeteraId: billetera.id,
        ...(dto.tipo ? { tipo: dto.tipo } : {}),
      },
      orderBy: { creadoEn: 'desc' },
      take: dto.limite ?? 50,
    });

    return transacciones.map((transaccion) => {
      const metadata = (transaccion.metadata ?? {}) as Record<string, unknown>;
      const destino =
        typeof metadata.destino === 'string'
          ? metadata.destino
          : transaccion.tipo === TipoTransaccion.INGRESO
            ? 'Billetera UniTrade'
            : null;

      return {
        id: transaccion.id,
        tipo: transaccion.tipo,
        concepto: transaccion.descripcion,
        descripcion: transaccion.descripcion,
        monto: transaccion.monto,
        saldoDespues: transaccion.saldoDespues,
        estado: transaccion.estado,
        destino,
        fecha: transaccion.creadoEn.toISOString(),
        metadata: transaccion.metadata,
      };
    });
  }

  async solicitarRetiro(dto: SolicitarRetiroDto, usuarioId: string) {
    const billetera = await this.obtenerOCrearBilletera(usuarioId);

    const cuenta = dto.cuenta.trim();
    this.validarCuenta(dto.metodo, cuenta);
    this.validarMonto(dto.monto);

    if (billetera.saldoDisponible < dto.monto) {
      throw new BadRequestException(
        `Saldo insuficiente. Disponible: ${formatearCop(billetera.saldoDisponible)}.`,
      );
    }

    const cuentaEnmascarada = this.enmascararCuenta(cuenta);
    const destino = `${ETIQUETAS_METODO[dto.metodo]} (${cuentaEnmascarada})`;

    // Reserva atómica: solo descuenta si el saldo sigue alcanzando.
    const retiro = await this.prisma.$transaction(async (tx) => {
      const reserva = await tx.billetera.updateMany({
        where: {
          id: billetera.id,
          saldoDisponible: { gte: dto.monto },
        },
        data: {
          saldoDisponible: { decrement: dto.monto },
          saldoPendiente: { increment: dto.monto },
        },
      });

      if (reserva.count === 0) {
        throw new ConflictException(
          'El saldo cambió mientras se procesaba el retiro. Intenta de nuevo.',
        );
      }

      return tx.retiro.create({
        data: {
          billeteraId: billetera.id,
          metodo: dto.metodo,
          cuenta,
          monto: dto.monto,
          moneda: billetera.moneda,
          estado: EstadoTransaccion.PENDIENTE,
        },
      });
    });

    // La dispersión está en curso: el dinero queda retenido en saldoPendiente.
    await this.prisma.retiro.update({
      where: { id: retiro.id },
      data: { estado: EstadoTransaccion.PROCESANDO },
    });

    let payout: ResultadoPayout;
    try {
      payout = await this.pasarela.dispersar({
        monto: retiro.monto,
        moneda: retiro.moneda,
        metodo: retiro.metodo,
        cuenta,
        referencia: `retiro:${retiro.id}`,
        forzarFallo: dto.forzarFallo,
      });
    } catch (error) {
      this.logger.error(`Error de comunicación con la pasarela: ${String(error)}`);
      payout = {
        exito: false,
        idPayout: `sbx_po_error_${retiro.id}`,
        estado: 'RECHAZADO',
        codigoRespuesta: 'ERROR_PASARELA',
        mensaje: 'No fue posible comunicarse con la pasarela de pagos.',
        fecha: new Date(),
      };
    }

    if (!payout.exito) {
      const billeteraActualizada = await this.prisma.$transaction(async (tx) => {
        const actualizado = await tx.retiro.updateMany({
          where: {
            id: retiro.id,
            estado: { in: [EstadoTransaccion.PENDIENTE, EstadoTransaccion.PROCESANDO] },
          },
          data: {
            estado: EstadoTransaccion.FALLIDO,
            idPayout: payout.idPayout,
            errorMensaje: payout.mensaje,
          },
        });

        if (actualizado.count === 0) {
          return tx.billetera.findUniqueOrThrow({ where: { id: billetera.id } });
        }

        // Devuelve el dinero retenido a la billetera.
        const actual = await tx.billetera.update({
          where: { id: billetera.id },
          data: {
            saldoPendiente: { decrement: dto.monto },
            saldoDisponible: { increment: dto.monto },
          },
        });

        await tx.transaccionBilletera.create({
          data: {
            billeteraId: billetera.id,
            tipo: TipoTransaccion.RETIRO,
            monto: dto.monto,
            saldoDespues: actual.saldoDisponible,
            descripcion: `Retiro rechazado a ${destino}`,
            estado: EstadoTransaccion.FALLIDO,
            metadata: {
              retiroId: retiro.id,
              idPayout: payout.idPayout,
              metodo: retiro.metodo,
              cuentaEnmascarada,
              destino,
              motivo: payout.mensaje,
            },
          },
        });

        return actual;
      });

      throw new HttpException(
        {
          exito: false,
          codigo: payout.codigoRespuesta,
          mensaje: payout.mensaje,
          solicitudId: retiro.id,
          idPayout: payout.idPayout,
          estado: EstadoTransaccion.FALLIDO,
          monto: dto.monto,
          cuentaEnmascarada,
          saldoDisponible: billeteraActualizada.saldoDisponible,
          saldoPendiente: billeteraActualizada.saldoPendiente,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const completado = await this.prisma.$transaction(async (tx) => {
      const retiroCompletado = await tx.retiro.update({
        where: { id: retiro.id },
        data: {
          estado: EstadoTransaccion.COMPLETADO,
          idPayout: payout.idPayout,
          completadoEn: payout.fecha,
          errorMensaje: null,
        },
      });

      const actual = await tx.billetera.update({
        where: { id: billetera.id },
        data: {
          saldoPendiente: { decrement: dto.monto },
          totalRetirado: { increment: dto.monto },
        },
      });

      await tx.transaccionBilletera.create({
        data: {
          billeteraId: billetera.id,
          tipo: TipoTransaccion.RETIRO,
          monto: dto.monto,
          saldoDespues: actual.saldoDisponible,
          descripcion: `Retiro a ${destino}`,
          estado: EstadoTransaccion.COMPLETADO,
          metadata: {
            retiroId: retiro.id,
            idPayout: payout.idPayout,
            metodo: retiro.metodo,
            cuentaEnmascarada,
            destino,
          },
        },
      });

      return { retiroCompletado, billetera: actual };
    });

    this.logger.log(
      `Retiro ${completado.retiroCompletado.id} completado: ${formatearCop(dto.monto)} a ${destino}.`,
    );

    return {
      exito: true,
      solicitudId: completado.retiroCompletado.id,
      idPayout: payout.idPayout,
      estado: completado.retiroCompletado.estado,
      monto: dto.monto,
      moneda: billetera.moneda,
      metodo: retiro.metodo,
      cuentaEnmascarada,
      saldoDisponible: completado.billetera.saldoDisponible,
      saldoPendiente: completado.billetera.saldoPendiente,
      fecha: (completado.retiroCompletado.completadoEn ?? payout.fecha).toISOString(),
      mensaje: `Retiro de ${formatearCop(dto.monto)} procesado en sandbox hacia ${destino}.`,
    };
  }

  async obtenerRetiros(usuarioId: string, limite = 20) {
    const billetera = await this.obtenerOCrearBilletera(usuarioId);

    const retiros = await this.prisma.retiro.findMany({
      where: { billeteraId: billetera.id },
      orderBy: { creadoEn: 'desc' },
      take: Math.min(Math.max(limite, 1), 100),
    });

    return retiros.map((retiro) => ({
      id: retiro.id,
      idPayout: retiro.idPayout,
      metodo: retiro.metodo,
      cuentaEnmascarada: this.enmascararCuenta(retiro.cuenta),
      monto: retiro.monto,
      moneda: retiro.moneda,
      estado: retiro.estado,
      error: retiro.errorMensaje,
      creadoEn: retiro.creadoEn.toISOString(),
      completadoEn: retiro.completadoEn?.toISOString() ?? null,
    }));
  }

  listarEntidades() {
    return [
      { valor: MetodoRetiro.NEQUI, label: 'Nequi' },
      { valor: MetodoRetiro.DAVIPLATA, label: 'Daviplata' },
      { valor: MetodoRetiro.BANCO, label: 'Cuenta bancaria' },
    ];
  }

  private async obtenerOCrearBilletera(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario indicado no existe.');
    }

    return this.prisma.billetera.upsert({
      where: { usuarioId },
      create: { usuarioId },
      update: {},
    });
  }

  private validarMonto(monto: number): void {
    if (!Number.isInteger(monto) || monto < RETIRO_MINIMO || monto > RETIRO_MAXIMO) {
      throw new BadRequestException(
        `El retiro debe estar entre ${formatearCop(RETIRO_MINIMO)} y ${formatearCop(RETIRO_MAXIMO)}.`,
      );
    }
  }

  private validarCuenta(metodo: MetodoRetiro, cuenta: string): void {
    if (metodo === MetodoRetiro.NEQUI || metodo === MetodoRetiro.DAVIPLATA) {
      if (!/^3\d{9}$/.test(cuenta)) {
        throw new BadRequestException(
          'Para Nequi y Daviplata la cuenta debe ser un celular colombiano de 10 dígitos que empiece por 3.',
        );
      }
      return;
    }

    if (!/^\d{6,20}$/.test(cuenta)) {
      throw new BadRequestException(
        'La cuenta bancaria debe tener entre 6 y 20 dígitos.',
      );
    }
  }

  private enmascararCuenta(cuenta: string): string {
    return `${'*'.repeat(Math.max(0, cuenta.length - 4))}${cuenta.slice(-4)}`;
  }
}
