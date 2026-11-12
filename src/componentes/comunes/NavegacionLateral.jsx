/**
 * @file NavegacionLateral.jsx
 * Navegación responsive UniTrade - Dark SaaS Glassmorphism.
 * Desktop (≥lg): Sidebar fija colapsable izquierda (hidden lg:block).
 * Mobile (<lg): Header fijo + Drawer overlay + Bottom Nav Bar (lg:hidden).
 */

import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexto/ContextoAutenticacion";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Package,
  KeyRound,
  QrCode,
  Compass,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/catalogo", label: "Explorar", icon: Compass },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/billetera", label: "Billetera", icon: Wallet },
  { path: "/pago", label: "Pagos", icon: CreditCard },
  { path: "/mis-articulos", label: "Artículos", icon: Package },
  { path: "/mis-alquileres", label: "Alquileres", icon: KeyRound },
  { path: "/escanear-carnet", label: "Verificar", icon: QrCode },
  { path: "/perfil", label: "Perfil", icon: User },
];

const STORAGE_COLAPSADO = "unitrade_sidebar_collapsed";

export const NavegacionLateral = () => {
  // Se recuerda en el equipo si el usuario dejó el menú colapsado.
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_COLAPSADO) === "1";
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  React.useLayoutEffect(() => {
    try {
      localStorage.setItem(STORAGE_COLAPSADO, collapsed ? "1" : "0");
    } catch {
      /* almacenamiento no disponible */
    }
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "5rem" : "16rem",
    );
  }, [collapsed]);

  const iniciales = (usuario?.nombre || usuario?.email || "U")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavClick = () => {
    // En escritorio el menú conserva el estado elegido por el usuario.
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* ========================================
         DESKTOP SIDEBAR - OCULTO EN MÓVIL (hidden lg:block)
         ======================================== */}
      <aside
        className={`max-lg:!hidden lg:block lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:flex lg:flex-col sidebar transition-[width] duration-300 ease-in-out ${
          collapsed ? "lg:w-20" : "lg:w-64"
        }`}
        aria-label="Navegación principal"
      >
        {/* Botón flotante para volver a expandir el menú colapsado. */}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-20 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-gray-400 shadow-lg shadow-black/40 transition-colors hover:border-[var(--color-neon)] hover:text-white lg:flex"
            aria-label="Expandir menú"
            title="Expandir menú"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        <div
          className={`sidebar-logo flex flex-shrink-0 items-center border-b border-[var(--color-border)] ${
            collapsed ? "justify-center p-3" : "justify-between p-4"
          }`}
        >
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
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors flex-shrink-0"
              aria-label="Colapsar menú"
              aria-expanded={!collapsed}
              title="Colapsar menú"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
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
                    data-tour={item.path.slice(1)}
                    className={({ isActive: active }) => `
                      sidebar-nav-item ${active ? "sidebar-nav-item-active" : ""}
                      ${collapsed ? "justify-center px-3" : ""}
                    `}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    onClick={handleNavClick}
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

        <div
          className={`sidebar-footer flex-shrink-0 border-t border-[var(--color-border)] ${
            collapsed ? "flex flex-col items-center gap-2 p-2" : "p-4"
          }`}
        >
          {collapsed ? (
            <>
              <NavLink
                to="/perfil"
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/5"
                title={usuario?.nombre || "Mi perfil"}
                aria-label="Mi perfil"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] text-xs font-semibold text-white">
                  {iniciales}
                </span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                type="button"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <div className="glass-panel p-3 space-y-2">
              <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] text-xs font-semibold text-white">
                  {iniciales}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {usuario?.nombre || "Estudiante UniTrade"}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {usuario?.email || usuario?.correo || "Cuenta activa"}
                  </p>
                </div>
              </div>
              <NavLink
                to="/perfil"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                <span>Mi Perfil</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-[rgba(239,68,68,0.1)] transition-colors text-sm"
                type="button"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================
         MOBILE HEADER (lg:hidden) - Fixed top
         ======================================== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-surface border-b border-[var(--color-border)]">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2 group" aria-label="UniTrade - Inicio">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white text-gradient">UniTrade</span>
          </NavLink>

          <div className="flex items-center gap-2">
            <NavLink to="/perfil" className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors" aria-label="Mi perfil">
              <User className="w-5 h-5" />
            </NavLink>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================
         MOBILE DRAWER OVERLAY (lg:hidden) - Full screen
         ======================================== */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer"
          className="lg:hidden fixed inset-0 z-50 bg-[var(--color-canvas)]/95 backdrop-blur-xl animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-drawer-title"
        >
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 z-60 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />

          <div className="relative z-50 flex flex-col h-full">
            <div className="p-6 border-b border-[var(--color-border)] flex-shrink-0">
              <h2 id="mobile-drawer-title" className="text-xl font-bold text-white text-gradient">Navegación</h2>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin" role="navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    data-tour={item.path.slice(1)}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? "text-white bg-gradient-to-r from-[var(--color-accent-500)]/10 to-[var(--color-neon)]/10 border border-[var(--color-border-hover)]"
                        : "text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.03)]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? "text-[var(--color-neon)]" : "text-gray-400"}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              <hr className="border-[var(--color-border)] my-4" />

              <NavLink
                to="/perfil"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors text-base"
              >
                <User className="w-5 h-5" /><span>Mi Perfil</span>
              </NavLink>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-[rgba(239,68,68,0.1)] transition-colors text-base" type="button">
                <LogOut className="w-5 h-5" /><span>Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ========================================
         MOBILE BOTTOM NAVIGATION BAR (lg:hidden) - Fixed bottom
         ======================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-surface border-t border-[var(--color-border)]" aria-label="Navegación principal móvil" style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
        <div className="grid grid-cols-8">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-tour={item.path.slice(1)}
                onClick={handleNavClick}
                className={`flex flex-col items-center gap-1 px-1 py-3 transition-all ${isActive ? "text-[var(--color-neon)]" : "text-gray-400 active:text-white"}`}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[9px] font-medium leading-tight text-center">{item.label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-neon)] animate-pulse" aria-hidden="true" />}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default NavegacionLateral;