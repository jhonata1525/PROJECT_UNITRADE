import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioCalificaciones } from './servicio-calificaciones.js';

describe('ServicioCalificaciones', () => {
  const alquilerFindUnique = vi.fn();
  const calificacionFindUnique = vi.fn();
  const calificacionCreate = vi.fn();
  const calificacionAggregate = vi.fn();
  const usuarioUpdate = vi.fn();
  const prisma = {
    alquiler: { findUnique: alquilerFindUnique },
    calificacion: {
      findUnique: calificacionFindUnique,
      create: calificacionCreate,
      aggregate: calificacionAggregate,
    },
    usuario: { update: usuarioUpdate },
    $transaction: vi.fn(),
  };
  const servicio = new ServicioCalificaciones(
    prisma as unknown as ServicioPrisma,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) => callback(prisma),
    );
  });

  it('crea una calificación al otro participante y actualiza su promedio', async () => {
    alquilerFindUnique.mockResolvedValue({
      id: 'alq-1',
      estado: 'COMPLETADO',
      arrendatarioId: 'usr-ana',
      propietarioId: 'usr-laura',
    });
    calificacionFindUnique.mockResolvedValue(null);
    calificacionCreate.mockResolvedValue({
      id: 'cal-1',
      alquilerId: 'alq-1',
      evaluadorId: 'usr-ana',
      evaluadoId: 'usr-laura',
      estrellas: 5,
      comentario: 'Excelente experiencia',
    });
    calificacionAggregate.mockResolvedValue({
      _avg: { estrellas: 4.5 },
      _count: { _all: 2 },
    });
    usuarioUpdate.mockResolvedValue({ calificacion: 4.5, totalResenas: 2 });

    const resultado = await servicio.crear('alq-1', 'usr-ana', {
      estrellas: 5,
      comentario: ' Excelente experiencia ',
    });

    expect(calificacionCreate).toHaveBeenCalledWith({
      data: {
        alquilerId: 'alq-1',
        evaluadorId: 'usr-ana',
        evaluadoId: 'usr-laura',
        estrellas: 5,
        comentario: 'Excelente experiencia',
      },
    });
    expect(usuarioUpdate).toHaveBeenCalledWith({
      where: { id: 'usr-laura' },
      data: { calificacion: 4.5, totalResenas: 2 },
      select: { calificacion: true, totalResenas: true },
    });
    expect(resultado.usuarioCalificado).toEqual({
      calificacion: 4.5,
      totalResenas: 2,
    });
  });

  it('permite al propietario calificar al arrendatario', async () => {
    alquilerFindUnique.mockResolvedValue({
      id: 'alq-1',
      estado: 'COMPLETADO',
      arrendatarioId: 'usr-ana',
      propietarioId: 'usr-laura',
    });
    calificacionFindUnique.mockResolvedValue(null);
    calificacionCreate.mockResolvedValue({ id: 'cal-2' });
    calificacionAggregate.mockResolvedValue({
      _avg: { estrellas: 3 },
      _count: { _all: 1 },
    });
    usuarioUpdate.mockResolvedValue({ calificacion: 3, totalResenas: 1 });

    await servicio.crear('alq-1', 'usr-laura', { estrellas: 3 });

    expect(calificacionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          evaluadorId: 'usr-laura',
          evaluadoId: 'usr-ana',
          comentario: null,
        }),
      }),
    );
  });

  it('rechaza valores de estrellas fuera del rango permitido', async () => {
    await expect(
      servicio.crear('alq-1', 'usr-ana', { estrellas: 6 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(alquilerFindUnique).not.toHaveBeenCalled();
  });

  it('rechaza calificaciones si el alquiler no está finalizado', async () => {
    alquilerFindUnique.mockResolvedValue({
      id: 'alq-1',
      estado: 'ACTIVO',
      arrendatarioId: 'usr-ana',
      propietarioId: 'usr-laura',
    });

    await expect(
      servicio.crear('alq-1', 'usr-ana', { estrellas: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(calificacionCreate).not.toHaveBeenCalled();
  });

  it('rechaza usuarios que no participaron en el alquiler', async () => {
    alquilerFindUnique.mockResolvedValue({
      id: 'alq-1',
      estado: 'COMPLETADO',
      arrendatarioId: 'usr-ana',
      propietarioId: 'usr-laura',
    });

    await expect(
      servicio.crear('alq-1', 'usr-ajeno', { estrellas: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(calificacionCreate).not.toHaveBeenCalled();
  });

  it('impide que un participante califique dos veces el mismo alquiler', async () => {
    alquilerFindUnique.mockResolvedValue({
      id: 'alq-1',
      estado: 'COMPLETADO',
      arrendatarioId: 'usr-ana',
      propietarioId: 'usr-laura',
    });
    calificacionFindUnique.mockResolvedValue({ id: 'cal-existente' });

    await expect(
      servicio.crear('alq-1', 'usr-ana', { estrellas: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(calificacionCreate).not.toHaveBeenCalled();
  });

  it('responde 404 si el alquiler no existe', async () => {
    alquilerFindUnique.mockResolvedValue(null);

    await expect(
      servicio.crear('no-existe', 'usr-ana', { estrellas: 5 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
