/**
 * @file PaginaDashboard.jsx
 * Página principal del dashboard de UniTrade.
 * - Muestra el layout principal con encabezado y contenido principal
 * - Incluye navegación hacia Billetera Virtual y Pasarela de Pago
 * - Muestra el correo del usuario autenticado en el encabezado
 * - En producción, los datos se obtendrían de GET /api/dashboard
 */

import React from "react";
import { Link } from "react-router-dom";
import { Encabezado } from "../componentes/comunes/Encabezado";
import { useAuth } from "../contexto/ContextoAutenticacion";

export const PaginaDashboard = () => {
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Encabezado />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del dashboard con info del usuario */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Panel de Control
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Bienvenido, <span className="font-medium text-primary">{usuario?.email || "Usuario"}</span>
          </p>
        </div>

        {/* Grid de navegación rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta: Billetera Virtual */}
          <Link
            to="/billetera"
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary/50 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Billetera Virtual
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Administra tus ganancias, solicita retiros y consulta tu historial de transacciones
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-primary group-hover:underline">
                Ir a billetera
              </span>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          {/* Tarjeta: Pasarela de Pago */}
          <Link
            to="/pago"
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary/50 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Pasarela de Pago
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Procesa pagos de reservas, revisa desglose de comisiones y confirma transacciones
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-primary group-hover:underline">
                Ir a pagos
              </span>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          {/* Tarjeta: Próximamente - Mis Artículos */}
          <div className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary/50 transition-all duration-200 opacity-75">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Mis Artículos
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Publica, edita y gestiona tus artículos universitarios en alquiler (próximamente)
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                Próximamente
              </span>
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sección de información adicional */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Accesos rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/billetera"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">Ver saldo disponible</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consulta tu balance actual</p>
            </Link>
            <Link
              to="/billetera"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">Solicitar retiro</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Transfiere a Nequi, Daviplata, etc.</p>
            </Link>
            <Link
              to="/pago"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">Nuevo pago</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Procesa pago de reserva activa</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaDashboard;