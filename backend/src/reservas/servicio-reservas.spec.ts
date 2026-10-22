import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioReservas } from './servicio-reservas.js';

function crearPrismaMock() {
  return {
    usuario: { findUnique: vi.fn() },
    alquiler: { findUnique: vi.fn(), findMany: vi.fn() },
  };
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
  codigoVerificacion: '1234',
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
      montoPropietario: 52_800,
      pago: { estado: 'COMPLETADO' },
    });
  });
});
