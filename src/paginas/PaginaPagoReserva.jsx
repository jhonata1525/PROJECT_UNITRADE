/**
 * @file PaginaPagoReserva.jsx
 * Página de confirmación de pago para reserva de artículos.
 * - Muestra el modal de confirmación de pago con desglose de comisión
 * - Recibe props del artículo reservado y sus datos financieros
 * - Botón "Confirmar y Pagar (Sandbox)" dispara el flujo de pago
 * - En producción consumiría POST /api/payments/checkout
 */

import React from "react";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import ModalConfirmacionPago from "../componentes/pasarela/ModalConfirmacionPago";
import ResumenDesgloseComision from "../componentes/pasarela/ResumenDesgloseComision";

/**
 * PaginaPagoReserva - Página de procesamiento de pago y reserva
 * - Con muestra el resumen financiero y el modal de confirmación
 * - Los datos del artículo reservado vienen de la ruta actual o state global
 * - Al hacer clic en "Confirmar y Pagar (Sandbox)", envía POST /api/payments/checkout
 */

export default function PaginaPagoReserva() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <NavegacionLateral onLogout={() => {}} onProfileClick={() => {}} />

      <main className="max-w-7xl mx-auto transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6 px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-white mb-4">
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
}