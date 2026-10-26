import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { EstadoAlquiler } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto.js';

@Injectable()
export class ServicioCalificaciones {
  constructor(private readonly prisma: ServicioPrisma) {}

  async crear(
    alquilerId: string,
    evaluadorId: string,
    dto: CrearCalificacionDto,
  ) {
    if (
      !Number.isInteger(dto.estrellas) ||
      dto.estrellas < 1 ||
      dto.estrellas > 5
    ) {
      throw new BadRequestException(
        'La calificación debe ser un número entero de 1 a 5 estrellas.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const alquiler = await tx.alquiler.findUnique({
          where: { id: alquilerId },
          select: {
            id: true,
            estado: true,
            arrendatarioId: true,
            propietarioId: true,
          },
        });

        if (!alquiler) {
          throw new NotFoundException('El alquiler no existe.');
        }
        if (alquiler.estado !== EstadoAlquiler.COMPLETADO) {
          throw new BadRequestException(
            'Solo se puede calificar un alquiler finalizado.',
          );
        }
        if (
          evaluadorId !== alquiler.arrendatarioId &&
          evaluadorId !== alquiler.propietarioId
        ) {
          throw new ForbiddenException(
            'Solo los participantes del alquiler pueden calificar.',
          );
        }

        const evaluadoId =
          evaluadorId === alquiler.arrendatarioId
            ? alquiler.propietarioId
            : alquiler.arrendatarioId;
        if (evaluadoId === evaluadorId) {
          throw new BadRequestException('No puedes calificarte a ti mismo.');
        }
        const claveCalificacion = {
          alquilerId_evaluadorId: { alquilerId, evaluadorId },
        };
        const existente = await tx.calificacion.findUnique({
          where: claveCalificacion,
          select: { id: true },
        });

        if (existente) {
          throw new ConflictException(
            'Ya enviaste una calificación para este alquiler.',
          );
        }

        const calificacion = await tx.calificacion.create({
          data: {
            alquilerId,
            evaluadorId,
            evaluadoId,
            estrellas: dto.estrellas,
            comentario: dto.comentario?.trim() || null,
          },
        });
        const resumen = await tx.calificacion.aggregate({
          where: { evaluadoId },
          _avg: { estrellas: true },
          _count: { _all: true },
        });
        const usuarioActualizado = await tx.usuario.update({
          where: { id: evaluadoId },
          data: {
            calificacion: resumen._avg.estrellas ?? 0,
            totalResenas: resumen._count._all,
          },
          select: { calificacion: true, totalResenas: true },
        });

        return { ...calificacion, usuarioCalificado: usuarioActualizado };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya enviaste una calificación para este alquiler.',
        );
      }
      throw error;
    }
  }
}
