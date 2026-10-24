import { BadRequestException, HttpException } from '@nestjs/common';
import type { ServicioPasarelaSandbox } from '../pasarela/servicio-pasarela-sandbox.js';
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
    },
    billetera: { upsert: vi.fn() },
    transaccionBilletera: { create: vi.fn() },
    $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
  };

  return prisma;
}

function crearPasarelaMock() {
  return {
    cobrar: vi.fn(),
    dispersar: vi.fn(),
  };
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
  metodo: 'sandbox',
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
  let pasarela: ReturnType<typeof crearPasarelaMock>;
  let servicio: ServicioPagos;

  beforeEach(() => {
    prisma = crearPrismaMock();
    pasarela = crearPasarelaMock();
    servicio = new ServicioPagos(
      prisma as unknown as ServicioPrisma,
      pasarela as unknown as ServicioPasarelaSandbox,
    );

    prisma.usuario.findUnique.mockResolvedValue({ id: 'usr-ana' });
    prisma.alquiler.findUnique.mockResolvedValue(alquilerBase);
    prisma.pago.upsert.mockResolvedValue(pagoBase);
  });

  it('cobra el total, retiene 12% y abona 52.800 al propietario', async () => {
    pasarela.cobrar.mockResolvedValue({
      exito: true,
      idTransaccion: 'sbx_tx_1',
      estado: 'APROBADO',
      codigoRespuesta: 'APROBADO',
      mensaje: 'ok',
      fecha: new Date(),
    });
    prisma.pago.update.mockResolvedValue({
      ...pagoBase,
      estado: 'COMPLETADO',
      idTransaccion: 'sbx_tx_1',
      pagadoEn: new Date(),
    });
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

    expect(pasarela.cobrar).toHaveBeenCalledWith(
      expect.objectContaining({
        monto: 60_000,
        moneda: 'COP',
        referencia: 'alquiler:alq-1',
      }),
    );
    expect(resultado.exito).toBe(true);
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
    expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'INGRESO',
          monto: 52_800,
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
        idTransaccion: 'sbx_tx_previo',
        pagadoEn: new Date(),
      },
    });

    const resultado = await servicio.checkout({ alquilerId: 'alq-1' }, 'usr-ana');

    expect(pasarela.cobrar).not.toHaveBeenCalled();
    expect(resultado.exito).toBe(true);
    expect(resultado.transaccionId).toBe('sbx_tx_previo');
    expect(resultado.mensaje).toContain('sin cobrar dos veces');
  });

  it('marca el pago como fallido si la pasarela rechaza', async () => {
    pasarela.cobrar.mockResolvedValue({
      exito: false,
      idTransaccion: 'sbx_tx_rechazo',
      estado: 'RECHAZADO',
      codigoRespuesta: 'TARJETA_RECHAZADA',
      mensaje: 'Rechazado',
      fecha: new Date(),
    });
    prisma.pago.update.mockResolvedValue({
      ...pagoBase,
      estado: 'FALLIDO',
    });

    await expect(
      servicio.checkout({ alquilerId: 'alq-1' }, 'usr-ana'),
    ).rejects.toBeInstanceOf(HttpException);

    expect(prisma.pago.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'FALLIDO',
          errorMensaje: 'Rechazado',
        }),
      }),
    );
    expect(prisma.billetera.upsert).not.toHaveBeenCalled();
    expect(prisma.transaccionBilletera.create).not.toHaveBeenCalled();
  });

  it('crea la reserva y calcula el monto con la tarifa del artículo', async () => {
    const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
    pasarela.cobrar.mockResolvedValue({
      exito: true,
      idTransaccion: 'sbx_tx_nuevo',
      estado: 'APROBADO',
      codigoRespuesta: 'APROBADO',
      mensaje: 'ok',
      fecha: new Date(),
    });
    prisma.pago.update.mockResolvedValue({
      ...pagoBase,
      id: 'pago-nuevo',
      alquilerId: 'alq-nuevo',
      monto: 30_000,
      comision: 3_600,
      montoPropietario: 26_400,
      estado: 'COMPLETADO',
      idTransaccion: 'sbx_tx_nuevo',
      pagadoEn: new Date(),
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
    expect(pasarela.cobrar).toHaveBeenCalledWith(
      expect.objectContaining({ monto: 30_000 }),
    );
    expect(resultado.desglose.montoPropietario).toBe(26_400);
    expect(resultado.codigoDevolucion).toBe('4821');
  });

  it('exige alquilerId o artículo + horas', async () => {
    await expect(servicio.checkout({ horas: 2 }, 'usr-ana')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(pasarela.cobrar).not.toHaveBeenCalled();
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
    expect(pasarela.cobrar).not.toHaveBeenCalled();
  });
});
