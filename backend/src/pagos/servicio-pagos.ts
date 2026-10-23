import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { calcularDesglose, DesglosePago, formatearCop } from '../comun/dinero.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  EstadoAlquiler,
  EstadoPago,
  EstadoTransaccion,
  TipoTransaccion,
} from '../generated/prisma/enums.js';
import {
  ServicioPasarelaSandbox,
  type ResultadoCobro,
} from '../pasarela/servicio-pasarela-sandbox.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { HistorialPagosDto } from './dto/historial-pagos.dto.js';

type PagoConAlquiler = Prisma.PagoGetPayload<{
  include: { alquiler: { include: { articulo: { select: { titulo: true } } } } };
}>;

/** Campos mínimos que necesita una respuesta de pago. */
interface PagoParaRespuesta {
  id: string;
  alquilerId: string;
  monto: number;
  comision: number;
  montoPropietario: number;
  moneda: string;
  metodo: string;
  estado: EstadoPago;
  idTransaccion: string | null;
  errorMensaje: string | null;
  pagadoEn: Date | null;
  creadoEn: Date;
  alquiler: { articulo: { titulo: string } };
}

type AlquilerConPago = Prisma.AlquilerGetPayload<{
  include: { articulo: true; pago: true };
}>;

const ESTADOS_QUE_OCUPAN_AGENDA: EstadoAlquiler[] = [
  EstadoAlquiler.PENDIENTE_ENTREGA,
  EstadoAlquiler.ACTIVO,
  EstadoAlquiler.PENDIENTE_DEVOLUCION,
  EstadoAlquiler.EN_MORA,
];

/**
 * HU-06 — Procesamiento de pago y comisión.
 *
 * Reglas implementadas:
 * - La comisión de UniTrade es el 12% del subtotal (RN-08).
 * - El arrendatario paga el subtotal y el propietario recibe
 *   `subtotal - comisión` en su billetera.
 * - Los montos se calculan en el servidor; nunca se confía en el cliente.
 * - El cobro se simula con la pasarela sandbox y es idempotente por
 *   `alquilerId` y por el header `Idempotency-Key`.
 */
