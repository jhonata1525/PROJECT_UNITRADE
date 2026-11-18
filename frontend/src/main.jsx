import React from "react";
import ReactDOM from "react-dom/client";
import EnrutadorAplicacion from "./rutas/EnrutadorAplicacion";
import { FondoDecorativo } from "./componentes/comunes/FondoDecorativo";
import ErrorBoundary from "./componentes/comunes/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <div className="app-background" aria-hidden="true" />
      <div className="app-logo-background" aria-hidden="true" />
      <FondoDecorativo />
      <EnrutadorAplicacion />
    </ErrorBoundary>
  </React.StrictMode>
);