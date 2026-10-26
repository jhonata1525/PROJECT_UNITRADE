/**
 * @file servicioCarnet.js
 * Cliente del carnet digital: emisión del token propio y verificación pública.
 */

import servicioClienteApi from "./servicioClienteApi";

/**
 * Obtiene (o emite) el carnet del usuario autenticado.
 * @param {string} usuarioId Id del usuario dueño del carnet
 */
export const obtenerMiCarnet = async (usuarioId) => {
  const { data } = await servicioClienteApi.get("/carnet/mio", {
    headers: { "x-usuario-id": usuarioId },
  });
  return data;
};

/**
 * Verifica públicamente un carnet por el token de su QR.
 * @param {string} token Token contenido en la URL del QR
 */
export const verificarCarnet = async (token) => {
  const { data } = await servicioClienteApi.get(
    `/carnet/verificar/${encodeURIComponent(token)}`,
  );
  return data;
};
