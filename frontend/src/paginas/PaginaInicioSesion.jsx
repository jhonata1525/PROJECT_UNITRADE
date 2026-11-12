import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexto/ContextoAutenticacion";

export default function PaginaInicioSesion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/catalogo", { replace: true });
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="mb-8 text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] shadow-lg shadow-blue-500/30">
            <Sparkles className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Uni<span className="text-gradient">Trade</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Alquila y comparte dentro de tu universidad
          </p>
        </div>

        <div className="glass-card overflow-hidden shadow-2xl shadow-black/50 animate-scale-in">
          <div className="border-b border-[var(--color-border)] bg-gradient-to-br from-[var(--color-accent-500)]/20 to-[var(--color-neon)]/10 px-6 py-5">
            <h2 className="text-xl font-semibold text-white">
              Bienvenido de vuelta
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Ingresa con tu correo institucional
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {location.state?.mensaje && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{location.state.mensaje}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={manejarSubmit}>
              <div>
                <label
                  htmlFor="correo"
                  className="block text-sm font-medium text-gray-300"
                >
                  Correo institucional
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                    aria-hidden="true"
                  />
                  <input
                    id="correo"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@unisimon.edu.co"
                    className="glass-input"
                    style={{ paddingLeft: "2.75rem" }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  Solo correos @unisimon.edu.co
                </p>
              </div>

              <div>
                <label
                  htmlFor="contrasena"
                  className="block text-sm font-medium text-gray-300"
                >
                  Contraseña
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                    aria-hidden="true"
                  />
                  <input
                    id="contrasena"
                    type={mostrarContrasena ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input"
                    style={{
                      paddingLeft: "2.75rem",
                      paddingRight: "2.75rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContrasena((valor) => !valor)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 transition-colors hover:text-white"
                    aria-label={
                      mostrarContrasena
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={mostrarContrasena}
                  >
                    {mostrarContrasena ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full gap-2"
              >
                {loading ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      aria-hidden="true"
                    />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              ¿Todavía no tienes cuenta?{" "}
              <Link
                to="/registro"
                className="font-medium text-[var(--color-neon)] underline underline-offset-4 transition-colors hover:text-white"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Universidad Simón Bolívar · Comunidad UniTrade
        </p>
      </div>
    </div>
  );
}
