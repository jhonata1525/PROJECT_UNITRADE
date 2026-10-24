import servicioClienteApi from "./servicioClienteApi";

const cabecerasUsuario = (usuarioId) => ({
  headers: { "x-usuario-id": usuarioId },
});

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

export const listarMisAlquileres = async (usuarioId) => {
  const { data } = await servicioClienteApi.get("/reservas", {
    ...cabecerasUsuario(usuarioId),
    params: { rol: "ARRENDATARIO", limite: 100 },
  });
  return data;
};

export const confirmarDevolucion = async (usuarioId, articuloId, codigo) => {
  const { data } = await servicioClienteApi.post(
    `/reservas/articulos/${encodeURIComponent(articuloId)}/devolucion`,
    { codigo },
    cabecerasUsuario(usuarioId),
  );
  return data;
};

export const confirmarEntrega = async (usuarioId, articuloId, codigo) => {
  const { data } = await servicioClienteApi.post(
    `/reservas/articulos/${encodeURIComponent(articuloId)}/entrega`,
    { codigo },
    cabecerasUsuario(usuarioId)
  );
  return data;
};

export const pagarMora = async (usuarioId, alquilerId) => {
  const { data } = await servicioClienteApi.post(
    `/reservas/${encodeURIComponent(alquilerId)}/pagar-mora`,
    {},
    cabecerasUsuario(usuarioId)
  );
  return data;
};
