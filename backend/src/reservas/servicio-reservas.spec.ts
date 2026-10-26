import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { ServicioPasarelaSandbox } from '../pasarela/servicio-pasarela-sandbox.js';
import type { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioReservas } from './servicio-reservas.js';

function crearPrismaMock() {
  const prisma = {
    usuario: { findUnique: vi.fn(), updateMany: vi.fn() },
    articulo: { update: vi.fn() },
    billetera: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
    },
    transaccionBilletera: { create: vi.fn() },
    alquiler: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(
    (callback: (tx: unknown) => unknown) => callback(prisma),
  );
  return prisma;
}

function crearPasarelaMock() {
  return { cobrar: vi.fn() };
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
  codigoEntrega: '1938',
  codigoVerificacion: '4821',
  codigoQrEntrega: 'qr-entrega',
  codigoQr: 'qr-devolucion',
  entregaConfirmadaEn: null,
  devolucionConfirmadaEn: null,
  moraMonto: 0,
  moraPagada: 0,
  moraPagoEstado: 'PENDIENTE',
  moraTransaccionId: null,
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
  let pasarela: ReturnType<typeof crearPasarelaMock>;
  let servicio: ServicioReservas;

  beforeEach(() => {
    prisma = crearPrismaMock();
    pasarela = crearPasarelaMock();
    servicio = new ServicioReservas(
      prisma as unknown as ServicioPrisma,
      pasarela as unknown as ServicioPasarelaSandbox,
    );
    prisma.usuario.findUnique.mockResolvedValue({ id: 'usr-ana' });
    prisma.alquiler.findFirst.mockResolvedValue(null);
    prisma.alquiler.count.mockResolvedValue(0);
  });

  it('devuelve el desglose de comisión al participante', async () => {
    prisma.alquiler.findUnique.mockResolvedValue(reservaBase);

    const detalle = await servicio.obtener('alq-1', 'usr-ana');

    expect(detalle).toMatchObject({
      id: 'alq-1',
      codigoEntrega: '1938',
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
      codigoEntrega: '1938',
      codigoDevolucion: '4821',
      montoPropietario: 52_800,
      pago: { estado: 'COMPLETADO' },
    });
  });

  it('genera y guarda los códigos para una reserva pagada antigua sin códigos', async () => {
    prisma.alquiler.findMany.mockResolvedValue([
      {
        ...reservaBase,
        codigoEntrega: null,
        codigoQrEntrega: null,
        codigoVerificacion: null,
        codigoQr: null,
        articulo: { id: 'art-1', titulo: 'Mesa de estudio', imagenes: [] },
      },
    ]);
    prisma.alquiler.updateMany.mockResolvedValue({ count: 1 });

    const lista = await servicio.listar('usr-ana', {});

    expect(lista[0].codigoEntrega).toMatch(/^\d{4}$/);
    expect(lista[0].codigoDevolucion).toMatch(/^\d{4}$/);
    expect(lista[0].codigoQrEntrega).toBeTruthy();
    expect(lista[0].codigoQrDevolucion).toBeTruthy();
    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'alq-1',
        }),
        data: expect.objectContaining({
          codigoEntrega: lista[0].codigoEntrega,
          codigoQrEntrega: lista[0].codigoQrEntrega,
          codigoVerificacion: lista[0].codigoDevolucion,
          codigoQr: lista[0].codigoQrDevolucion,
        }),
      }),
    );
  });

  it('no entrega los códigos de verificación al propietario', async () => {
    prisma.alquiler.findMany.mockResolvedValue([
      {
        ...reservaBase,
        articulo: { id: 'art-1', titulo: 'Mesa de estudio', imagenes: [] },
      },
    ]);

    const lista = await servicio.listar('usr-ana', { rol: 'PROPIETARIO' });

    expect(lista[0]).not.toHaveProperty('codigoDevolucion');
    expect(lista[0]).not.toHaveProperty('codigoQrEntrega');
  });

  it('valida el código presencial de devolución y confirma el fin del alquiler', async () => {
    prisma.alquiler.findFirst
      .mockResolvedValueOnce({
      id: 'alq-1',
        fin: new Date(Date.now() + 60 * 60 * 1000),
        arrendatarioId: 'usr-ana',
        moraMonto: 0,
        moraPagada: 0,
        moraPagoEstado: 'PENDIENTE',
        articulo: { tarifaHora: 15_000 },
      })
      .mockResolvedValueOnce(null);

    const resultado = await servicio.confirmarDevolucion(
      'art-1',
      '4821',
      'usr-laura',
    );

    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'alq-1',
        }),
        data: expect.objectContaining({
          estado: 'COMPLETADO',
          moraMonto: 0,
        }),
      }),
    );
    expect(prisma.alquiler.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { codigoVerificacion: '4821' },
            { codigoQr: '4821' },
          ],
        }),
      }),
    );
    expect(prisma.articulo.update).toHaveBeenCalledWith({
      where: { id: 'art-1' },
      data: { activo: true },
    });
    expect(resultado.estado).toBe('COMPLETADO');
  });

  it('confirma la entrega presencial solo con un código válido', async () => {
    prisma.alquiler.findFirst.mockResolvedValueOnce({ id: 'alq-1' });

    const resultado = await servicio.confirmarEntrega(
      'art-1',
      'qr-entrega',
      'usr-laura',
    );

    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'alq-1', propietarioId: 'usr-laura', estado: 'PENDIENTE_ENTREGA' },
        data: expect.objectContaining({
          estado: 'ACTIVO',
          entregaConfirmadaEn: expect.any(Date),
        }),
      }),
    );
    expect(resultado.estado).toBe('ACTIVO');
  });

  it('cobra automáticamente desde la billetera al confirmar una devolución tardía', async () => {
    prisma.alquiler.findFirst
      .mockResolvedValueOnce({
        id: 'alq-1',
        fin: new Date(Date.now() - 16 * 60 * 1000),
        arrendatarioId: 'usr-ana',
        moraMonto: 0,
        moraPagada: 0,
        moraPagoEstado: 'PENDIENTE',
        articulo: { tarifaHora: 15_000 },
      })
      .mockResolvedValueOnce(null);
    prisma.billetera.findUnique.mockResolvedValue({
      id: 'bill-ana',
      saldoDisponible: 30_000,
    });
    prisma.billetera.findUniqueOrThrow.mockResolvedValue({
      id: 'bill-ana',
      saldoDisponible: 15_000,
    });
    prisma.billetera.updateMany.mockResolvedValue({ count: 1 });

    const resultado = await servicio.confirmarDevolucion(
      'art-1',
      '4821',
      'usr-laura',
    );

    expect(prisma.billetera.updateMany).toHaveBeenCalledWith({
      where: { id: 'bill-ana', saldoDisponible: { gte: 15_000 } },
      data: { saldoDisponible: { decrement: 15_000 } },
    });
    expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'PENALIZACION',
          monto: 15_000,
          estado: 'COMPLETADO',
        }),
      }),
    );
    expect(resultado).toMatchObject({
      moraMonto: 15_000,
      moraPagada: 15_000,
      moraPendiente: 0,
      pagoMora: 'BILLETERA',
    });
  });

  it('cobra automáticamente con la pasarela si la billetera no tiene saldo suficiente', async () => {
    prisma.alquiler.findFirst
      .mockResolvedValueOnce({
        id: 'alq-1',
        fin: new Date(Date.now() - 16 * 60 * 1000),
        arrendatarioId: 'usr-ana',
        moraMonto: 0,
        moraPagada: 0,
        moraPagoEstado: 'PENDIENTE',
        articulo: { tarifaHora: 15_000 },
      })
      .mockResolvedValue(null);
    prisma.billetera.findUnique.mockResolvedValue({
      id: 'bill-ana',
      saldoDisponible: 1_000,
    });
    prisma.billetera.updateMany.mockResolvedValue({ count: 0 });
    prisma.alquiler.findUnique.mockResolvedValue({
      id: 'alq-1',
      articuloId: 'art-1',
      arrendatarioId: 'usr-ana',
      estado: 'COMPLETADO',
      moraMonto: 15_000,
      moraPagada: 0,
      moraPagoEstado: 'PENDIENTE',
    });
    pasarela.cobrar.mockResolvedValue({
      exito: true,
      idTransaccion: 'sbx-mora-automatico',
    });

    const resultado = await servicio.confirmarDevolucion(
      'art-1',
      '4821',
      'usr-laura',
    );

    expect(pasarela.cobrar).toHaveBeenCalledWith({
      monto: 15_000,
      moneda: 'COP',
      referencia: 'mora:alq-1',
    });
    expect(resultado).toMatchObject({
      moraMonto: 15_000,
      moraPagada: 15_000,
      moraPendiente: 0,
      pagoMora: 'PASARELA_AUTOMATICA',
    });
    expect(resultado.mensaje).toContain('cobrado automáticamente');
  });

  it('deja explícita la mora pendiente si falla el cobro automático', async () => {
    prisma.alquiler.findFirst
      .mockResolvedValueOnce({
        id: 'alq-1',
        fin: new Date(Date.now() - 16 * 60 * 1000),
        arrendatarioId: 'usr-ana',
        moraMonto: 0,
        moraPagada: 0,
        moraPagoEstado: 'PENDIENTE',
        articulo: { tarifaHora: 15_000 },
      })
      .mockResolvedValue(null);
    prisma.alquiler.findUnique.mockResolvedValue({
      id: 'alq-1',
      articuloId: 'art-1',
      arrendatarioId: 'usr-ana',
      estado: 'COMPLETADO',
      moraMonto: 15_000,
      moraPagada: 0,
      moraPagoEstado: 'PENDIENTE',
    });
    pasarela.cobrar.mockResolvedValue({
      exito: false,
      idTransaccion: 'sbx-mora-rechazada',
      mensaje: 'Medio de pago rechazado.',
    });

    const resultado = await servicio.confirmarDevolucion(
      'art-1',
      '4821',
      'usr-laura',
    );

    expect(resultado).toMatchObject({
      estado: 'COMPLETADO',
      moraMonto: 15_000,
      moraPagada: 0,
      moraPendiente: 15_000,
      pagoMora: 'PENDIENTE',
    });
    expect(resultado.mensaje).toContain('no se pudo cobrar automáticamente');
    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ moraPagoEstado: 'PROCESANDO' }),
        data: { moraPagoEstado: 'PENDIENTE' },
      }),
    );
  });

  it('cobra dos horas al devolver a la 1 p. m. un alquiler que vencía a las 11 a. m.', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T18:00:00.000Z'));
    prisma.alquiler.findFirst
      .mockResolvedValueOnce({
        id: 'alq-1',
        fin: new Date('2026-10-26T16:00:00.000Z'),
        arrendatarioId: 'usr-ana',
        moraMonto: 0,
        moraPagada: 0,
        moraPagoEstado: 'PENDIENTE',
        articulo: { tarifaHora: 5_000 },
      })
      .mockResolvedValueOnce(null);
    prisma.billetera.findUnique.mockResolvedValue({
      id: 'bill-ana',
      saldoDisponible: 30_000,
    });
    prisma.billetera.findUniqueOrThrow.mockResolvedValue({
      id: 'bill-ana',
      saldoDisponible: 20_000,
    });
    prisma.billetera.updateMany.mockResolvedValue({ count: 1 });

    try {
      const resultado = await servicio.confirmarDevolucion(
        'art-1',
        '4821',
        'usr-laura',
      );

      expect(prisma.billetera.updateMany).toHaveBeenCalledWith({
        where: { id: 'bill-ana', saldoDisponible: { gte: 10_000 } },
        data: { saldoDisponible: { decrement: 10_000 } },
      });
      expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'PENALIZACION',
            monto: 10_000,
            saldoDespues: 20_000,
            estado: 'COMPLETADO',
          }),
        }),
      );
      expect(resultado).toMatchObject({
        moraMonto: 10_000,
        moraPagada: 10_000,
        moraPendiente: 0,
        pagoMora: 'BILLETERA',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('aplica una hora de recargo después de los 15 minutos de gracia', async () => {
    const ahora = new Date('2026-10-23T21:00:00.000Z');
    prisma.alquiler.findMany.mockResolvedValue([
      {
        id: 'alq-mora',
        fin: new Date(ahora.getTime() - 16 * 60 * 1000),
        moraMonto: 0,
        arrendatarioId: 'usr-ana',
        articulo: { tarifaHora: 12_000 },
      },
    ]);

    await servicio.actualizarMoras(ahora);

    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'alq-mora' }),
        data: { estado: 'EN_MORA', moraMonto: 12_000 },
      }),
    );
    expect(prisma.usuario.updateMany).not.toHaveBeenCalled();
  });

  it('bloquea nuevas reservas cuando el retraso supera dos horas', async () => {
    const ahora = new Date('2026-10-23T21:00:00.000Z');
    prisma.alquiler.findMany.mockResolvedValue([
      {
        id: 'alq-mora',
        fin: new Date(ahora.getTime() - (2 * 60 + 16) * 60 * 1000),
        moraMonto: 0,
        arrendatarioId: 'usr-ana',
        articulo: { tarifaHora: 12_000 },
      },
    ]);

    await servicio.actualizarMoras(ahora);

    expect(prisma.usuario.updateMany).toHaveBeenCalledWith({
      where: { id: 'usr-ana', suspendidoPorMora: false },
      data: { suspendidoPorMora: true },
    });
    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { estado: 'EN_MORA', moraMonto: 36_000 },
      }),
    );
  });

  it('paga el recargo pendiente desde el checkout y actualiza la suspensión', async () => {
    prisma.alquiler.findUnique.mockResolvedValue({
      id: 'alq-1',
      articuloId: 'art-1',
      arrendatarioId: 'usr-ana',
      estado: 'COMPLETADO',
      moraMonto: 12_000,
      moraPagada: 0,
      moraPagoEstado: 'PENDIENTE',
    });
    pasarela.cobrar.mockResolvedValue({
      exito: true,
      idTransaccion: 'sbx-mora-1',
    });

    const resultado = await servicio.pagarMora('alq-1', 'usr-ana');

    expect(pasarela.cobrar).toHaveBeenCalledWith({
      monto: 12_000,
      moneda: 'COP',
      referencia: 'mora:alq-1',
    });
    expect(prisma.alquiler.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ moraPagoEstado: 'PROCESANDO' }),
        data: expect.objectContaining({
          moraPagada: 12_000,
          moraPagoEstado: 'COMPLETADO',
          moraTransaccionId: 'sbx-mora-1',
        }),
      }),
    );
    expect(resultado.moraPendiente).toBe(0);
  });

  it('rechaza un código de devolución incorrecto', async () => {
    await expect(
      servicio.confirmarDevolucion('art-1', '0000', 'usr-laura'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.alquiler.updateMany).not.toHaveBeenCalled();
  });
});
