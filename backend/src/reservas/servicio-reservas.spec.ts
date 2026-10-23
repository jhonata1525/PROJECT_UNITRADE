import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioReservas } from './servicio-reservas.js';

function crearPrismaMock() {
  const prisma = {
    usuario: { findUnique: vi.fn() },
    articulo: { update: vi.fn() },
    alquiler: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(
    (callback: (tx: unknown) => unknown) => callback(prisma),
  );
  return prisma;
}

const reservaBase = {
  id: 'alq-1',
  articuloId: 'art-1',
  arrendatarioId: 'usr-ana',
  propietarioId: 'usr-laura',
  inicio: new Date('2026-10-25T14:00:00.000Z'),
  fin: new Date('2026-10-25T18:00:00.000Z'),
  horas: 4,
  subtotal: 60_000,
  comision: 7_200,
  total: 60_000,
  estado: 'PENDIENTE_ENTREGA',
  codigoVerificacion: '4821',
  codigoQr: null,
  creadoEn: new Date('2026-10-21T12:00:00.000Z'),
  actualizadoEn: new Date('2026-10-21T12:00:00.000Z'),
  articulo: {
    id: 'art-1',
    titulo: 'Mesa de estudio',
    tarifaHora: 15_000,
    imagenes: [],
    ubicacion: 'Biblioteca',
  },
  propietario: {
    id: 'usr-laura',
    nombre: 'Laura Gómez',
    correo: 'laura@unisimon.edu.co',
  },
  arrendatario: {
    id: 'usr-ana',
    nombre: 'Ana Martínez',
    correo: 'ana@unisimon.edu.co',
  },
  pago: {
    id: 'pago-1',
    alquilerId: 'alq-1',
    monto: 60_000,
    comision: 7_200,
    montoPropietario: 52_800,
    moneda: 'COP',
    estado: 'COMPLETADO',
    metodo: 'sandbox',
    idTransaccion: 'sbx_tx_1',
    claveIdempotencia: null,
    errorMensaje: null,
    metadata: null,
    pagadoEn: new Date('2026-10-21T12:05:00.000Z'),
    creadoEn: new Date('2026-10-21T12:00:00.000Z'),
    actualizadoEn: new Date('2026-10-21T12:05:00.000Z'),
  },
};

describe('ServicioReservas', () => {
  let prisma: ReturnType<typeof crearPrismaMock>;
  let servicio: ServicioReservas;

  beforeEach(() => {
    prisma = crearPrismaMock();
    servicio = new ServicioReservas(prisma as unknown as ServicioPrisma);
    prisma.usuario.findUnique.mockResolvedValue({ id: 'usr-ana' });
  });

  it('devuelve el desglose de comisión al participante', async () => {
    prisma.alquiler.findUnique.mockResolvedValue(reservaBase);

    const detalle = await servicio.obtener('alq-1', 'usr-ana');

    expect(detalle).toMatchObject({
      id: 'alq-1',
      codigoDevolucion: '4821',
      subtotal: 60_000,
      comision: 7_200,
      total: 60_000,
      montoPropietario: 52_800,
      porcentajeComision: 0.12,
      pago: expect.objectContaining({
        estado: 'COMPLETADO',
        transaccionId: 'sbx_tx_1',
      }),
    });
  });

  it('oculta la reserva a usuarios que no participan', async () => {
    prisma.alquiler.findUnique.mockResolvedValue(reservaBase);

    await expect(servicio.obtener('alq-1', 'usr-diego')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('responde 404 cuando la reserva no existe', async () => {
    prisma.alquiler.findUnique.mockResolvedValue(null);

    await expect(servicio.obtener('no-existe', 'usr-ana')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lista las reservas del arrendatario con su desglose', async () => {
    prisma.alquiler.findMany.mockResolvedValue([
      {
        ...reservaBase,
        articulo: { id: 'art-1', titulo: 'Mesa de estudio', imagenes: [] },
        pago: {
          id: 'pago-1',
          estado: 'COMPLETADO',
          idTransaccion: 'sbx_tx_1',
        },
      },
    ]);

    const lista = await servicio.listar('usr-ana', {});

    expect(prisma.alquiler.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ arrendatarioId: 'usr-ana' }),
      }),
    );
    expect(lista[0]).toMatchObject({
      id: 'alq-1',
      codigoDevolucion: '4821',
      montoPropietario: 52_800,
      pago: { estado: 'COMPLETADO' },
    });
  });

  it('genera y guarda un código para una reserva activa antigua sin código', async () => {
    prisma.alquiler.findMany.mockResolvedValue([
      {
        ...reservaBase,
        codigoVerificacion: null,
        articulo: { id: 'art-1', titulo: 'Mesa de estudio', imagenes: [] },
      },
    ]);
    prisma.alquiler.updateMany.mockResolvedValue({ count: 1 });

    const lista = await servicio.listar('usr-ana', {});

    expect(lista[0].codigoDevolucion).toMatch(/^\d{4}$/);
    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'alq-1',
          codigoVerificacion: null,
        }),
        data: {
          codigoVerificacion: lista[0].codigoDevolucion,
        },
      }),
    );
  });

  it('no entrega el código de devolución al propietario', async () => {
    prisma.alquiler.findMany.mockResolvedValue([
      {
        ...reservaBase,
        articulo: { id: 'art-1', titulo: 'Mesa de estudio', imagenes: [] },
      },
    ]);

    const lista = await servicio.listar('usr-ana', { rol: 'PROPIETARIO' });

    expect(lista[0]).not.toHaveProperty('codigoDevolucion');
  });

  it('valida el código del arrendatario y confirma la devolución', async () => {
    prisma.alquiler.findFirst.mockResolvedValue({
      id: 'alq-1',
      codigoVerificacion: '4821',
      estado: 'PENDIENTE_ENTREGA',
    });
    prisma.alquiler.updateMany.mockResolvedValue({ count: 1 });
    prisma.alquiler.count.mockResolvedValue(0);

    const resultado = await servicio.confirmarDevolucion(
      'art-1',
      '4821',
      'usr-laura',
    );

    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'alq-1',
          codigoVerificacion: '4821',
        }),
        data: { estado: 'COMPLETADO' },
      }),
    );
    expect(prisma.alquiler.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ codigoVerificacion: '4821' }),
      }),
    );
    expect(prisma.articulo.update).toHaveBeenCalledWith({
      where: { id: 'art-1' },
      data: { activo: true },
    });
    expect(resultado.estado).toBe('COMPLETADO');
  });

  it('rechaza un código de devolución incorrecto', async () => {
    prisma.alquiler.findFirst.mockResolvedValue(null);

    await expect(
      servicio.confirmarDevolucion('art-1', '0000', 'usr-laura'),
    ).rejects.toThrow('El código no es correcto o no corresponde a un alquiler pendiente de devolución.');
    expect(prisma.alquiler.updateMany).not.toHaveBeenCalled();
  });
});
