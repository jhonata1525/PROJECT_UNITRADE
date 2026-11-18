/**
 * @file ScrollToTop.jsx
 * Garantiza que la aplicación siempre inicie en la parte superior (top: 0)
 * al cambiar de ruta, al recargar o al volver a abrir la pestaña en móvil.
 * - window.history.scrollRestoration = 'manual' para evitar que el navegador
 *   restaure la posición de scroll anterior.
 * - Escucha cambios de pathname (React Router) y hace scrollTo(0, 0).
 * - Dispatcha el evento `unitrade:refrescar-datos` en visibilitychange/pageshow
 *   para que las páginas activas (catálogo, alquileres, billetera) refresquen sus datos.
 */

import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Evitar que el navegador restaure scroll previo al recargar.
    if (typeof window !== "undefined" && window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Cada vez que cambia la ruta, ir al tope.
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const refrescar = () => {
      window.dispatchEvent(new Event("unitrade:refrescar-datos"));
    };

    // Cuando el usuario vuelve a la pestaña/app en el celular.
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refrescar();
      }
    });

    // pageshow cubre el caso de volver por caché del navegador (bfcache).
    window.addEventListener("pageshow", refrescar);

    return () => {
      window.removeEventListener("visibilitychange", refrescar);
      window.removeEventListener("pageshow", refrescar);
    };
  }, []);

  return null;
};

export default ScrollToTop;
