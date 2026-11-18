/**
 * Reglas de dinero de UniTrade.
 *
 * Todos los montos se manejan como enteros en pesos colombianos (COP).
 * Nunca se usan decimales para evitar errores de punto flotante.
 */

/** Comisión de la plataforma sobre el valor del alquiler (RN-08). */
export const PORCENTAJE_COMISION = 0.12;

export interface DesglosePago {
  /** Valor del alquiler antes de comisión. */
  subtotal: number;
  /** Retención de UniTrade. */
  comision: number;
  /** Lo que paga el arrendatario (igual al subtotal). */
  total: number;
  /** Lo que recibe el propietario en su billetera. */
  montoPropietario: number;
  /** Porcentaje aplicado, expresado como fracción (0.12 = 12%). */
  porcentajeComision: number;
}

/**
 * Calcula el desglose de un pago a partir del subtotal del alquiler.
 *
 * La comisión se redondea al peso más cercano y el propietario recibe
 * exactamente la diferencia, de modo que `montoPropietario + comision === subtotal`.
 */
export function calcularDesglose(
  subtotal: number,
  porcentajeComision: number = PORCENTAJE_COMISION,
): DesglosePago {
  if (!Number.isInteger(subtotal) || subtotal <= 0) {
    throw new RangeError('El subtotal debe ser un entero positivo en COP.');
  }

  if (!Number.isFinite(porcentajeComision) || porcentajeComision < 0 || porcentajeComision >= 1) {
    throw new RangeError('El porcentaje de comisión debe estar entre 0 y 1.');
  }

  const comision = Math.round(subtotal * porcentajeComision);

  return {
    subtotal,
    comision,
    total: subtotal,
    montoPropietario: subtotal - comision,
    porcentajeComision,
  };
}

/** Formatea un monto entero en pesos colombianos, por ejemplo `$ 60.000`. */
export function formatearCop(monto: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(monto);
}
