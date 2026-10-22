/**
 * @file servicioPasarelaPago.js
 * Compatibilidad con el nombre anterior del servicio de pagos.
 *
 * La implementación real vive en `servicioPagos.js`. Este archivo solo
 * reexporta las funciones para no romper importaciones antiguas.
 */

export {
  procesarCheckout,
  consultarEstadoPago,
  consultarEstadoPago as consultarEstadoTransaccion,
  obtenerHistorialPagos,
  generarClaveIdempotencia,
  mensajeErrorPagos,
} from "./servicioPagos";

import {
  procesarCheckout,
  consultarEstadoPago,
  obtenerHistorialPagos,
  generarClaveIdempotencia,
  mensajeErrorPagos,
} from "./servicioPagos";

const servicioPasarelaPago = {
  procesarCheckout,
  consultarEstadoPago,
  consultarEstadoTransaccion: consultarEstadoPago,
  obtenerHistorialPagos,
  generarClaveIdempotencia,
  mensajeErrorPagos,
};

export default servicioPasarelaPago;