@Injectable()
export class ServicioPagos {
  private readonly logger = new Logger(ServicioPagos.name);

  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly pasarela: ServicioPasarelaSandbox,
  ) {}

  async checkout(dto: CheckoutDto, usuarioId: string, claveIdempotencia?: string) {
    await this.validarUsuario(usuarioId);

    const clave = claveIdempotencia?.trim() || undefined;
    if (clave && clave.length > 120) {
      throw new BadRequestException('La clave de idempotencia no puede superar 120 caracteres.');
    }

    if (clave) {
      const pagoPrevio = await this.prisma.pago.findUnique({
        where: { claveIdempotencia: clave },
        include: { alquiler: { include: { articulo: { select: { titulo: true } } } } },
      });

      if (pagoPrevio) {
        this.verificarPropietarioDelPago(pagoPrevio, usuarioId);
        if (pagoPrevio.estado === EstadoPago.COMPLETADO) {
          return this.respuestaExitosa(
            pagoPrevio,
            undefined,
            pagoPrevio.alquiler.codigoVerificacion ?? undefined,
          );
        }
        throw new ConflictException(
          'Ya existe un pago con esa clave de idempotencia que no está completado.',
        );
      }
    }

    const alquiler = await this.obtenerAlquiler(dto, usuarioId);

    if (alquiler.pago?.estado === EstadoPago.COMPLETADO) {
      return this.respuestaExitosa({
        ...alquiler.pago,
        alquiler: { articulo: { titulo: alquiler.articulo.titulo } },
      }, undefined, alquiler.codigoVerificacion ?? undefined);
    }

    if (!Number.isInteger(alquiler.subtotal) || alquiler.subtotal <= 0) {
      throw new ConflictException('La reserva tiene un subtotal inválido.');
    }

    const desglose = calcularDesglose(alquiler.subtotal);
    const moneda = dto.moneda ?? 'COP';
    const metodo = dto.metodo?.trim().toLowerCase() || 'sandbox';

    if (
      alquiler.comision !== desglose.comision ||
      alquiler.total !== desglose.total
    ) {
      await this.prisma.alquiler.update({
        where: { id: alquiler.id },
        data: {
          comision: desglose.comision,
          total: desglose.total,
        },
      });
    }

    const datosPago = {
      monto: desglose.total,
      comision: desglose.comision,
      montoPropietario: desglose.montoPropietario,
      moneda,
      metodo,
      estado: EstadoPago.PROCESANDO,
      errorMensaje: null,
    };

    const pago = await this.prisma.pago.upsert({
      where: { alquilerId: alquiler.id },
      create: {
        alquilerId: alquiler.id,
        claveIdempotencia: clave,
        ...datosPago,
      },
      update: {
        ...datosPago,
        ...(clave ? { claveIdempotencia: clave } : {}),
      },
    });

    const referencia = `alquiler:${alquiler.id}`;
    let cobro: ResultadoCobro;

    try {
      cobro = await this.pasarela.cobrar({
        monto: pago.monto,
        moneda: pago.moneda,
        referencia,
        forzarFallo: dto.forzarFallo,
      });
    } catch (error) {
      this.logger.error(`Error de comunicación con la pasarela: ${String(error)}`);
      await this.marcarPagoFallido(
        pago.id,
        'No fue posible comunicarse con la pasarela de pagos.',
        'ERROR_PASARELA',
      );
      throw new HttpException(
        {
          exito: false,
          codigo: 'ERROR_PASARELA',
          mensaje: 'No fue posible comunicarse con la pasarela de pagos.',
          pagoId: pago.id,
          alquilerId: alquiler.id,
          desglose,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!cobro.exito) {
      await this.marcarPagoFallido(pago.id, cobro.mensaje, cobro.codigoRespuesta, cobro.idTransaccion);

      throw new HttpException(
        {
          exito: false,
          codigo: cobro.codigoRespuesta,
          mensaje: cobro.mensaje,
          pagoId: pago.id,
          alquilerId: alquiler.id,
          transaccionId: cobro.idTransaccion,
          estado: EstadoPago.FALLIDO,
          desglose,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const pagado = await this.prisma.$transaction(async (tx) => {
      const pagoCompletado = await tx.pago.update({
        where: { id: pago.id },
        data: {
          estado: EstadoPago.COMPLETADO,
          idTransaccion: cobro.idTransaccion,
          pagadoEn: cobro.fecha,
          errorMensaje: null,
          metadata: {
            pasarela: 'sandbox',
            codigoRespuesta: cobro.codigoRespuesta,
            referencia,
          },
        },
      });

      const billetera = await tx.billetera.upsert({
        where: { usuarioId: alquiler.propietarioId },
        create: {
          usuarioId: alquiler.propietarioId,
          saldoDisponible: desglose.montoPropietario,
          totalGanado: desglose.montoPropietario,
        },
        update: {
          saldoDisponible: { increment: desglose.montoPropietario },
          totalGanado: { increment: desglose.montoPropietario },
        },
      });

      await tx.transaccionBilletera.create({
        data: {
          billeteraId: billetera.id,
          tipo: TipoTransaccion.INGRESO,
          monto: desglose.montoPropietario,
          saldoDespues: billetera.saldoDisponible,
          descripcion: `Pago de alquiler: ${alquiler.articulo.titulo}`,
          estado: EstadoTransaccion.COMPLETADO,
          metadata: {
            pagoId: pagoCompletado.id,
            alquilerId: alquiler.id,
            transaccionId: cobro.idTransaccion,
            subtotal: desglose.subtotal,
            comision: desglose.comision,
            total: desglose.total,
          },
        },
      });

      return pagoCompletado;
    });

    this.logger.log(
      `Pago ${pagado.id} completado. Propietario ${alquiler.propietarioId} recibe ${formatearCop(desglose.montoPropietario)}.`,
    );

    return {
      exito: true,
      estado: pagado.estado,
      pagoId: pagado.id,
      transaccionId: pagado.idTransaccion,
      alquilerId: alquiler.id,
      articulo: alquiler.articulo.titulo,
      moneda: pagado.moneda,
      metodo: pagado.metodo,
      desglose,
      fecha: (pagado.pagadoEn ?? pagado.creadoEn).toISOString(),
      codigoDevolucion: alquiler.codigoVerificacion,
      mensaje: 'Pago aprobado en sandbox. Reserva confirmada y saldo abonado al propietario.',
    };
  }

  /** Consulta una transacción por su id de pasarela o por el id del pago. */
  async consultarEstado(identificador: string) {
    const pago = await this.prisma.pago.findFirst({
      where: {
        OR: [{ idTransaccion: identificador }, { id: identificador }],
      },
      include: { alquiler: { include: { articulo: { select: { titulo: true } } } } },
    });

    if (!pago) {
      throw new NotFoundException('No existe una transacción con ese identificador.');
    }

    return this.respuestaExitosa(
      pago,
      pago.estado === EstadoPago.COMPLETADO
        ? 'Pago completado.'
        : 'El pago no está completado.',
    );
  }

  /** Historial de pagos del usuario, como arrendatario o como propietario. */
  async historial(usuarioId: string, dto: HistorialPagosDto) {
    await this.validarUsuario(usuarioId);

    const limite = dto.limite ?? 20;
    const rol = dto.rol ?? 'ARRENDATARIO';
    const where: Prisma.PagoWhereInput =
      rol === 'PROPIETARIO'
        ? { alquiler: { propietarioId: usuarioId } }
        : { alquiler: { arrendatarioId: usuarioId } };

    const pagos = await this.prisma.pago.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: limite,
      include: { alquiler: { include: { articulo: { select: { titulo: true } } } } },
    });

    return pagos.map((pago) => ({
      id: pago.id,
      transaccionId: pago.idTransaccion,
      alquilerId: pago.alquilerId,
      articulo: pago.alquiler.articulo.titulo,
      concepto: `Reserva: ${pago.alquiler.articulo.titulo}`,
      monto: pago.monto,
      comision: pago.comision,
      montoPropietario: pago.montoPropietario,
      moneda: pago.moneda,
      metodo: pago.metodo,
      estado: pago.estado,
      fecha: (pago.pagadoEn ?? pago.creadoEn).toISOString(),
      error: pago.errorMensaje,
    }));
  }

  private async validarUsuario(usuarioId: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario indicado no existe.');
    }
  }

  private verificarPropietarioDelPago(pago: PagoConAlquiler, usuarioId: string): void {
    const alquiler = pago.alquiler as PagoConAlquiler['alquiler'] & {
      arrendatarioId?: string;
    };

    if (alquiler.arrendatarioId && alquiler.arrendatarioId !== usuarioId) {
      throw new ForbiddenException('Ese pago pertenece a otro usuario.');
    }
  }

  /**
   * Devuelve el alquiler que se va a pagar. Si el cliente envía `alquilerId`
   * se valida la reserva existente; si envía `articuloId` + `horas` se crea.
   */
  private async obtenerAlquiler(
    dto: CheckoutDto,
    usuarioId: string,
  ): Promise<AlquilerConPago> {
    if (dto.alquilerId) {
      const alquiler = await this.prisma.alquiler.findUnique({
        where: { id: dto.alquilerId },
        include: { articulo: true, pago: true },
      });

      if (!alquiler) {
        throw new NotFoundException('La reserva indicada no existe.');
      }
      if (alquiler.arrendatarioId !== usuarioId) {
        throw new ForbiddenException('La reserva pertenece a otro usuario.');
      }
      if (alquiler.estado === EstadoAlquiler.CANCELADO) {
        throw new ConflictException('La reserva está cancelada y no se puede pagar.');
      }

      return alquiler;
    }

    const articuloId = dto.articuloId ?? dto.itemId;
    if (!articuloId || !dto.horas) {
      throw new BadRequestException(
        'Envía alquilerId o, en su defecto, articuloId (itemId) y horas.',
      );
    }

    const articulo = await this.prisma.articulo.findUnique({
      where: { id: articuloId },
    });

    if (!articulo) {
      throw new NotFoundException('El artículo indicado no existe.');
    }
    if (!articulo.activo) {
      throw new ConflictException('El artículo no está disponible para alquiler.');
    }
    if (articulo.propietarioId === usuarioId) {
      throw new BadRequestException('No puedes alquilar tu propio artículo.');
    }

    const inicio = dto.inicio ?? new Date();
    const fin = dto.fin ?? new Date(inicio.getTime() + dto.horas * 60 * 60 * 1000);

    if (fin <= inicio) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio.');
    }
    if (inicio < articulo.disponibleDesde || fin > articulo.disponibleHasta) {
      throw new ConflictException(
        'El horario solicitado está fuera de la disponibilidad del artículo.',
      );
    }

    const cruce = await this.prisma.alquiler.findFirst({
      where: {
        articuloId,
        estado: { in: ESTADOS_QUE_OCUPAN_AGENDA },
        inicio: { lt: fin },
        fin: { gt: inicio },
      },
      select: { id: true },
    });

    if (cruce) {
      throw new ConflictException('El artículo ya está reservado en ese horario.');
    }

    if (articulo.tarifaHora <= 0) {
      throw new ConflictException('El artículo no tiene una tarifa por hora válida.');
    }

    const desglose = calcularDesglose(dto.horas * articulo.tarifaHora);

    const creado = await this.prisma.alquiler.create({
      data: {
        articuloId: articulo.id,
        arrendatarioId: usuarioId,
        propietarioId: articulo.propietarioId,
        codigoVerificacion: String(randomInt(1000, 10_000)),
        inicio,
        fin,
        horas: dto.horas,
        subtotal: desglose.subtotal,
        comision: desglose.comision,
        total: desglose.total,
      },
      include: { articulo: true, pago: true },
    });

    return creado;
  }

  private async marcarPagoFallido(
    pagoId: string,
    mensaje: string,
    codigo: string,
    idTransaccion?: string,
  ): Promise<void> {
    await this.prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: EstadoPago.FALLIDO,
        errorMensaje: mensaje,
        idTransaccion,
        metadata: { pasarela: 'sandbox', codigoRespuesta: codigo },
      },
    });
  }

  private respuestaExitosa(
    pago: PagoParaRespuesta,
    mensaje = 'Pago ya estaba completado; se devolvió el mismo resultado sin cobrar dos veces.',
    codigoDevolucion?: string,
  ) {
    const desglose: DesglosePago = {
      subtotal: pago.monto,
      comision: pago.comision,
      total: pago.monto,
      montoPropietario: pago.montoPropietario,
      porcentajeComision:
        pago.monto > 0 ? Number((pago.comision / pago.monto).toFixed(4)) : 0,
    };

    return {
      exito: pago.estado === EstadoPago.COMPLETADO,
      estado: pago.estado,
      pagoId: pago.id,
      transaccionId: pago.idTransaccion,
      alquilerId: pago.alquilerId,
      articulo: pago.alquiler.articulo.titulo,
      moneda: pago.moneda,
      metodo: pago.metodo,
      desglose,
      fecha: (pago.pagadoEn ?? pago.creadoEn).toISOString(),
      error: pago.errorMensaje,
      ...(codigoDevolucion ? { codigoDevolucion } : {}),
      mensaje,
    };
  }
}
