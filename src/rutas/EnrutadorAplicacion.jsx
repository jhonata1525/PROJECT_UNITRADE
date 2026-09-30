/**
 * @file EnrutadorAplicacion.jsx
 * Configuración principal de rutas para la aplicación UniTrade usando React Router DOM.
 * Define todas las rutas públicas y protegidas de la aplicación, organizándolas por
 * secciones principales: auth (login/registro), dashboard, billetera y pasarela de pagos.
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
 *
 * Componentes utilizados:
 * - Encabezado: Barra superior con nombre del plantilla, datos estudiante y logout
 * - NavegacionLateral: Menú lateral en vistas de dashboard
 * - ProtectedRoute: Componente que valida autenticación antes de renderizar hijos
 */

import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ContextoAutenticacion, useAuth } from "../contexto/ContextoAutenticacion";
import { PaginaDashboard } from "../paginas/PaginaDashboard";
import { PaginaBilletera } from "../paginas/PaginaBilletera";
import { PaginaPagoReserva } from "../paginas/PaginaPagoReserva";
import { PaginaInicioSesion } from "../paginas/PaginaInicioSesion";
import { PaginaRegistro } from "../paginas/PaginaRegistro";

/**
 * ProtectedRoute - Wrapper que protege rutas requiriendo autenticación
 * Si no hay usuario autenticado, redirige a /login
 */
const ProtectedRoute = ({ children }) => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const EnrutadorAplicacion = () => {
  return (
    <Router>
      <ContextoAutenticacion>
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
                <Suspense fallback={<div className="text-center py-20">Cargando dashboard...</div>}>
                  <PaginaDashboard />
                </Suspense>
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

          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ContextoAutenticacion>
    </Router>
  );
};

export default EnrutadorAplicacion;