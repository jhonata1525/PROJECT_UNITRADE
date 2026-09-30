/**
 * @file NavegacionLateral.jsx
 * Componente de navegación lateral para vista de dashboard/responsivo.
 * Proporciona enlaces principales a las diferentes secciones de la aplicación.
 * Adaptado para ser colapsable en dispositivos móviles.
 */

import React from "react";
import {
  Home,
  Wallet,
  Settings,
  LogOut,
  Search,
  Users,
} from "lucide-react";

/**
 * Componente NavegacionLateral - Menú de navegación lateral
 * - Lista de enlaces navegables: Inicio, Billetera, Catálogo, Perfil
 * - Cada enlace incluye un ícono de LucideReact y etiqueta de acceso
 * - Estado interno para controlar si el menú está expandido o colapsado
 * - En producción, cada enlace navegaría a sus respectivas rutas protegidas
 */
export const NavegacionLateral = () => {
  /** Estado para alternar entre menú expandido y colapsado en móvil */
  const [expandido, setExpandido] = React.useState(true);

  /** Opciones del menú con rótulos y respectivos componentes/icons */
  const opcionesMenu = [
    { ruta: "/dashboard", icono: Home, etiqueta: "Inicio" },
    { ruta: "/billetera", icono: Wallet, etiqueta: "Billetera" },
    { ruta: "/catalogo", icono: Users, etiqueta: "Catálogo" },
    { ruta: "/perfil", icono: Settings, etiqueta: "Perfil" },
  ];

  /**
   * Manejador para alternar el estado expandido/colapsado
   * Alternativa el estado booleano para mostrar u ocultar las opciones
   * en vista móvil donde el menú lateral se superpone al contenido
   */
  const alternarMenu = () => {
    setExpandido(!expandido);
  };

  return (
    <nav
      className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 min-h-screen"
    >
      <div className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          UniTrade
        </h2>
        <button
          onClick={alternarMenu}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Abrir/cerrar menú"
        >
          {expandido ? <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M15 18l-6-6L2 12l6-6" />
          </svg> : <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M15 18l-6-6L2 12l6-6" />
          </svg>}
        </button>
      </div>

      <ul className="space-y-1 px-2 pb-4">
        {opcionesMenu.map((opcion) => (
          <li
            key={opcion.ruta}
            className={
              expandido
                ? "px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                : "hidden"
            }
          >
            <a
              href={opcion.ruta}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <opcion.icono className="w-4 h-4" />
              <span>{opcion.etiqueta}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};