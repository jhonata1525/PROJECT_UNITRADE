import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { calcularDesglose, PORCENTAJE_COMISION } from '../comun/dinero.js';
import { Prisma } from '../generated/prisma/client.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
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

/**
 * Consulta de reservas (solo lectura).
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

    return reservas.map((reserva) => {
      const desglose = calcularDesglose(reserva.subtotal);

      return {
        id: reserva.id,
        estado: reserva.estado,
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
    });
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
    return this.formatearDetalle(reserva);
  }

  private formatearDetalle(reserva: ReservaDetalle) {
    const desglose = calcularDesglose(reserva.subtotal);

    return {
      id: reserva.id,
      estado: reserva.estado,
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
