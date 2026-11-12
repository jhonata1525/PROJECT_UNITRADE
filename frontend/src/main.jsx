import React from "react";
import ReactDOM from "react-dom/client";
import EnrutadorAplicacion from "./rutas/EnrutadorAplicacion";
import { FondoDecorativo } from "./componentes/comunes/FondoDecorativo";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="app-background" aria-hidden="true" />
    <FondoDecorativo />
    <EnrutadorAplicacion />
  </React.StrictMode>
);