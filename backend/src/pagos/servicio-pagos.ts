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
import { randomInt, randomUUID } from 'node:crypto';
import {
  calcularDesglose,
  DesglosePago,
  formatearCop,
} from '../comun/dinero.js';
import { intervaloDentroDisponibilidad } from '../comun/disponibilidad.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  EstadoAlquiler,
  EstadoPago,
  EstadoTransaccion,
  TipoTransaccion,
} from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { HistorialPagosDto } from './dto/historial-pagos.dto.js';

type PagoConAlquiler = Prisma.PagoGetPayload<{
  include: {
    alquiler: { include: { articulo: { select: { titulo: true } } } };
  };
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

class SaldoInsuficienteError extends Error {}

/**
 * HU-06 — Procesamiento de pago y comisión.
 *
 * Reglas implementadas:
 * - La comisión de UniTrade es el 12% del subtotal (RN-08).
 * - El arrendatario paga el subtotal y el propietario recibe
 *   `subtotal - comisión` en su billetera.
 * - Los montos se calculan en el servidor; nunca se confía en el cliente.
 * - El pago se debita de la billetera del arrendatario y es idempotente por
 *   `alquilerId` y por el header `Idempotency-Key`.
 */
@Injectable()
export class ServicioPagos {
  private readonly logger = new Logger(ServicioPagos.name);

  constructor(private readonly prisma: ServicioPrisma) {}

  async checkout(
    dto: CheckoutDto,
    usuarioId: string,
    claveIdempotencia?: string,
  ) {
    await this.validarUsuario(usuarioId);

    const clave = claveIdempotencia?.trim() || undefined;
    if (clave && clave.length > 120) {
      throw new BadRequestException(
        'La clave de idempotencia no puede superar 120 caracteres.',
      );
    }

    if (clave) {
      const pagoPrevio = await this.prisma.pago.findUnique({
        where: { claveIdempotencia: clave },
        include: {
          alquiler: { include: { articulo: { select: { titulo: true } } } },
        },
      });

      if (pagoPrevio) {
        this.verificarPropietarioDelPago(pagoPrevio, usuarioId);
        if (pagoPrevio.estado === EstadoPago.COMPLETADO) {
          return this.respuestaExitosa(pagoPrevio, undefined, {
            codigoEntrega: pagoPrevio.alquiler.codigoEntrega,
            codigoQrEntrega: pagoPrevio.alquiler.codigoQrEntrega,
            codigoDevolucion: pagoPrevio.alquiler.codigoVerificacion,
            codigoQrDevolucion: pagoPrevio.alquiler.codigoQr,
          });
        }
        throw new ConflictException(
          'Ya existe un pago con esa clave de idempotencia que no está completado.',
        );
      }
    }

    if (!dto.alquilerId) {
      const ahora = new Date();
      const bloqueado = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { suspendidoPorMora: true },
      });
      const moraQueBloquea = await this.prisma.alquiler.findFirst({
        where: {
          arrendatarioId: usuarioId,
          fin: { lt: new Date(ahora.getTime() - 2 * 60 * 60 * 1000) },
          OR: [
            {
              estado: {
                in: [EstadoAlquiler.ACTIVO, EstadoAlquiler.EN_MORA],
              },
            },
            {
              estado: EstadoAlquiler.COMPLETADO,
              moraMonto: { gt: 0 },
              moraPagoEstado: { not: EstadoPago.COMPLETADO },
            },
          ],
        },
        select: { id: true },
      });
      if (moraQueBloquea && !bloqueado?.suspendidoPorMora) {
        await this.prisma.usuario.updateMany({
          where: { id: usuarioId, suspendidoPorMora: false },
          data: { suspendidoPorMora: true },
        });
      } else if (!moraQueBloquea && bloqueado?.suspendidoPorMora) {
        await this.prisma.usuario.updateMany({
          where: { id: usuarioId, suspendidoPorMora: true },
          data: { suspendidoPorMora: false },
        });
      }
      if (moraQueBloquea) {
        throw new ConflictException(
          'Tu cuenta está suspendida para nuevas reservas. Devuelve el artículo y paga el recargo por mora pendiente.',
        );
      }
    }

    const alquiler = await this.obtenerAlquiler(dto, usuarioId);

    if (alquiler.pago?.estado === EstadoPago.COMPLETADO) {
      return this.respuestaExitosa(
        {
          ...alquiler.pago,
          alquiler: { articulo: { titulo: alquiler.articulo.titulo } },
        },
        undefined,
        {
          codigoEntrega: alquiler.codigoEntrega,
          codigoQrEntrega: alquiler.codigoQrEntrega,
          codigoDevolucion: alquiler.codigoVerificacion,
          codigoQrDevolucion: alquiler.codigoQr,
        },
      );
    }

    if (!Number.isInteger(alquiler.subtotal) || alquiler.subtotal <= 0) {
      throw new ConflictException('La reserva tiene un subtotal inválido.');
    }

    const desglose = calcularDesglose(alquiler.subtotal);
    const moneda = dto.moneda ?? 'COP';
    const metodo = 'billetera';

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
      errorMensaje: null,
    };

    const pago = await this.prisma.pago.upsert({
      where: { alquilerId: alquiler.id },
      create: {
        alquilerId: alquiler.id,
        claveIdempotencia: clave,
        estado: EstadoPago.PENDIENTE,
        ...datosPago,
      },
      update: {
        ...datosPago,
        ...(clave ? { claveIdempotencia: clave } : {}),
      },
    });

    const reclamo = await this.prisma.pago.updateMany({
      where: {
        id: pago.id,
        estado: { in: [EstadoPago.PENDIENTE, EstadoPago.FALLIDO] },
      },
      data: {
        estado: EstadoPago.PROCESANDO,
        errorMensaje: null,
        idTransaccion: null,
        pagadoEn: null,
        ...(clave ? { claveIdempotencia: clave } : {}),
      },
    });

    if (reclamo.count === 0) {
      const pagoActual = await this.prisma.pago.findUnique({
        where: { id: pago.id },
        include: {
          alquiler: { include: { articulo: { select: { titulo: true } } } },
        },
      });
      if (pagoActual?.estado === EstadoPago.COMPLETADO) {
        return this.respuestaExitosa(pagoActual);
      }
      throw new ConflictException(
        'Este pago ya se está procesando. Espera un momento y consulta el estado de la reserva.',
      );
    }

    const idTransaccion = randomUUID();
    const fechaPago = new Date();
    let pagado: PagoConAlquiler;

    try {
      pagado = await this.prisma.$transaction(async (tx) => {
        const descuento = await tx.billetera.updateMany({
          where: {
            usuarioId,
            saldoDisponible: { gte: pago.monto },
          },
          data: { saldoDisponible: { decrement: pago.monto } },
        });

        if (descuento.count === 0) {
          throw new SaldoInsuficienteError();
        }

        const billeteraArrendatario = await tx.billetera.findUniqueOrThrow({
          where: { usuarioId },
        });
        const pagoActualizado = await tx.pago.updateMany({
          where: { id: pago.id, estado: EstadoPago.PROCESANDO },
          data: {
            estado: EstadoPago.COMPLETADO,
            idTransaccion,
            pagadoEn: fechaPago,
            errorMensaje: null,
            metadata: {
              proveedor: 'billetera',
              alquilerId: alquiler.id,
              total: desglose.total,
            },
          },
        });
        if (pagoActualizado.count === 0) {
          throw new ConflictException(
            'El pago cambió de estado y no pudo completarse.',
          );
        }

        const pagoCompletado = await tx.pago.findUniqueOrThrow({
          where: { id: pago.id },
          include: {
            alquiler: { include: { articulo: { select: { titulo: true } } } },
          },
        });
        const billeteraPropietario = await tx.billetera.upsert({
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
            billeteraId: billeteraArrendatario.id,
            tipo: TipoTransaccion.PAGO_ALQUILER,
            monto: pago.monto,
            saldoDespues: billeteraArrendatario.saldoDisponible,
            descripcion: `Pago de alquiler: ${alquiler.articulo.titulo}`,
            estado: EstadoTransaccion.COMPLETADO,
            metadata: { pagoId: pago.id, alquilerId: alquiler.id },
          },
        });
        await tx.transaccionBilletera.create({
          data: {
            billeteraId: billeteraPropietario.id,
            tipo: TipoTransaccion.INGRESO,
            monto: desglose.montoPropietario,
            saldoDespues: billeteraPropietario.saldoDisponible,
            descripcion: `Pago de alquiler: ${alquiler.articulo.titulo}`,
            estado: EstadoTransaccion.COMPLETADO,
            metadata: {
              pagoId: pagoCompletado.id,
              alquilerId: alquiler.id,
              transaccionId: idTransaccion,
              subtotal: desglose.subtotal,
              comision: desglose.comision,
              total: desglose.total,
            },
          },
        });

        return pagoCompletado;
      });
    } catch (error) {
      if (!(error instanceof SaldoInsuficienteError)) {
        await this.marcarPagoFallido(
          pago.id,
          'No se pudo completar el pago desde la billetera.',
          'ERROR_BILLETERA',
        );
        throw error;
      }

      const mensaje = `Saldo insuficiente. Recarga tu billetera: necesitas ${formatearCop(pago.monto)}.`;
      await this.marcarPagoFallido(pago.id, mensaje, 'SALDO_INSUFICIENTE');
      if (!dto.alquilerId) {
        await this.prisma.alquiler.update({
          where: { id: alquiler.id },
          data: { estado: EstadoAlquiler.CANCELADO },
        });
      }
      throw new HttpException(
        {
          exito: false,
          codigo: 'SALDO_INSUFICIENTE',
          mensaje,
          pagoId: pago.id,
          alquilerId: alquiler.id,
          desglose,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

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
      codigoEntrega: alquiler.codigoEntrega,
      codigoQrEntrega: alquiler.codigoQrEntrega,
      codigoDevolucion: alquiler.codigoVerificacion,
      codigoQrDevolucion: alquiler.codigoQr,
      mensaje:
        'Pago descontado de tu billetera. Reserva confirmada y saldo abonado al propietario.',
    };
  }

  /** Consulta una transacción por su id de billetera o por el id del pago. */
  async consultarEstado(identificador: string) {
    const pago = await this.prisma.pago.findFirst({
      where: {
        OR: [{ idTransaccion: identificador }, { id: identificador }],
      },
      include: {
        alquiler: { include: { articulo: { select: { titulo: true } } } },
      },
    });

    if (!pago) {
      throw new NotFoundException(
        'No existe una transacción con ese identificador.',
      );
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
      include: {
        alquiler: { include: { articulo: { select: { titulo: true } } } },
      },
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

  private async validarUsuario(usuarioId: string): Promise<{ id: string }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario indicado no existe.');
    }
    return usuario;
  }

  private verificarPropietarioDelPago(
    pago: PagoConAlquiler,
    usuarioId: string,
  ): void {
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
        throw new ConflictException(
          'La reserva está cancelada y no se puede pagar.',
        );
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
      throw new ConflictException(
        'El artículo no está disponible para alquiler.',
      );
    }
    if (articulo.propietarioId === usuarioId) {
      throw new BadRequestException('No puedes alquilar tu propio artículo.');
    }

    const inicio = dto.inicio ?? new Date();
    const fin =
      dto.fin ?? new Date(inicio.getTime() + dto.horas * 60 * 60 * 1000);

    if (fin <= inicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la de inicio.',
      );
    }
    if (inicio < articulo.disponibleDesde || fin > articulo.disponibleHasta) {
      throw new ConflictException(
        'El horario solicitado está fuera de la disponibilidad del artículo.',
      );
    }

    const propietario = await this.prisma.usuario.findUnique({
      where: { id: articulo.propietarioId },
      select: { disponibilidad: true },
    });
    if (
      !intervaloDentroDisponibilidad(propietario?.disponibilidad, inicio, fin)
    ) {
      throw new ConflictException(
        'El horario solicitado está fuera de las franjas de disponibilidad del propietario en el campus.',
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
      throw new ConflictException(
        'El artículo ya está reservado en ese horario.',
      );
    }

    if (articulo.tarifaHora <= 0) {
      throw new ConflictException(
        'El artículo no tiene una tarifa por hora válida.',
      );
    }

    const desglose = calcularDesglose(dto.horas * articulo.tarifaHora);

    const creado = await this.prisma.alquiler.create({
      data: {
        articuloId: articulo.id,
        arrendatarioId: usuarioId,
        propietarioId: articulo.propietarioId,
        codigoEntrega: String(randomInt(1000, 10_000)),
        codigoVerificacion: String(randomInt(1000, 10_000)),
        codigoQrEntrega: randomUUID(),
        codigoQr: randomUUID(),
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
  ): Promise<void> {
    await this.prisma.pago.updateMany({
      where: { id: pagoId, estado: EstadoPago.PROCESANDO },
      data: {
        estado: EstadoPago.FALLIDO,
        errorMensaje: mensaje,
        metadata: { proveedor: 'billetera', codigoRespuesta: codigo },
      },
    });
  }

  private respuestaExitosa(
    pago: PagoParaRespuesta,
    mensaje = 'Pago ya estaba completado; se devolvió el mismo resultado sin cobrar dos veces.',
    codigos?: {
      codigoEntrega: string | null;
      codigoQrEntrega: string | null;
      codigoDevolucion: string | null;
      codigoQrDevolucion: string | null;
    },
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
      ...(codigos?.codigoEntrega
        ? { codigoEntrega: codigos.codigoEntrega }
        : {}),
      ...(codigos?.codigoQrEntrega
        ? { codigoQrEntrega: codigos.codigoQrEntrega }
        : {}),
      ...(codigos?.codigoDevolucion
        ? { codigoDevolucion: codigos.codigoDevolucion }
        : {}),
      ...(codigos?.codigoQrDevolucion
        ? { codigoQrDevolucion: codigos.codigoQrDevolucion }
        : {}),
      mensaje,
    };
  }
}
