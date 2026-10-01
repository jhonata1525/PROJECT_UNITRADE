/**
 * @file NavegacionLateral.jsx
 * Sidebar glassmorphism con indicador neón para estado activo.
 * Navegación principal: Dashboard, Billetera Virtual, Pasarela de Pago, Mis Artículos.
 */

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Package,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/billetera", label: "Billetera Virtual", icon: Wallet },
  { path: "/pago", label: "Pasarela de Pago", icon: CreditCard },
  { path: "/mis-articulos", label: "Mis Artículos", icon: Package },
];

export const NavegacionLateral = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();

  return (
    <aside
      className={`sidebar transition-all duration-300 ease-in-out ${
        collapsed ? "sidebar-collapsed" : ""
      }`}
      aria-label="Navegación principal"
    >
      <div className="sidebar-logo flex items-center justify-between">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 group"
          aria-label="UniTrade - Inicio"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-white text-gradient">
              UniTrade
            </span>
          )}
        </NavLink>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors flex-shrink-0"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin" role="navigation">
        <ul className="space-y-1" role="list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive: active }) => `
                    sidebar-nav-item ${active ? "sidebar-nav-item-active" : ""}
                    ${collapsed ? "justify-center px-3" : ""}
                  `}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => collapsed && setCollapsed(false)}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? "text-[var(--color-neon)]" : "text-gray-400 group-hover:text-white"
                    } transition-colors`}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="glass-panel p-3">
            <p className="text-xs text-gray-500 text-center">
              Modo oscuro forzado
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default NavegacionLateral;