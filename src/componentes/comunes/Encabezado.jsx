/**
 * @file Encabezado.jsx
 * Componente visual del encabezado superior de UniTrade.
 * Muestra el nombre de la plataforma, datos del estudiante y botón de cierre de sesión.
 * Utiliza Tailwind CSS para styling responsive mobile-first.
 */

import React from "react";
import { LogOut } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../contexto/ContextoAutenticacion";

/**
 * Componente Encabezado - Viste la barra superior de la aplicación
 * - Muestra el nombre UniTrade y el logo/icono
 * - Muestra el email del estudiante autenticado (@unisimon.edu.co)
 * - Botón de cerrar sesión que dispara el logout del contexto
 */
export const Encabezado = () => {
  /** Estado para controlar si el menú móvil está abierto (aunque el encabezado es superior) */
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  /** Obtener el usuario actual y el token del contexto global de autenticación */
  const { usuario, logout } = useContext(AuthContext);

  /**
   * Manejador del clic en cerrar sesión
   * - Previene el evento por defecto
   * - Ejecuta la función logout del contexto que limpia el token y redirige a /login
   * - En producción consumiría POST /api/auth/logout para invalidar el JWT en el backend
   */
  const manejadorLogout = (e) => {
    e.preventDefault();
    logout();
  };

  return (
    <header className="header-bg sticky top-0 z-50 border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo y nombre de la plataforma */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
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
          <h1 className="text-xl font-bold text-white">UniTrade</h1>
        </div>

        {/* Información del estudiante y botón de logout */}
        <div className="flex items-center gap-4">
          {/* Avatar y email del estudiante - solo visible si está autenticado */}
          {usuario && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-slate-700/50 flex items-center justify-center text-sm font-medium">
                {usuario.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-300">
                {usuario.email}
              </span>
            </div>
          )}

          {/* Botón de cerrar sesión funcional */}
          <button
            onClick={manejadorLogout}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 relative overflow-hidden"
            aria-label="Cerrar sesión"
            role="menuitem"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};