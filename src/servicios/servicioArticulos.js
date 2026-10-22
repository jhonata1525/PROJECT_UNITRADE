/**
 * @file servicioArticulos.js
 * Cliente HTTP del módulo de artículos del backend.
 *
 * Reemplaza la persistencia en localStorage de "Mis Artículos": ahora todos
 * los artículos viven en la tabla `articulo` de PostgreSQL y se comparten
 * entre usuarios. Mientras no exista JWT, el usuario se identifica con el
 * header `x-usuario-id` (igual que los módulos de pagos y billetera).
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
export const mensajeErrorArticulos = (
  error,
  mensajePorDefecto = "No se pudo completar la operación con los artículos."
) => {
  const respuesta = error?.response?.data;
  const mensaje = respuesta?.message ?? respuesta?.mensaje;

  if (Array.isArray(mensaje)) return mensaje.join(", ");
  if (typeof mensaje === "string" && mensaje.trim()) return mensaje;
  if (error?.message === "Network Error") {
    return "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
  }
  return mensajePorDefecto;
};

/** Artículos publicados por el usuario autenticado. */
export const listarMisArticulos = async (usuarioId) => {
  const { data } = await servicioClienteApi.get(
    "/articulos/mios",
    cabecerasUsuario(usuarioId)
  );
  return data;
};

/** Catálogo público de artículos activos. */
export const listarCatalogoArticulos = async (parametros = {}) => {
  const { data } = await servicioClienteApi.get("/articulos", {
    params: parametros,
  });
  return data;
};

/** Publica un artículo nuevo en la tabla `articulo`. */
export const crearArticulo = async (usuarioId, articulo) => {
  const { data } = await servicioClienteApi.post(
    "/articulos",
    articulo,
    cabecerasUsuario(usuarioId)
  );
  return data;
};

/** Actualiza un artículo propio. */
export const actualizarArticulo = async (usuarioId, id, cambios) => {
  const { data } = await servicioClienteApi.patch(
    `/articulos/${encodeURIComponent(id)}`,
    cambios,
    cabecerasUsuario(usuarioId)
  );
  return data;
};

/** Elimina (o pausa, si tiene reservas) un artículo propio. */
export const eliminarArticulo = async (usuarioId, id) => {
  const { data } = await servicioClienteApi.delete(
    `/articulos/${encodeURIComponent(id)}`,
    cabecerasUsuario(usuarioId)
  );
  return data;
};

/**
 * Importa los artículos que el usuario tenía guardados en localStorage.
 * Es idempotente: el backend usa el id local como `claveExterna` para no
 * duplicar registros si la sincronización se ejecuta varias veces.
 */
export const importarArticulos = async (usuarioId, articulos) => {
  const { data } = await servicioClienteApi.post(
    "/articulos/importar",
    { articulos },
    cabecerasUsuario(usuarioId)
  );
  return data;
};

export default {
  listarMisArticulos,
  listarCatalogoArticulos,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  importarArticulos,
  mensajeErrorArticulos,
};
