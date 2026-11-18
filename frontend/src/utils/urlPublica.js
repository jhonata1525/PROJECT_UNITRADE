/* global __URL_PUBLICA_APP__ */
/**
 * @file urlPublica.js
 * Resuelve la URL base que debe llevar el QR del carnet.
 *
 * En desarrollo, Vite inyecta `__URL_PUBLICA_APP__` con la IP de la red local
 * (por ejemplo http://192.168.1.6:5173), para que el QR funcione al escanearlo
 * desde el celular. En producción se usa `VITE_PUBLIC_APP_URL` o el origen.
 */

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export const obtenerUrlBasePublica = () => {
  const explicita = (import.meta.env.VITE_PUBLIC_APP_URL || "").trim();
  if (explicita) return explicita.replace(/\/+$/, "");

  const origen = window.location.origin;
  // Si ya se abrió desde una IP o dominio accesible, el QR debe usar ese mismo.
  if (!esUrlLocal(origen)) return origen;

  const automatica =
    typeof __URL_PUBLICA_APP__ !== "undefined" ? __URL_PUBLICA_APP__ : "";

  if (automatica) {
    try {
      const url = new URL(automatica);
      // Si Vite cambió de puerto (5173 ocupado), el QR debe usar el real.
      if (window.location.port) url.port = window.location.port;
      return url.origin;
    } catch {
      return automatica.replace(/\/+$/, "");
    }
  }

  return origen.replace(/\/+$/, "");
};

export const esUrlLocal = (url) => {
  try {
    return HOSTS_LOCALES.has(new URL(url).hostname);
  } catch {
    return false;
  }
};
