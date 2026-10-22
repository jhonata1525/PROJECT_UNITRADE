import { calcularDesglose, PORCENTAJE_COMISION } from './dinero.js';

describe('calcularDesglose', () => {
  it('aplica el 12% de comisión y conserva el total', () => {
    const desglose = calcularDesglose(60_000);

    expect(desglose).toEqual({
      subtotal: 60_000,
      comision: 7_200,
      total: 60_000,
      montoPropietario: 52_800,
      porcentajeComision: PORCENTAJE_COMISION,
    });
  });

  it('garantiza que comisión + monto del propietario sea el subtotal', () => {
    for (const subtotal of [5_000, 23_333, 47_999, 1_000_001]) {
      const desglose = calcularDesglose(subtotal);
      expect(desglose.comision + desglose.montoPropietario).toBe(subtotal);
      expect(Number.isInteger(desglose.comision)).toBe(true);
    }
  });

  it('redondea la comisión al peso más cercano', () => {
    // 12% de 4.167 = 500,04 → 500
    expect(calcularDesglose(4_167).comision).toBe(500);
    expect(calcularDesglose(4_163).comision).toBe(500);
  });

  it('rechaza subtotales inválidos', () => {
    expect(() => calcularDesglose(0)).toThrow(RangeError);
    expect(() => calcularDesglose(-10)).toThrow(RangeError);
    expect(() => calcularDesglose(10.5)).toThrow(RangeError);
  });
});
