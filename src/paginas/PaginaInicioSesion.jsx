/**
 * @file PaginaInicioSesion.jsx
 * Página de inicio de sesión para UniTrade.
 * - Formulario de login con email institucional y contraseña
 * - Valida que el correo termine en @unisimon.edu.co
 * - En modo mock: acepta cualquier contraseña para correos @unisimon.edu.co
 * - Al autenticar correctamente, redirige a /dashboard
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexto/ContextoAutenticacion";

export const PaginaInicioSesion = () => {
  // Hooks SIEMPRE en nivel superior del componente
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Valida que el correo sea institucional @unisimon.edu.co */
  const validarEmailInstitucional = (correo) => {
    return correo.endsWith("@unisimon.edu.co");
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (!validarEmailInstitucional(email)) {
      setError("El correo debe ser institucional (@unisimon.edu.co)");
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      // Solo navegación aquí, SIN useNavigate()
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Credenciales inválidas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Iniciar Sesión
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              UniTrade - Universidad Simón Bolívar
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Formulario de login */}
          <form onSubmit={manejarSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Correo institucional
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@unisimon.edu.co"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                autoComplete="email"
                aria-describedby="email-help"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" id="email-help">
                Usa tu correo institucional @unisimon.edu.co
              </p>
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                autoComplete="current-password"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                En modo desarrollo: cualquier contraseña funciona
              </p>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" />
                    <path
                      className="opacity-75"
                      d="M12 2a10 10 0 0 1 10 10"
                    />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Enlace a registro */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            ¿No tienes cuenta?{" "}
            <a
              href="/registro"
              className="text-primary hover:underline font-medium"
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaginaInicioSesion;