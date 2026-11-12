/**
 * @file PaginaVerificarCarnet.jsx
 * Página pública de verificación del carnet digital de UniTrade.
 * Se abre al escanear el QR del carnet (/verificar/:token) y consulta al
 * backend, que es la única autoridad para decir si el carnet es válido.
 */

import React from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { verificarCarnet } from "../servicios/servicioCarnet";
import ResultadoVerificacionCarnet, {
  EstadoCargandoCarnet,
  EstadoErrorCarnet,
} from "../componentes/carnet/ResultadoVerificacionCarnet";

export default function PaginaVerificarCarnet() {
  const { token } = useParams();
  const [cargando, setCargando] = React.useState(true);
  const [resultado, setResultado] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let activo = true;

    setCargando(true);
    setResultado(null);
    setError("");

    if (!token) {
      setError("El enlace no incluye un código de carnet.");
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    verificarCarnet(token)
      .then((data) => {
        if (activo) setResultado(data);
      })
      .catch((fallo) => {
        if (!activo) return;

        if (axios.isAxiosError(fallo) && fallo.response?.status === 404) {
          const data = fallo.response.data ?? {};
          setResultado({
            valido: false,
            motivos: [data.motivo || "CARNET_NO_ENCONTRADO"],
            mensaje: data.mensaje,
            carnet: null,
          });
          return;
        }

        setError(
          axios.isAxiosError(fallo) && !fallo.response
            ? "No se pudo conectar con el servidor de UniTrade."
            : "Ocurrió un error al consultar el carnet. Intenta de nuevo.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <header className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-r from-red-600 via-red-800 to-blue-900 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Verificación de carnet
          </h1>
          <p className="text-sm text-gray-400">
            Universidad Simón Bolívar · UniTrade
          </p>
        </header>

        <div className="glass-card p-6">
          {cargando && <EstadoCargandoCarnet />}
          {!cargando && error && <EstadoErrorCarnet mensaje={error} />}
          {!cargando && !error && resultado && (
            <ResultadoVerificacionCarnet resultado={resultado} />
          )}
        </div>

        <div className="text-center text-xs text-gray-500 space-y-2">
          <p>
            La validación la realiza el sistema de UniTrade. Ningún estudiante
            puede aprobar un carnet manualmente. La inscripción oficial solo
            puede certificarla la Universidad Simón Bolívar.
          </p>
          <Link
            to="/login"
            className="inline-block text-[var(--color-neon)] hover:underline"
          >
            Ir a UniTrade
          </Link>
        </div>
      </div>
    </div>
  );
}
