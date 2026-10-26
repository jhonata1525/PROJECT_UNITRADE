import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { ServicioPasarelaSandbox } from '../pasarela/servicio-pasarela-sandbox.js';
import { calcularDesglose, PORCENTAJE_COMISION } from '../comun/dinero.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  EstadoAlquiler,
  EstadoPago,
  EstadoTransaccion,
  TipoTransaccion,
} from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import type { ConfirmarDevolucionDto } from './dto/confirmar-devolucion.dto.js';
import { ListarReservasDto } from './dto/listar-reservas.dto.js';

type ReservaDetalle = Prisma.AlquilerGetPayload<{
  include: {
    articulo: {
      select: {
        id: true;
        titulo: true;
        tarifaHora: true;
        imagenes: true;
        ubicacion: true;
      };
    };
    propietario: { select: { id: true; nombre: true; correo: true } };
    arrendatario: { select: { id: true; nombre: true; correo: true } };
    pago: true;
  };
}>;

const ESTADOS_ALQUILER_PENDIENTE: EstadoAlquiler[] = [
  EstadoAlquiler.PENDIENTE_ENTREGA,
  EstadoAlquiler.ACTIVO,
  EstadoAlquiler.PENDIENTE_DEVOLUCION,
  EstadoAlquiler.EN_MORA,
];
const HORA_MS = 60 * 60 * 1000;
const GRACIA_MORA_MS = 15 * 60 * 1000;
const SUSPENSION_MORA_MS = 2 * HORA_MS;

/**
 * Consulta de reservas y confirmación de devoluciones.
 *
 * Complementa HU-06: el frontend puede mostrar el desglose de comisión de una
 * reserva antes o después de pagarla sin recalcular nada por su cuenta.
 */
