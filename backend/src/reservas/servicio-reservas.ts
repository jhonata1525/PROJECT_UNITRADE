import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { calcularDesglose, PORCENTAJE_COMISION } from '../comun/dinero.js';
import { Prisma } from '../generated/prisma/client.js';
import { EstadoAlquiler, EstadoPago } from '../generated/prisma/enums.js';
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

/**
 * Consulta de reservas y confirmación de devoluciones.
 *
 * Complementa HU-06: el frontend puede mostrar el desglose de comisión de una
 * reserva antes o después de pagarla sin recalcular nada por su cuenta.
 */
@Injectable()
export class ServicioReservas {
  constructor(private readonly prisma: ServicioPrisma) {}

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
        pago: { select: { id: true, estado: true, idTransaccion: true } },
      },
    });

    return Promise.all(reservas.map(async (reserva) => {
      const desglose = calcularDesglose(reserva.subtotal);
      const puedeVerCodigo =
        rol === 'ARRENDATARIO' &&
        reserva.pago?.estado === EstadoPago.COMPLETADO;
      let codigoDevolucion = reserva.codigoVerificacion;

      if (
        puedeVerCodigo &&
        !codigoDevolucion &&
        ESTADOS_ALQUILER_PENDIENTE.includes(reserva.estado)
      ) {
        const codigoNuevo = String(randomInt(1000, 10_000));
        const actualizacion = await this.prisma.alquiler.updateMany({
          where: {
            id: reserva.id,
            codigoVerificacion: null,
            estado: { in: ESTADOS_ALQUILER_PENDIENTE },
          },
          data: { codigoVerificacion: codigoNuevo },
        });

        codigoDevolucion =
          actualizacion.count === 1
            ? codigoNuevo
            : (await this.prisma.alquiler.findUnique({
                where: { id: reserva.id },
                select: { codigoVerificacion: true },
              }))?.codigoVerificacion ?? null;
      }

      return {
        id: reserva.id,
        estado: reserva.estado,
        ...(puedeVerCodigo && codigoDevolucion
          ? { codigoDevolucion }
          : {}),
        inicio: reserva.inicio.toISOString(),
        fin: reserva.fin.toISOString(),
        horas: reserva.horas,
        articulo: reserva.articulo,
        subtotal: desglose.subtotal,
        comision: desglose.comision,
        total: desglose.total,
        montoPropietario: desglose.montoPropietario,
        porcentajeComision: PORCENTAJE_COMISION,
        pago: reserva.pago,
        creadoEn: reserva.creadoEn.toISOString(),
      };
    }));
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
        codigoVerificacion: codigo,
        estado: { in: ESTADOS_ALQUILER_PENDIENTE },
        pago: { is: { estado: EstadoPago.COMPLETADO } },
      },
      orderBy: { creadoEn: 'desc' },
      select: { id: true, codigoVerificacion: true, estado: true },
    });

    if (!reserva) {
      throw new BadRequestException(
        'El código no es correcto o no corresponde a un alquiler pendiente de devolución.',
      );
    }

    const actualizacion = await this.prisma.$transaction(async (tx) => {
      const alquilerActualizado = await tx.alquiler.updateMany({
        where: {
          id: reserva.id,
          articuloId,
          propietarioId,
          codigoVerificacion: codigo,
          estado: { in: ESTADOS_ALQUILER_PENDIENTE },
        },
        data: { estado: EstadoAlquiler.COMPLETADO },
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

      return alquilerActualizado;
    });

    if (actualizacion.count !== 1) {
      throw new ConflictException('No se pudo confirmar la devolución.');
    }

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
      mensaje:
        alquileresPendientes > 0
          ? 'Devolución confirmada. El artículo sigue reservado en otro alquiler.'
          : 'Devolución confirmada. El artículo ya está disponible.',
    };
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

  private verificarParticipante(reserva: ReservaDetalle, usuarioId: string): void {
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
