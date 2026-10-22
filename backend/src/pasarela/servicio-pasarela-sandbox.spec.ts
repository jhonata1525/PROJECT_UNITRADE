import { ServicioPasarelaSandbox } from './servicio-pasarela-sandbox.js';

describe('ServicioPasarelaSandbox', () => {
  const servicio = new ServicioPasarelaSandbox();
  const entornoOriginal = process.env.SANDBOX_TASA_EXITO;

  afterEach(() => {
    process.env.SANDBOX_TASA_EXITO = entornoOriginal ?? '1';
  });

  it('aprueba cobros y devuelve un id de transacción sandbox', async () => {
    process.env.SANDBOX_TASA_EXITO = '1';

    const resultado = await servicio.cobrar({
      monto: 60_000,
      moneda: 'COP',
      referencia: 'alquiler:1',
    });

    expect(resultado.exito).toBe(true);
    expect(resultado.estado).toBe('APROBADO');
    expect(resultado.idTransaccion).toMatch(/^sbx_tx_/);
  });

  it('rechaza cuando se fuerza el fallo', async () => {
    const resultado = await servicio.cobrar({
      monto: 60_000,
      moneda: 'COP',
      referencia: 'alquiler:1',
      forzarFallo: true,
    });

    expect(resultado.exito).toBe(false);
    expect(resultado.codigoRespuesta).toBe('TARJETA_RECHAZADA');
    expect(resultado.idTransaccion).toMatch(/^sbx_tx_/);
  });

  it('procesa dispersiones y usa el prefijo de payout', async () => {
    process.env.SANDBOX_TASA_EXITO = '1';

    const resultado = await servicio.dispersar({
      monto: 50_000,
      moneda: 'COP',
      metodo: 'NEQUI',
      cuenta: '3001234567',
      referencia: 'retiro:1',
    });

    expect(resultado.exito).toBe(true);
    expect(resultado.estado).toBe('PROCESADO');
    expect(resultado.idPayout).toMatch(/^sbx_po_/);
  });

  it('respeta una tasa de éxito de cero', async () => {
    process.env.SANDBOX_TASA_EXITO = '0';

    const resultado = await servicio.dispersar({
      monto: 50_000,
      moneda: 'COP',
      metodo: 'BANCO',
      cuenta: '1234567890',
      referencia: 'retiro:2',
    });

    expect(resultado.exito).toBe(false);
    expect(resultado.codigoRespuesta).toBe('CUENTA_DESTINO_INVALIDA');
  });
});
