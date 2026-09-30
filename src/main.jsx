import React from "react";
import ReactDOM from "react-dom/client";
import { ContextoAutenticacion } from "./contexto/ContextoAutenticacion";
import EnrutadorAplicacion from "./rutas/EnrutadorAplicacion";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ContextoAutenticacion>
      <EnrutadorAplicacion />
    </ContextoAutenticacion>
  </React.StrictMode>
);