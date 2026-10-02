/**
 * @file EnrutadorAplicacion.jsx
 * Configuración principal de rutas para la aplicación UniTrade usando React Router DOM.
 * Define todas las rutas públicas y protegidas de la aplicación, organizándolas por
 * secciones principales: auth (login/registro), dashboard, billetera, pasarela de pagos y mis artículos.
 *
 * Rutas públicas (accesibles sin autenticación):
 * - /login → PaginaInicioSesion (formulario de login con email/contraseña)
 * - /registro → PaginaRegistro (formulario de registro con @unisimon.edu.co)
 *
 * Rutas protegidas (requiere autenticación previa):
 * - / → redirige a /login
 * - /dashboard → PaginaDashboard (panel principal)
 * - /billetera → PaginaBilletera (vista de wallet virtual - HU-10)
 * - /pago → PaginaPagoReserva (modal de confirmación de pago - HU-06)
 * - /mis-articulos → PaginaMisArticulos (gestión de artículos en alquiler)
 *
 * Componentes utilizados:
 * - Encabezado: Barra superior con nombre del plantilla, datos estudiante y logout
 * - NavegacionLateral: Menú lateral en vistas de dashboard
 * - ProtectedRoute: Componente que valida autenticación antes de renderizar hijos
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProveedorAutenticacion, useAuth } from "../contexto/ContextoAutenticacion";
import PaginaDashboard from "../paginas/PaginaDashboard";
import PaginaBilletera from "../paginas/PaginaBilletera";
import PaginaPagoReserva from "../paginas/PaginaPagoReserva";
import PaginaMisArticulos from "../paginas/PaginaMisArticulos";
import PaginaPerfil from "../paginas/PaginaPerfil";
import PaginaInicioSesion from "../paginas/PaginaInicioSesion";
import PaginaRegistro from "../paginas/PaginaRegistro";

/**
 * ProtectedRoute - Wrapper que protege rutas requiriendo autenticación
 * Si no hay usuario autenticado, redirige a /login
 * Muestra loading mientras se verifica la sesión
 */
const ProtectedRoute = ({ children }) => {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)]">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-[var(--color-neon)] mx-auto mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" />
            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p className="text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const EnrutadorAplicacion = () => {
  return (
    <Router>
      <ProveedorAutenticacion>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<PaginaInicioSesion />} />
          <Route path="/registro" element={<PaginaRegistro />} />

          {/* Ruta raíz redirige a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PaginaDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billetera"
            element={
              <ProtectedRoute>
                <PaginaBilletera />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pago"
            element={
              <ProtectedRoute>
                <PaginaPagoReserva />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-articulos"
            element={
              <ProtectedRoute>
                <PaginaMisArticulos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PaginaPerfil />
              </ProtectedRoute>
            }
          />

          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ProveedorAutenticacion>
    </Router>
  );
};

export default EnrutadorAplicacion;