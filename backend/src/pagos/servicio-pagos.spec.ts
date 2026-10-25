import { BadRequestException, HttpException } from '@nestjs/common';
import type { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioPagos } from './servicio-pagos.js';

function crearPrismaMock() {
  const prisma = {
    usuario: { findUnique: vi.fn(), updateMany: vi.fn() },
    articulo: { findUnique: vi.fn() },
    alquiler: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pago: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    billetera: {
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      upsert: vi.fn(),
    },
    transaccionBilletera: { create: vi.fn() },
    $transaction: vi.fn((callback: (tx: unknown) => unknown) =>
      callback(prisma),
    ),
  };

  return prisma;
}

const alquilerBase = {
  id: 'alq-1',
  articuloId: 'art-1',
  arrendatarioId: 'usr-ana',
  propietarioId: 'usr-laura',
  inicio: new Date(),
  fin: new Date(),
  horas: 4,
  subtotal: 60_000,
  comision: 7_200,
  total: 60_000,
  estado: 'PENDIENTE_ENTREGA',
  codigoVerificacion: null,
  codigoQr: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  articulo: { id: 'art-1', titulo: 'Mesa de estudio', tarifaHora: 15_000 },
  pago: null,
};

const pagoBase = {
  id: 'pago-1',
  alquilerId: 'alq-1',
  monto: 60_000,
  comision: 7_200,
  montoPropietario: 52_800,
  moneda: 'COP',
  estado: 'PROCESANDO',
  metodo: 'billetera',
  idTransaccion: null,
  claveIdempotencia: null,
  errorMensaje: null,
  metadata: null,
  pagadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

describe('ServicioPagos (HU-06)', () => {
  let prisma: ReturnType<typeof crearPrismaMock>;
  let servicio: ServicioPagos;

  beforeEach(() => {
    prisma = crearPrismaMock();
    servicio = new ServicioPagos(prisma as unknown as ServicioPrisma);

    prisma.usuario.findUnique.mockResolvedValue({
      id: 'usr-ana',
      correoVerificado: false,
      telefonoVerificado: false,
      suspendidoPorMora: false,
      disponibilidad: {
        lunes: { activo: true, inicio: '08:00', fin: '12:00' },
      },
    });
    prisma.alquiler.findUnique.mockResolvedValue(alquilerBase);
    prisma.pago.upsert.mockResolvedValue(pagoBase);
    prisma.pago.updateMany.mockResolvedValue({ count: 1 });
    prisma.pago.findUniqueOrThrow.mockResolvedValue({
      ...pagoBase,
      estado: 'COMPLETADO',
      idTransaccion: 'wallet_tx_1',
      pagadoEn: new Date(),
      alquiler: { articulo: { titulo: 'Mesa de estudio' } },
    });
    prisma.billetera.updateMany.mockResolvedValue({ count: 1 });
    prisma.billetera.findUniqueOrThrow.mockResolvedValue({
      id: 'bill-ana',
      usuarioId: 'usr-ana',
      saldoDisponible: 40_000,
      saldoPendiente: 0,
      totalGanado: 0,
      totalRetirado: 0,
      moneda: 'COP',
    });
  });

  it('descuenta el total del arrendatario y abona 52.800 al propietario', async () => {
    prisma.billetera.upsert.mockResolvedValue({
      id: 'bill-laura',
      usuarioId: 'usr-laura',
      saldoDisponible: 52_800,
      saldoPendiente: 0,
      totalGanado: 52_800,
      totalRetirado: 0,
      moneda: 'COP',
    });

    const resultado = await servicio.checkout(
      { alquilerId: 'alq-1', usuarioId: 'usr-ana' },
      'usr-ana',
    );

    expect(resultado.exito).toBe(true);
    expect(resultado.metodo).toBe('billetera');
    expect(resultado.desglose).toMatchObject({
      subtotal: 60_000,
      comision: 7_200,
      total: 60_000,
      montoPropietario: 52_800,
    });
    expect(prisma.billetera.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { usuarioId: 'usr-laura' },
        update: {
          saldoDisponible: { increment: 52_800 },
          totalGanado: { increment: 52_800 },
        },
      }),
    );
    expect(prisma.billetera.updateMany).toHaveBeenCalledWith({
      where: {
        usuarioId: 'usr-ana',
        saldoDisponible: { gte: 60_000 },
      },
      data: { saldoDisponible: { decrement: 60_000 } },
    });
    expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'INGRESO',
          monto: 52_800,
          estado: 'COMPLETADO',
        }),
      }),
    );
    expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          billeteraId: 'bill-ana',
          tipo: 'PAGO_ALQUILER',
          monto: 60_000,
          saldoDespues: 40_000,
          estado: 'COMPLETADO',
        }),
      }),
    );
  });

  it('no cobra dos veces una reserva ya pagada', async () => {
    prisma.alquiler.findUnique.mockResolvedValue({
      ...alquilerBase,
      pago: {
        ...pagoBase,
        estado: 'COMPLETADO',
        idTransaccion: 'wallet_tx_previo',
        pagadoEn: new Date(),
      },
    });

    const resultado = await servicio.checkout(
      { alquilerId: 'alq-1' },
      'usr-ana',
    );

    expect(prisma.billetera.updateMany).not.toHaveBeenCalled();
    expect(resultado.exito).toBe(true);
    expect(resultado.transaccionId).toBe('wallet_tx_previo');
    expect(resultado.mensaje).toContain('sin cobrar dos veces');
  });

  it('rechaza el pago si el saldo de la billetera no alcanza', async () => {
    prisma.billetera.updateMany.mockResolvedValue({ count: 0 });
    prisma.pago.update.mockResolvedValue({
      ...pagoBase,
      estado: 'FALLIDO',
    });

    await expect(
      servicio.checkout({ alquilerId: 'alq-1' }, 'usr-ana'),
    ).rejects.toBeInstanceOf(HttpException);

    expect(prisma.pago.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'pago-1', estado: 'PROCESANDO' },
        data: expect.objectContaining({
          estado: 'FALLIDO',
          errorMensaje: expect.stringContaining('Saldo insuficiente'),
        }),
      }),
    );
    expect(prisma.billetera.upsert).not.toHaveBeenCalled();
    expect(prisma.transaccionBilletera.create).not.toHaveBeenCalled();
  });

  it('no vuelve a debitar si otra solicitud ya reclamó el pago', async () => {
    prisma.pago.updateMany.mockResolvedValue({ count: 0 });
    prisma.pago.findUnique.mockResolvedValue({
      ...pagoBase,
      estado: 'PROCESANDO',
    });

    await expect(
      servicio.checkout({ alquilerId: 'alq-1' }, 'usr-ana'),
    ).rejects.toMatchObject({
      message: expect.stringContaining('ya se está procesando'),
    });

    expect(prisma.billetera.updateMany).not.toHaveBeenCalled();
    expect(prisma.transaccionBilletera.create).not.toHaveBeenCalled();
  });

  it('crea la reserva y calcula el monto con la tarifa del artículo', async () => {
    const inicio = new Date('2026-10-26T14:00:00.000Z');
    const fin = new Date(inicio.getTime() + 2 * 60 * 60 * 1000);

    prisma.articulo.findUnique.mockResolvedValue({
      id: 'art-1',
      titulo: 'Mesa de estudio',
      tarifaHora: 15_000,
      activo: true,
      propietarioId: 'usr-laura',
      disponibleDesde: new Date(Date.now() - 24 * 60 * 60 * 1000),
      disponibleHasta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    });
    prisma.alquiler.findFirst.mockResolvedValue(null);
    prisma.alquiler.create.mockResolvedValue({
      ...alquilerBase,
      id: 'alq-nuevo',
      codigoVerificacion: '4821',
      horas: 2,
      subtotal: 30_000,
      comision: 3_600,
      total: 30_000,
      inicio,
      fin,
    });
    prisma.pago.upsert.mockResolvedValue({
      ...pagoBase,
      id: 'pago-nuevo',
      alquilerId: 'alq-nuevo',
      monto: 30_000,
      comision: 3_600,
      montoPropietario: 26_400,
    });
    prisma.pago.findUniqueOrThrow.mockResolvedValue({
      ...pagoBase,
      id: 'pago-nuevo',
      alquilerId: 'alq-nuevo',
      monto: 30_000,
      comision: 3_600,
      montoPropietario: 26_400,
      estado: 'COMPLETADO',
      idTransaccion: 'wallet_tx_nuevo',
      pagadoEn: new Date(),
      alquiler: { articulo: { titulo: 'Mesa de estudio' } },
    });
    prisma.billetera.upsert.mockResolvedValue({
      id: 'bill-laura',
      saldoDisponible: 26_400,
      totalGanado: 26_400,
      moneda: 'COP',
    });

    const resultado = await servicio.checkout(
      { articuloId: 'art-1', horas: 2, inicio, fin },
      'usr-ana',
    );

    expect(resultado.exito).toBe(true);
    expect(prisma.alquiler.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          codigoVerificacion: expect.stringMatching(/^\d{4}$/),
          subtotal: 30_000,
          comision: 3_600,
          total: 30_000,
          horas: 2,
        }),
      }),
    );
    expect(prisma.billetera.updateMany).toHaveBeenCalledWith({
      where: {
        usuarioId: 'usr-ana',
        saldoDisponible: { gte: 30_000 },
      },
      data: { saldoDisponible: { decrement: 30_000 } },
    });
    expect(resultado.desglose.montoPropietario).toBe(26_400);
    expect(resultado.codigoDevolucion).toBe('4821');
  });

  it('cancela una reserva nueva cuando el saldo no alcanza', async () => {
    const inicio = new Date('2026-10-26T14:00:00.000Z');
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
    prisma.articulo.findUnique.mockResolvedValue({
      id: 'art-1',
      titulo: 'Mesa de estudio',
      tarifaHora: 15_000,
      activo: true,
      propietarioId: 'usr-laura',
      disponibleDesde: new Date('2026-10-20T00:00:00.000Z'),
      disponibleHasta: new Date('2026-11-01T00:00:00.000Z'),
    });
    prisma.alquiler.findFirst.mockResolvedValue(null);
    prisma.alquiler.create.mockResolvedValue({
      ...alquilerBase,
      id: 'alq-nuevo',
      horas: 1,
      subtotal: 15_000,
      comision: 1_800,
      total: 15_000,
      inicio,
      fin,
    });
    prisma.pago.upsert.mockResolvedValue({
      ...pagoBase,
      id: 'pago-nuevo',
      alquilerId: 'alq-nuevo',
      monto: 15_000,
    });
    prisma.billetera.updateMany.mockResolvedValue({ count: 0 });

    const error = await servicio
      .checkout({ articuloId: 'art-1', horas: 1, inicio, fin }, 'usr-ana')
      .catch((capturado: unknown) => capturado);

    expect(error).toBeInstanceOf(HttpException);
    if (!(error instanceof HttpException)) throw error;
    expect(error.getResponse()).toMatchObject({
      codigo: 'SALDO_INSUFICIENTE',
      mensaje: expect.stringContaining('Saldo insuficiente'),
    });

    expect(prisma.alquiler.update).toHaveBeenCalledWith({
      where: { id: 'alq-nuevo' },
      data: { estado: 'CANCELADO' },
    });
    expect(prisma.transaccionBilletera.create).not.toHaveBeenCalled();
  });

  it('exige alquilerId o artículo + horas', async () => {
    await expect(
      servicio.checkout({ horas: 2 }, 'usr-ana'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bloquea nuevas reservas cuando el arrendatario supera dos horas de mora', async () => {
    prisma.usuario.findUnique
      .mockResolvedValueOnce({ id: 'usr-ana' })
      .mockResolvedValueOnce({ suspendidoPorMora: false });
    prisma.alquiler.findFirst.mockResolvedValueOnce({ id: 'alq-vencido' });

    await expect(
      servicio.checkout({ articuloId: 'art-1', horas: 2 }, 'usr-ana'),
    ).rejects.toMatchObject({
      message: expect.stringContaining('suspendida para nuevas reservas'),
    });

    expect(prisma.usuario.updateMany).toHaveBeenCalledWith({
      where: { id: 'usr-ana', suspendidoPorMora: false },
      data: { suspendidoPorMora: true },
    });
    expect(prisma.alquiler.create).not.toHaveBeenCalled();
  });

  it('rechaza reservas fuera del horario semanal del propietario', async () => {
    const inicio = new Date('2026-10-26T17:00:00.000Z');
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
    prisma.articulo.findUnique.mockResolvedValue({
      id: 'art-1',
      titulo: 'Mesa de estudio',
      tarifaHora: 15_000,
      activo: true,
      propietarioId: 'usr-laura',
      disponibleDesde: new Date('2026-10-20T00:00:00.000Z'),
      disponibleHasta: new Date('2026-11-01T00:00:00.000Z'),
    });

    await expect(
      servicio.checkout(
        { articuloId: 'art-1', horas: 1, inicio, fin },
        'usr-ana',
      ),
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        'fuera de las franjas de disponibilidad',
      ),
    });
    expect(prisma.alquiler.create).not.toHaveBeenCalled();
  });
});
