import servicioClienteApi from "./servicioClienteApi";

export const mensajeErrorReservas = (
  error,
  mensajePorDefecto = "No se pudo completar la operación con las reservas.",
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

export const listarMisAlquileres = async (_usuarioId, rol = "ARRENDATARIO") => {
  const { data } = await servicioClienteApi.get("/reservas", {
    params: { rol, limite: 100 },
  });
  return data;
};

export const crearCalificacion = async (
  _usuarioId,
  alquilerId,
  calificacion,
) => {
  const { data } = await servicioClienteApi.post(
    `/calificaciones/${encodeURIComponent(alquilerId)}`,
    calificacion,
  );
  return data;
};

export const confirmarDevolucion = async (_usuarioId, articuloId, codigo) => {
  const { data } = await servicioClienteApi.post(
    `/reservas/articulos/${encodeURIComponent(articuloId)}/devolucion`,
    { codigo },
  );
  return data;
};

export const confirmarEntrega = async (_usuarioId, articuloId, codigo) => {
  const { data } = await servicioClienteApi.post(
    `/reservas/articulos/${encodeURIComponent(articuloId)}/entrega`,
    { codigo },
  );
  return data;
};

export const pagarMora = async (_usuarioId, alquilerId) => {
  const { data } = await servicioClienteApi.post(
    `/reservas/${encodeURIComponent(alquilerId)}/pagar-mora`,
    {},
  );
  return data;
};