@Injectable()
export class ServicioReservas implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServicioReservas.name);
  private temporizadorMora?: ReturnType<typeof setInterval>;
  private actualizandoMoras = false;

  constructor(
    private readonly prisma: ServicioPrisma,
    private readonly pasarela: ServicioPasarelaSandbox,
  ) {}

  onModuleInit(): void {
    this.temporizadorMora = setInterval(() => {
      void this.actualizarMoras().catch((error: unknown) => {
        this.logger.error(
          `No se pudieron actualizar las moras: ${String(error)}`,
        );
      });
    }, 60_000);
    this.temporizadorMora.unref?.();
    void this.actualizarMoras().catch((error: unknown) => {
      this.logger.error(
        `No se pudieron actualizar las moras al iniciar: ${String(error)}`,
      );
    });
  }

  onModuleDestroy(): void {
    if (this.temporizadorMora) clearInterval(this.temporizadorMora);
  }

  async actualizarMoras(ahora = new Date()): Promise<void> {
    if (this.actualizandoMoras) return;
    this.actualizandoMoras = true;

    try {
      const reservasVencidas = await this.prisma.alquiler.findMany({
        where: {
          estado: {
            in: [
              EstadoAlquiler.ACTIVO,
              EstadoAlquiler.PENDIENTE_DEVOLUCION,
              EstadoAlquiler.EN_MORA,
            ],
          },
          fin: { lt: new Date(ahora.getTime() - GRACIA_MORA_MS) },
        },
        select: {
          id: true,
          fin: true,
          moraMonto: true,
          arrendatarioId: true,
          articulo: { select: { tarifaHora: true } },
        },
      });

      for (const reserva of reservasVencidas) {
        const retrasoMs = ahora.getTime() - reserva.fin.getTime();
        const horasFacturables = Math.ceil(
          (retrasoMs - GRACIA_MORA_MS) / HORA_MS,
        );
        const moraMonto = Math.max(
          reserva.moraMonto,
          horasFacturables * reserva.articulo.tarifaHora,
        );

        await this.prisma.alquiler.updateMany({
          where: {
            id: reserva.id,
            estado: {
              in: [
                EstadoAlquiler.ACTIVO,
                EstadoAlquiler.PENDIENTE_DEVOLUCION,
                EstadoAlquiler.EN_MORA,
              ],
            },
            moraMonto: { lt: moraMonto },
          },
          data: { estado: EstadoAlquiler.EN_MORA, moraMonto },
        });

        if (retrasoMs > SUSPENSION_MORA_MS) {
          await this.prisma.usuario.updateMany({
            where: { id: reserva.arrendatarioId, suspendidoPorMora: false },
            data: { suspendidoPorMora: true },
          });
        }
      }
    } finally {
      this.actualizandoMoras = false;
    }
  }

  async listar(usuarioId: string, dto: ListarReservasDto) {
    await this.validarUsuario(usuarioId);

    const rol = dto.rol ?? 'ARRENDATARIO';
    const reservas = await this.prisma.alquiler.findMany({
      where: {
        ...(rol === 'PROPIETARIO'
          ? { propietarioId: usuarioId }
          : { arrendatarioId: usuarioId }),
        ...(dto.estado ? { estado: dto.estado } : {}),
      },
      orderBy: { creadoEn: 'desc' },
      take: dto.limite ?? 20,
      include: {
        articulo: { select: { id: true, titulo: true, imagenes: true } },
        propietario: {
          select: {
            id: true,
            nombre: true,
            calificacion: true,
            totalResenas: true,
          },
        },
        arrendatario: {
          select: {
            id: true,
            nombre: true,
            calificacion: true,
            totalResenas: true,
          },
        },
        pago: { select: { id: true, estado: true, idTransaccion: true } },
        calificaciones: {
          where: { evaluadorId: usuarioId },
          select: {
            id: true,
            estrellas: true,
            comentario: true,
            creadoEn: true,
          },
        },
      },
    });

    return Promise.all(
      reservas.map(async (reserva) => {
        const desglose = calcularDesglose(reserva.subtotal);
        const puedeVerCodigo =
          rol === 'ARRENDATARIO' &&
          reserva.pago?.estado === EstadoPago.COMPLETADO;
        let codigos = {
          codigoEntrega: reserva.codigoEntrega,
          codigoQrEntrega: reserva.codigoQrEntrega,
          codigoDevolucion: reserva.codigoVerificacion,
          codigoQrDevolucion: reserva.codigoQr,
        };

        if (
          puedeVerCodigo &&
          ESTADOS_ALQUILER_PENDIENTE.includes(reserva.estado) &&
          (!codigos.codigoEntrega ||
            !codigos.codigoQrEntrega ||
            !codigos.codigoDevolucion ||
            !codigos.codigoQrDevolucion)
        ) {
          const codigoEntrega =
            codigos.codigoEntrega ?? String(randomInt(1000, 10_000));
          const codigoQrEntrega = codigos.codigoQrEntrega ?? randomUUID();
          const codigoDevolucion =
            codigos.codigoDevolucion ?? String(randomInt(1000, 10_000));
          const codigoQrDevolucion = codigos.codigoQrDevolucion ?? randomUUID();
          const actualizacion = await this.prisma.alquiler.updateMany({
            where: {
              id: reserva.id,
              estado: { in: ESTADOS_ALQUILER_PENDIENTE },
            },
            data: {
              codigoEntrega,
              codigoQrEntrega,
              codigoVerificacion: codigoDevolucion,
              codigoQr: codigoQrDevolucion,
            },
          });

          codigos =
            actualizacion.count === 1
              ? {
                  codigoEntrega,
                  codigoQrEntrega,
                  codigoDevolucion,
                  codigoQrDevolucion,
                }
              : await this.obtenerCodigosReserva(reserva.id);
        }

        return {
          id: reserva.id,
          estado: reserva.estado,
          usuarioCalificado:
            rol === 'ARRENDATARIO' ? reserva.propietario : reserva.arrendatario,
          calificacionPropia: reserva.calificaciones?.[0] ?? null,
          ...(puedeVerCodigo ? codigos : {}),
          inicio: reserva.inicio.toISOString(),
          fin: reserva.fin.toISOString(),
          horas: reserva.horas,
          articulo: reserva.articulo,
          subtotal: desglose.subtotal,
          comision: desglose.comision,
          total: desglose.total,
          montoPropietario: desglose.montoPropietario,
          porcentajeComision: PORCENTAJE_COMISION,
          moraMonto: reserva.moraMonto,
          moraPagada: reserva.moraPagada,
          moraPendiente: Math.max(0, reserva.moraMonto - reserva.moraPagada),
          moraPagoEstado: reserva.moraPagoEstado,
          pago: reserva.pago,
          creadoEn: reserva.creadoEn.toISOString(),
        };
      }),
    );
  }

  async obtener(id: string, usuarioId: string) {
    const reserva = await this.prisma.alquiler.findUnique({
      where: { id },
      include: {
        articulo: {
          select: {
            id: true,
            titulo: true,
            tarifaHora: true,
            imagenes: true,
            ubicacion: true,
          },
        },
        propietario: { select: { id: true, nombre: true, correo: true } },
        arrendatario: { select: { id: true, nombre: true, correo: true } },
        pago: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException('La reserva no existe.');
    }

    this.verificarParticipante(reserva, usuarioId);
    return this.formatearDetalle(reserva, usuarioId);
  }

  async confirmarEntrega(
    articuloId: string,
    codigo: string,
    propietarioId: string,
  ) {
    await this.validarUsuario(propietarioId);
    const reserva = await this.prisma.alquiler.findFirst({
      where: {
        articuloId,
        propietarioId,
        OR: [{ codigoEntrega: codigo }, { codigoQrEntrega: codigo }],
        estado: EstadoAlquiler.PENDIENTE_ENTREGA,
        pago: { is: { estado: EstadoPago.COMPLETADO } },
      },
      select: { id: true },
    });

    if (!reserva) {
      throw new BadRequestException(
        'El código no es correcto o la entrega ya fue confirmada.',
      );
    }

    const actualizacion = await this.prisma.alquiler.updateMany({
      where: {
        id: reserva.id,
        propietarioId,
        estado: EstadoAlquiler.PENDIENTE_ENTREGA,
      },
      data: {
        estado: EstadoAlquiler.ACTIVO,
        entregaConfirmadaEn: new Date(),
      },
    });

    if (actualizacion.count !== 1) {
      throw new ConflictException(
        'La entrega ya se confirmó. Actualiza la página e inténtalo de nuevo.',
      );
    }

    return {
      alquilerId: reserva.id,
      articuloId,
      estado: EstadoAlquiler.ACTIVO,
      mensaje: 'Entrega física confirmada.',
    };
  }

  async confirmarDevolucion(
    articuloId: string,
    codigo: ConfirmarDevolucionDto['codigo'],
    propietarioId: string,
  ) {
    await this.validarUsuario(propietarioId);

    const reserva = await this.prisma.alquiler.findFirst({
      where: {
        articuloId,
        propietarioId,
        OR: [{ codigoVerificacion: codigo }, { codigoQr: codigo }],
        estado: {
          in: [
            EstadoAlquiler.ACTIVO,
            EstadoAlquiler.PENDIENTE_DEVOLUCION,
            EstadoAlquiler.EN_MORA,
          ],
        },
        pago: { is: { estado: EstadoPago.COMPLETADO } },
      },
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true,
        fin: true,
        arrendatarioId: true,
        moraMonto: true,
        moraPagada: true,
        moraPagoEstado: true,
        articulo: { select: { tarifaHora: true } },
      },
    });

    if (!reserva) {
      throw new BadRequestException(
        'El código no es correcto o la entrega física aún no fue confirmada.',
      );
    }

    const retrasoMs = Date.now() - reserva.fin.getTime();
    const moraCalculada = this.calcularMora(
      reserva.fin,
      reserva.articulo.tarifaHora,
      new Date(),
    );
    const moraMonto = Math.max(reserva.moraMonto, moraCalculada);
    const resultado = await this.prisma.$transaction(async (tx) => {
      const alquilerActualizado = await tx.alquiler.updateMany({
        where: {
          id: reserva.id,
          articuloId,
          propietarioId,
          estado: {
            in: [
              EstadoAlquiler.ACTIVO,
              EstadoAlquiler.PENDIENTE_DEVOLUCION,
              EstadoAlquiler.EN_MORA,
            ],
          },
        },
        data: {
          estado: EstadoAlquiler.COMPLETADO,
          devolucionConfirmadaEn: new Date(),
          moraMonto,
        },
      });

      if (alquilerActualizado.count !== 1) {
        throw new ConflictException(
          'El alquiler ya se cerró o cambió. Actualiza la página e inténtalo de nuevo.',
        );
      }

      await tx.articulo.update({
        where: { id: articuloId },
        data: { activo: true },
      });

      const montoPendiente = Math.max(0, moraMonto - reserva.moraPagada);
      let moraPagada = reserva.moraPagada;
      let pagoConBilletera = false;

      if (montoPendiente > 0) {
        const billetera = await tx.billetera.findUnique({
          where: { usuarioId: reserva.arrendatarioId },
        });
        if (billetera) {
          const debito = await tx.billetera.updateMany({
            where: {
              id: billetera.id,
              saldoDisponible: { gte: montoPendiente },
            },
            data: { saldoDisponible: { decrement: montoPendiente } },
          });

          if (debito.count === 1) {
            const actualizada = await tx.billetera.findUniqueOrThrow({
              where: { id: billetera.id },
            });
            await tx.transaccionBilletera.create({
              data: {
                billeteraId: billetera.id,
                tipo: TipoTransaccion.PENALIZACION,
                monto: montoPendiente,
                saldoDespues: actualizada.saldoDisponible,
                descripcion: `Penalización por mora: ${reserva.articulo.tarifaHora}/hora`,
                estado: EstadoTransaccion.COMPLETADO,
                metadata: {
                  alquilerId: reserva.id,
                  moraMonto,
                  retrasoMs,
                },
              },
            });
            moraPagada = moraMonto;
            pagoConBilletera = true;
            await tx.alquiler.update({
              where: { id: reserva.id },
              data: {
                moraPagada,
                moraPagoEstado: EstadoPago.COMPLETADO,
              },
            });
          }
        }
      }

      return { count: alquilerActualizado.count, moraPagada, pagoConBilletera };
    });

    if (resultado.count !== 1) {
      throw new ConflictException('No se pudo confirmar la devolución.');
    }

    let moraPagada = resultado.moraPagada;
    let pagoAutomaticoConPasarela = false;
    let errorCobroAutomatico: string | null = null;
    if (moraMonto > moraPagada) {
      try {
        const cobro = await this.pagarMora(
          reserva.id,
          reserva.arrendatarioId,
        );
        moraPagada = cobro.moraPagada;
        pagoAutomaticoConPasarela = moraPagada >= moraMonto;
      } catch (error) {
        if (!(error instanceof BadRequestException)) {
          throw error;
        }
        errorCobroAutomatico = error.message;
        this.logger.warn(
          `El cobro automático de mora del alquiler ${reserva.id} quedó pendiente: ${error.message}`,
        );
      }
    }

    await this.actualizarBloqueoPorMora(reserva.arrendatarioId);
    const alquileresPendientes = await this.prisma.alquiler.count({
      where: {
        articuloId,
        estado: { in: ESTADOS_ALQUILER_PENDIENTE },
      },
    });

    return {
      alquilerId: reserva.id,
      articuloId,
      estado: EstadoAlquiler.COMPLETADO,
      moraMonto,
      moraPagada,
      moraPendiente: Math.max(0, moraMonto - moraPagada),
      pagoMora:
        moraMonto === 0
          ? 'NO_APLICA'
          : moraPagada >= moraMonto && resultado.pagoConBilletera
            ? 'BILLETERA'
            : moraPagada >= moraMonto && pagoAutomaticoConPasarela
              ? 'PASARELA_AUTOMATICA'
              : 'PENDIENTE',
      mensaje:
        moraMonto > moraPagada
          ? `Devolución confirmada, pero no se pudo cobrar automáticamente el recargo (${moraMonto - moraPagada} COP pendientes). ${errorCobroAutomatico ?? 'Verifica tu medio de pago e inténtalo nuevamente desde Mis Alquileres.'}`
          : alquileresPendientes > 0
            ? `Devolución confirmada y recargo cobrado${pagoAutomaticoConPasarela ? ' automáticamente por la pasarela' : ''}. El artículo sigue reservado en otro alquiler.`
            : `Devolución confirmada y recargo cobrado${pagoAutomaticoConPasarela ? ' automáticamente por la pasarela' : ''}. El artículo ya está disponible.`,
    };
  }

  async pagarMora(alquilerId: string, arrendatarioId: string) {
    await this.validarUsuario(arrendatarioId);
    const reserva = await this.prisma.alquiler.findUnique({
      where: { id: alquilerId },
      select: {
        id: true,
        articuloId: true,
        arrendatarioId: true,
        estado: true,
        moraMonto: true,
        moraPagada: true,
        moraPagoEstado: true,
      },
    });

    if (!reserva) throw new NotFoundException('El alquiler no existe.');
    if (reserva.arrendatarioId !== arrendatarioId) {
      throw new ForbiddenException('Este alquiler pertenece a otro usuario.');
    }
    if (reserva.estado !== EstadoAlquiler.COMPLETADO) {
      throw new ConflictException(
        'El recargo se puede pagar después de confirmar la devolución física.',
      );
    }

    const montoPendiente = reserva.moraMonto - reserva.moraPagada;
    if (montoPendiente <= 0) {
      return {
        alquilerId,
        moraPagada: reserva.moraPagada,
        moraPendiente: 0,
        mensaje: 'El recargo por mora ya está pagado.',
      };
    }

    if (reserva.moraPagoEstado === EstadoPago.PROCESANDO) {
      throw new ConflictException('El pago del recargo ya está en proceso.');
    }
    if (reserva.moraPagoEstado === EstadoPago.COMPLETADO) {
      throw new ConflictException(
        'El pago figura completado, pero el saldo de mora no coincide. Contacta soporte.',
      );
    }

    const reclamo = await this.prisma.alquiler.updateMany({
      where: {
        id: alquilerId,
        arrendatarioId,
        estado: EstadoAlquiler.COMPLETADO,
        moraPagoEstado: EstadoPago.PENDIENTE,
      },
      data: { moraPagoEstado: EstadoPago.PROCESANDO },
    });
    if (reclamo.count !== 1) {
      throw new ConflictException(
        'El recargo cambió mientras se iniciaba el pago. Actualiza e inténtalo otra vez.',
      );
    }

    let cobro;
    try {
      cobro = await this.pasarela.cobrar({
        monto: montoPendiente,
        moneda: 'COP',
        referencia: `mora:${alquilerId}`,
      });
    } catch (error) {
      await this.prisma.alquiler.updateMany({
        where: { id: alquilerId, moraPagoEstado: EstadoPago.PROCESANDO },
        data: { moraPagoEstado: EstadoPago.PENDIENTE },
      });
      this.logger.error(
        `Error al cobrar la mora del alquiler ${alquilerId}: ${String(error)}`,
      );
      throw new BadRequestException(
        'No se pudo procesar el pago del recargo. Inténtalo nuevamente.',
      );
    }

    if (!cobro.exito) {
      await this.prisma.alquiler.updateMany({
        where: { id: alquilerId, moraPagoEstado: EstadoPago.PROCESANDO },
        data: { moraPagoEstado: EstadoPago.PENDIENTE },
      });
      throw new BadRequestException(cobro.mensaje);
    }

    const actualizacion = await this.prisma.alquiler.updateMany({
      where: {
        id: alquilerId,
        arrendatarioId,
        estado: EstadoAlquiler.COMPLETADO,
        moraPagoEstado: EstadoPago.PROCESANDO,
      },
      data: {
        moraPagada: reserva.moraMonto,
        moraPagoEstado: EstadoPago.COMPLETADO,
        moraTransaccionId: cobro.idTransaccion,
      },
    });
    if (actualizacion.count !== 1) {
      throw new ConflictException(
        'El cobro se aprobó pero no se pudo registrar. Contacta soporte con la transacción ' +
          cobro.idTransaccion,
      );
    }

    await this.actualizarBloqueoPorMora(arrendatarioId);
    return {
      alquilerId,
      moraPagada: reserva.moraMonto,
      moraPendiente: 0,
      transaccionId: cobro.idTransaccion,
      mensaje: 'Recargo por mora pagado correctamente.',
    };
  }

  private calcularMora(fin: Date, tarifaHora: number, ahora: Date): number {
    const retrasoFacturable = ahora.getTime() - fin.getTime() - GRACIA_MORA_MS;
    return retrasoFacturable > 0
      ? Math.ceil(retrasoFacturable / HORA_MS) * tarifaHora
      : 0;
  }

  private async obtenerCodigosReserva(alquilerId: string) {
    const reserva = await this.prisma.alquiler.findUnique({
      where: { id: alquilerId },
      select: {
        codigoEntrega: true,
        codigoQrEntrega: true,
        codigoVerificacion: true,
        codigoQr: true,
      },
    });
    return {
      codigoEntrega: reserva?.codigoEntrega ?? null,
      codigoQrEntrega: reserva?.codigoQrEntrega ?? null,
      codigoDevolucion: reserva?.codigoVerificacion ?? null,
      codigoQrDevolucion: reserva?.codigoQr ?? null,
    };
  }

  private async actualizarBloqueoPorMora(usuarioId: string): Promise<void> {
    const antesDe = new Date(Date.now() - SUSPENSION_MORA_MS);
    const moraQueBloquea = await this.prisma.alquiler.findFirst({
      where: {
        arrendatarioId: usuarioId,
        fin: { lt: antesDe },
        OR: [
          {
            estado: {
              in: [
                EstadoAlquiler.ACTIVO,
                EstadoAlquiler.PENDIENTE_DEVOLUCION,
                EstadoAlquiler.EN_MORA,
              ],
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

    await this.prisma.usuario.updateMany({
      where: {
        id: usuarioId,
        suspendidoPorMora: moraQueBloquea ? false : true,
      },
      data: { suspendidoPorMora: Boolean(moraQueBloquea) },
    });
  }

  private formatearDetalle(reserva: ReservaDetalle, usuarioId: string) {
    const desglose = calcularDesglose(reserva.subtotal);

    return {
      id: reserva.id,
      estado: reserva.estado,
      ...(reserva.arrendatarioId === usuarioId &&
      reserva.pago?.estado === EstadoPago.COMPLETADO &&
      reserva.codigoVerificacion
        ? { codigoDevolucion: reserva.codigoVerificacion }
        : {}),
      ...(reserva.arrendatarioId === usuarioId &&
      reserva.pago?.estado === EstadoPago.COMPLETADO &&
      reserva.codigoEntrega
        ? { codigoEntrega: reserva.codigoEntrega }
        : {}),
      ...(reserva.arrendatarioId === usuarioId &&
      reserva.pago?.estado === EstadoPago.COMPLETADO &&
      reserva.codigoQrEntrega
        ? { codigoQrEntrega: reserva.codigoQrEntrega }
        : {}),
      ...(reserva.arrendatarioId === usuarioId &&
      reserva.pago?.estado === EstadoPago.COMPLETADO &&
      reserva.codigoQr
        ? { codigoQrDevolucion: reserva.codigoQr }
        : {}),
      moraMonto: reserva.moraMonto,
      moraPagada: reserva.moraPagada,
      moraPendiente: Math.max(0, reserva.moraMonto - reserva.moraPagada),
      moraPagoEstado: reserva.moraPagoEstado,
      inicio: reserva.inicio.toISOString(),
      fin: reserva.fin.toISOString(),
      horas: reserva.horas,
      articulo: reserva.articulo,
      propietario: reserva.propietario,
      arrendatario: reserva.arrendatario,
      subtotal: desglose.subtotal,
      comision: desglose.comision,
      total: desglose.total,
      montoPropietario: desglose.montoPropietario,
      porcentajeComision: PORCENTAJE_COMISION,
      pago: reserva.pago
        ? {
            id: reserva.pago.id,
            estado: reserva.pago.estado,
            transaccionId: reserva.pago.idTransaccion,
            metodo: reserva.pago.metodo,
            moneda: reserva.pago.moneda,
            pagadoEn: reserva.pago.pagadoEn?.toISOString() ?? null,
          }
        : null,
      creadoEn: reserva.creadoEn.toISOString(),
    };
  }

  private verificarParticipante(
    reserva: ReservaDetalle,
    usuarioId: string,
  ): void {
    if (
      reserva.arrendatarioId !== usuarioId &&
      reserva.propietarioId !== usuarioId
    ) {
      throw new ForbiddenException('No participas en esta reserva.');
    }
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
}
