/**
 * @file servicioPagos.js
 * Cliente HTTP del procesamiento de pagos (HU-06).
 *
 * El backend calcula el subtotal, la comisión del 12% y el monto que recibe
 * el propietario. El frontend nunca envía montos: solo artículo y horas.
 *
 * Endpoints:
 * - POST /payments/checkout       → cobra en sandbox y abona al propietario
 * - GET  /payments/status/:id     → consulta una transacción
 * - GET  /payments/history        → historial de pagos del usuario
 */

import servicioClienteApi from "./servicioClienteApi";

const cabecerasUsuario = (usuarioId, claveIdempotencia) => ({
  headers: {
    "x-usuario-id": usuarioId,
    ...(claveIdempotencia ? { "idempotency-key": claveIdempotencia } : {}),
  },
});

/** Genera una clave de idempotencia compatible con navegadores sin Web Crypto. */
export const generarClaveIdempotencia = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

/** Convierte un error de Axios en un mensaje legible en español. */
export const mensajeErrorPagos = (
  error,
  mensajePorDefecto = "No se pudo procesar el pago."
) => {
  const respuesta = error?.response?.data;
  const mensaje = respuesta?.mensaje ?? respuesta?.message;

  if (Array.isArray(mensaje)) return mensaje.join(", ");
  if (typeof mensaje === "string" && mensaje.trim()) return mensaje;
  if (error?.message === "Network Error") {
    return "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
  }
  return mensajePorDefecto;
};

/**
 * Procesa el pago de una reserva.
 * @param {string} usuarioId - Id del arrendatario.
 * @param {object} datosPago - { articuloId, horas, inicio?, fin?, metodo? }
 * @param {string} [claveIdempotencia] - Evita cobrar dos veces la misma intención.
 */
export const procesarCheckout = async (
  usuarioId,
  datosPago,
  claveIdempotencia
) => {
  const { data } = await servicioClienteApi.post(
    "/payments/checkout",
    {
      ...datosPago,
      metodo: datosPago?.metodo || "sandbox",
      moneda: "COP",
    },
    cabecerasUsuario(usuarioId, claveIdempotencia)
  );
  return data;
};

/** Consulta el estado de un pago por id de transacción o id de pago. */
export const consultarEstadoPago = async (identificador) => {
  const { data } = await servicioClienteApi.get(
    `/payments/status/${encodeURIComponent(identificador)}`
  );
  return data;
};

/** Historial de pagos del usuario (como arrendatario o propietario). */
export const obtenerHistorialPagos = async (usuarioId, limite = 20) => {
  const { data } = await servicioClienteApi.get("/payments/history", {
    ...cabecerasUsuario(usuarioId),
    params: { limite },
  });
  return data;
};

export const servicioPagos = {
  procesarCheckout,
  consultarEstadoPago,
  obtenerHistorialPagos,
  generarClaveIdempotencia,
  mensajeErrorPagos,
};

export default servicioPagos;
