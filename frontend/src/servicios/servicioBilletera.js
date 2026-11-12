/**
 * @file servicioBilletera.js
 * Cliente HTTP de la billetera virtual (HU-10).
 *
 * Todos los datos viven en PostgreSQL y se consultan al backend NestJS.
 * Mientras no exista JWT, el usuario se identifica con `x-usuario-id`.
 *
 * Endpoints:
 * - GET  /wallet/balance    → saldos y totales
 * - GET  /wallet/historial  → movimientos
 * - GET  /wallet/entidades  → métodos de retiro
 * - POST /wallet/withdraw   → retiro con payout sandbox
 * - POST /wallet/deposit    → recarga de prueba (solo sandbox)
 * - GET  /wallet/withdrawals→ solicitudes de retiro
 */

import servicioClienteApi from "./servicioClienteApi";

const cabecerasUsuario = (usuarioId) => ({
  headers: { "x-usuario-id": usuarioId },
});

/**
 * Convierte un error de Axios en un mensaje legible en español.
 * @param {unknown} error
 * @param {string} mensajePorDefecto
 * @returns {string}
 */
export const mensajeErrorBilletera = (
  error,
  mensajePorDefecto = "No se pudo completar la operación de la billetera."
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

/** Saldo disponible, pendiente, ganado y retirado del usuario. */
export const obtenerBalance = async (usuarioId) => {
  const { data } = await servicioClienteApi.get(
    "/wallet/balance",
    cabecerasUsuario(usuarioId)
  );
  return data;
};

/** Historial de movimientos (ingresos, retiros y recargas). */
export const obtenerHistorialTransacciones = async (
  usuarioId,
  { limite = 50, tipo } = {}
) => {
  const { data } = await servicioClienteApi.get("/wallet/historial", {
    ...cabecerasUsuario(usuarioId),
    params: {
      limite,
      ...(tipo ? { tipo } : {}),
    },
  });
  return data;
};

/** Métodos de retiro habilitados por el backend. */
export const listarEntidades = async () => {
  const { data } = await servicioClienteApi.get("/wallet/entidades");
  return data;
};

/**
 * Solicita un retiro. El backend retiene el saldo, ejecuta el payout sandbox
 * y devuelve el resultado. Si el payout falla, el saldo se restaura.
 */
export const solicitarRetiro = async (usuarioId, datosRetiro) => {
  const { metodo, cuenta, monto, forzarFallo } = datosRetiro;
  const { data } = await servicioClienteApi.post(
    "/wallet/withdraw",
    {
      metodo,
      cuenta,
      monto,
      ...(typeof forzarFallo === "boolean" ? { forzarFallo } : {}),
    },
    cabecerasUsuario(usuarioId)
  );
  return data;
};

/**
 * Recarga saldo de prueba (solo sandbox).
 * No cobra dinero real; sirve para demostrar la billetera y el retiro.
 */
export const recargarSaldo = async (usuarioId, datosRecarga) => {
  const { monto, metodo } = datosRecarga;
  const { data } = await servicioClienteApi.post(
    "/wallet/deposit",
    { monto, metodo },
    cabecerasUsuario(usuarioId)
  );
  return data;
};

/** Solicitudes de retiro del usuario. */
export const obtenerRetiros = async (usuarioId, limite = 20) => {
  const { data } = await servicioClienteApi.get("/wallet/withdrawals", {
    ...cabecerasUsuario(usuarioId),
    params: { limite },
  });
  return data;
};

/** Alias de compatibilidad con el contexto existente. */
export const obtenerHistorial = obtenerHistorialTransacciones;

export const servicioBilletera = {
  obtenerBalance,
  obtenerHistorial,
  obtenerHistorialTransacciones,
  listarEntidades,
  solicitarRetiro,
  recargarSaldo,
  obtenerRetiros,
  mensajeErrorBilletera,
};

export default servicioBilletera;
