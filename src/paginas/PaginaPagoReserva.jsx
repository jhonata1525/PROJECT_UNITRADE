/**
 * @file PaginaPagoReserva.jsx
 * Página de confirmación de pago para reserva de artículos.
 * - Muestra el modal de confirmación de pago con desglose de comisión
 * - Recibe props del artículo reservado y sus datos financieros
 * - Botón "Confirmar y Pagar (Sandbox)" dispara el flujo de pago
 * - En producción consumiría POST /api/payments/checkout
 */

import React from "react";
import { Encabezado } from "../componentes/comunes/Encabezado";
import ModalConfirmacionPago from "../componentes/pasarela/ModalConfirmacionPago";
import ResumenDesgloseComision from "../componentes/pasarela/ResumenDesgloseComision";

/**
 * PaginaPagoReserva - Página de procesamiento de pago y reserva
 * - Con muestra el resumen financiero y el modal de confirmación
 * - Los datos del artículo reservado vienen de la ruta actual o state global
 * - Al hacer clic en "Confirmar y Pagar (Sandbox)", envía POST /api/payments/checkout
 */

export const PaginaPagoReserva = () => {
  return (
    <div className="min-h-screen">
      <Encabezado />

      <main className="mt-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Pago y Reserva
        </h2>

        {/* Desglose financiero y modal de pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ResumenDesgloseComision />
          <ModalConfirmacionPago />
        </div>
      </main>
    </div>
  );
};