import { BadRequestException, HttpException } from '@nestjs/common';
import type { ServicioPasarelaSandbox } from '../pasarela/servicio-pasarela-sandbox.js';
import type { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioBilletera } from './servicio-billetera.js';

function crearPrismaMock() {
  const prisma = {
    usuario: { findUnique: vi.fn() },
    billetera: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    retiro: {
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    transaccionBilletera: { create: vi.fn(), findMany: vi.fn() },
    $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
  };

  return prisma;
}

function crearPasarelaMock() {
  return { cobrar: vi.fn(), dispersar: vi.fn() };
}

const billeteraBase = {
  id: 'bill-1',
  usuarioId: 'usr-laura',
  saldoDisponible: 100_000,
  saldoPendiente: 0,
  totalGanado: 150_000,
  totalRetirado: 0,
  moneda: 'COP',
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

const retiroBase = {
  id: 'ret-1',
  billeteraId: 'bill-1',
  metodo: 'NEQUI',
  cuenta: '3001234567',
  monto: 50_000,
  moneda: 'COP',
  estado: 'PENDIENTE',
  idPayout: null,
  errorMensaje: null,
  completadoEn: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

describe('ServicioBilletera (HU-10)', () => {
  let prisma: ReturnType<typeof crearPrismaMock>;
  let pasarela: ReturnType<typeof crearPasarelaMock>;
  let servicio: ServicioBilletera;

  beforeEach(() => {
    prisma = crearPrismaMock();
    pasarela = crearPasarelaMock();
    servicio = new ServicioBilletera(
      prisma as unknown as ServicioPrisma,
      pasarela as unknown as ServicioPasarelaSandbox,
    );

    prisma.usuario.findUnique.mockResolvedValue({ id: 'usr-laura' });
    prisma.billetera.upsert.mockResolvedValue(billeteraBase);
    prisma.billetera.updateMany.mockResolvedValue({ count: 1 });
    prisma.retiro.create.mockResolvedValue(retiroBase);
  });

  it('retiene el monto, procesa el payout y descuenta el saldo disponible', async () => {
    pasarela.dispersar.mockResolvedValue({
      exito: true,
      idPayout: 'sbx_po_1',
      estado: 'PROCESADO',
      codigoRespuesta: 'PROCESADO',
      mensaje: 'ok',
      fecha: new Date(),
    });
    prisma.retiro.update.mockResolvedValue({
      ...retiroBase,
      estado: 'COMPLETADO',
      idPayout: 'sbx_po_1',
      completadoEn: new Date(),
    });
    prisma.billetera.update.mockResolvedValue({
      ...billeteraBase,
      saldoDisponible: 50_000,
      saldoPendiente: 0,
      totalRetirado: 50_000,
    });

    const resultado = await servicio.solicitarRetiro(
      { metodo: 'NEQUI', cuenta: '3001234567', monto: 50_000 },
      'usr-laura',
    );

    expect(prisma.billetera.updateMany).toHaveBeenCalledWith({
      where: { id: 'bill-1', saldoDisponible: { gte: 50_000 } },
      data: {
        saldoDisponible: { decrement: 50_000 },
        saldoPendiente: { increment: 50_000 },
      },
    });
    expect(pasarela.dispersar).toHaveBeenCalledWith(
      expect.objectContaining({
        monto: 50_000,
        metodo: 'NEQUI',
        cuenta: '3001234567',
      }),
    );
    expect(resultado).toMatchObject({
      exito: true,
      estado: 'COMPLETADO',
      idPayout: 'sbx_po_1',
      monto: 50_000,
      cuentaEnmascarada: '******4567',
      saldoDisponible: 50_000,
      saldoPendiente: 0,
    });
    expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'RETIRO',
          estado: 'COMPLETADO',
          saldoDespues: 50_000,
        }),
      }),
    );
  });

  it('rechaza el retiro cuando el saldo es insuficiente', async () => {
    prisma.billetera.upsert.mockResolvedValue({
      ...billeteraBase,
      saldoDisponible: 30_000,
    });

    await expect(
      servicio.solicitarRetiro(
        { metodo: 'NEQUI', cuenta: '3001234567', monto: 50_000 },
        'usr-laura',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(pasarela.dispersar).not.toHaveBeenCalled();
    expect(prisma.billetera.updateMany).not.toHaveBeenCalled();
  });

  it('devuelve el dinero al saldo disponible si el payout falla', async () => {
    pasarela.dispersar.mockResolvedValue({
      exito: false,
      idPayout: 'sbx_po_fallo',
      estado: 'RECHAZADO',
      codigoRespuesta: 'CUENTA_DESTINO_INVALIDA',
      mensaje: 'Cuenta inválida',
      fecha: new Date(),
    });
    prisma.retiro.updateMany.mockResolvedValue({ count: 1 });
    prisma.billetera.update.mockResolvedValue(billeteraBase);

    const promesa = servicio.solicitarRetiro(
      { metodo: 'NEQUI', cuenta: '3001234567', monto: 50_000 },
      'usr-laura',
    );

    await expect(promesa).rejects.toBeInstanceOf(HttpException);
    await expect(promesa).rejects.toMatchObject({
      response: expect.objectContaining({
        exito: false,
        codigo: 'CUENTA_DESTINO_INVALIDA',
      }),
    });

    expect(prisma.retiro.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'FALLIDO',
          errorMensaje: 'Cuenta inválida',
        }),
      }),
    );
    expect(prisma.billetera.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          saldoPendiente: { decrement: 50_000 },
          saldoDisponible: { increment: 50_000 },
        },
      }),
    );
    expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'RETIRO',
          estado: 'FALLIDO',
        }),
      }),
    );
  });

  it('valida que Nequi/Daviplata reciban un celular colombiano', async () => {
    await expect(
      servicio.solicitarRetiro(
        { metodo: 'NEQUI', cuenta: '1234567', monto: 50_000 },
        'usr-laura',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(pasarela.dispersar).not.toHaveBeenCalled();
  });

  it('acredita una recarga sandbox sin contarla como ganancia', async () => {
    prisma.billetera.update.mockResolvedValue({
      ...billeteraBase,
      saldoDisponible: 200_000,
    });
    prisma.transaccionBilletera.create.mockResolvedValue({ id: 'tx-dep-1' });

    const resultado = await servicio.recargarSandbox(
      { monto: 100_000, metodo: 'Nequi' },
      'usr-laura',
    );

    expect(prisma.billetera.update).toHaveBeenCalledWith({
      where: { id: 'bill-1' },
      data: { saldoDisponible: { increment: 100_000 } },
    });
    expect(prisma.transaccionBilletera.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'DEPOSITO',
          estado: 'COMPLETADO',
          monto: 100_000,
          saldoDespues: 200_000,
        }),
      }),
    );
    expect(resultado).toMatchObject({
      exito: true,
      saldoDisponible: 200_000,
      totalGanado: 150_000,
      monto: 100_000,
      transaccionId: 'tx-dep-1',
    });
  });

  it('expone el saldo pendiente y los retiros en proceso', async () => {
    prisma.retiro.count.mockResolvedValue(1);

    const balance = await servicio.obtenerBalance('usr-laura');

    expect(balance).toMatchObject({
      saldoDisponible: 100_000,
      saldoPendiente: 0,
      totalGanado: 150_000,
      retirosEnProceso: 1,
      retirosProceso: 1,
    });
  });
});
