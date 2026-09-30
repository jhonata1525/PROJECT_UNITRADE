/**
 * @file PaginaBilletera.jsx
 * Página principal de la Billetera Virtual de UniTrade.
 * - Muestra el panel de indicadores salar y historial de transacciones
 * - Integra FormularioRetiroFondos para solicitar retiros
 * - En producción consumiría GET /api/wallet/balance y GET /api/wallet/historial
 */

import React from "react";
import { Encabezado } from "../componentes/comunes/Encabezado";
import VistaBilleteraVirtual from "../componentes/billetera/VistaBilleteraVirtual";
import FormularioRetiroFondos from "../componentes/billetera/FormularioRetiroFondos";
import HistorialTransacciones from "../componentes/billetera/HistorialTransacciones";

/**
 * PaginaBilletera - Componente de la vista de billetera
 * - Consta de: tarjetas de indicadores + formulario de retiro + historial de transacciones
 * - En producción consumiría hooks useApi con endpoints /api/wallet/*
 */

export const PaginaBilletera = () => {
  return (
    <div className="min-h-screen">
      <Encabezado />

      <main className="mt-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Billetera Virtual
        </h2>

        {/* Datos del wallet se obtendrían de useApi('/api/wallet/balance') */}
        <p className="text-gray-600 dark:text-gray-300">
          Administra tus fondos obtenidos de los alquileres universitarios. Utiliza el
          formulario de abajo para solicitar retiros o consulta tu historial de transacciones.
        </p>

        {/* Formulario y tabla de historial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <VistaBilleteraVirtual />
          <HistorialTransacciones />
        </div>
      </main>
    </div>
  );
};