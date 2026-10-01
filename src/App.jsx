import React from "react";
import EnrutadorAplicacion from "./rutas/EnrutadorAplicacion";
import { useRippleEffect } from "./componentes/comunes/EfectoOnda";

/**
 * App - Componente raíz de la aplicación UniTrade
 * - Incluye fondo animado (mesh gradient)
 * - Activa efecto ripple global en botones y tarjetas interactivas
 */
const App = () => {
  useRippleEffect();

  return (
    <>
      <div className="app-background" aria-hidden="true" />
      <EnrutadorAplicacion />
    </>
  );
};

export default App;