/**
 * @file ModalConfirmacionPago.jsx
 * Componente modal que muestra el resumen del pago y desglose de comisión
 * para la Historia de Usuario HU-06: Procesamiento de Pago y Comisión.
 *
 * Features principales:
 * - Muestra el artículo universitario reservado (nombre, horas, tarifa/hora)
 * - Desglose financiero transparente:
 *   * Subtotal Alquiler
 *   * Retención Comisión UniTrade (% de la plataforma)
 *   * Total a pagar por el Arrendatario
 * - Botón destacado "Confirmar y Pagar (Sandbox)"
 * - Estados de manejo: Procesando (Spinner), Éxito (Transacción autorizada y reserva a estado "Confirmada") y Error
 * - Comentario explícito sobre el endpoint objetivo: POST /api/payments/checkout.
 */

import React, { useState, useEffect, useCallback } from "react";
import ModalGenerico from "../comunes/ModalGenerico";
import IndicadorCarga from "../comunes/IndicadorCarga";
import AlertaToast from "../comunes/AlertaToast";
import { useApi } from "../../hooks/useApi";
import { X, CheckCircle2, AlertCircle, Loader2, CreditCard } from "lucide-react";

/**
 * ModalConfirmacionPago - Modal de confirmación de pago con desglose de comisión
 *
 * Estados de la interfaz:
 * - "idle": Estado inicial, modal CERRADO, muestra resumen estático y botón de confirmar
 * - "processing": Cuando el usuario hace clic en confirmar, muestra spinner y desactiva botón
 * - "success": Después de autorización exitosa, muestra mensaje de transacción confirmada
 * - "error": Si la petición falla, muestra mensaje de error con detalles
 *
 * Props: Ninguna (es un componente autónomo que usa contexto y hooks)
 *
 * Datos simulados (cuando VITE_USAR_MOCK=true):
 * - artículo: { nombre: "Mesa de estudio", horas: 4, tarifaHora: 15000 }
 * - comisionPlataforma: 0.12 (12% - RN-08 UniTrade)
 * - subtotal: horas * tarifaHora
 * - retención: subtotal * comisionPlataforma
 * - total: subtotal - retención
 *
 * Endpoint producción: POST /api/payments/checkout
 * Datos enviados: { itemId, horas, subtotal, retencion, total, usuarioId }
 */

const COMISION_PORCENTAJE = 0.12; // 12% comisión UniTrade (RN-08)

const formatCOP = (valor) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor);

const ModalConfirmacionPago = () => {
  /** Hook personalizado que maneja estados loading/error/success y fetch al endpoint */
  const { execute } = useApi("/api/payments/checkout");

  /** Estado interno para gestionar la vista actual del modal */
  const [vista, setVista] = useState("idle"); // idle | processing | success | error

  /** Datos del artículo reservado - en producción vendrían de la reserva activa */
  const [articulo, setArticulo] = useState({
    nombre: "Mesa de estudio universitaria",
    horas: 4,
    tarifaHora: 15000,
  });

  /** Desglose financiero calculado a partir de los datos del artículo */
  const subtotal = articulo.horas * articulo.tarifaHora;
  const retencion = subtotal * COMISION_PORCENTAJE;
  const totalPagar = subtotal - retencion;

  /** Manejador para cerrar el modal correctamente */
  const manejarCerrar = useCallback((e) => {
    if (e) e.stopPropagation();
    setVista("idle");
  }, []);

  /** Manejador para confirmar y procesar el pago */
  const manejarConfirmarPago = async () => {
    // Transición de vista a procesando
    setVista("processing");

    // En modo mock, simulamos el delay de red
    const delay = 1500;
    if (import.meta.env.VITE_USAR_MOCK === "true") {
      await new Promise((res) => setTimeout(res, delay));
    }

    // Ejecutar la petición POST al endpoint de checkout
    try {
      await execute({
        metodo: "POST",
        datos: {
          itemId: articulo.nombre,
          horas: articulo.horas,
          subtotal,
          retencion,
          total: totalPagar,
          moneda: "COP",
        },
      });

      // En caso de éxito: transición a vista success
      setVista("success");
    } catch (err) {
      // En caso de error: transición a vista error
      setVista("error");
    }
  };

  /** Efecto que reacciona al cambio de vista para manejar navegación/post-procesado */
  useEffect(() => {
    if (vista === "success") {
      setTimeout(() => {
        // window.location.href = "/confirmacion-pago";
      }, 2000);
    }
  }, [vista]);

  return (
    <ModalGenerico
      abierto={vista !== "idle"}
      titulo="Confirmar Pago - UniTrade"
      onCancelar={manejarCerrar}
      size="md"
    >
      {/* Resumen del artículo reservado */}
      <div className="space-y-4 pb-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-medium text-white">
          Resumen de tu reserva
        </h2>

        {/* Nombre del artículo */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-canvas)] flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-[var(--color-neon)]" />
          </div>
          <div className="flex-1 pt-1">
            <p className="text-white">{articulo.nombre}</p>
            <p className="text-sm text-gray-400">
              {articulo.horas} horas seleccionadas · {formatCOP(articulo.tarifaHora)}/h
            </p>
          </div>
        </div>

        {/* Tarifa por hora desglosada */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-400">Tarifa por hora:</span>
          <span className="font-medium text-white">{formatCOP(articulo.tarifaHora)}</span>
          <span className="text-gray-400">Horas:</span>
          <span className="font-medium text-white">{articulo.horas}</span>
        </div>
      </div>

      {/* Desglose financiero transparente */}
      <div className="space-y-3 pb-4 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-medium text-gray-400">
          Desglose financiero
        </h3>

        {/* Subtotal Alquiler */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal Alquiler</span>
          <span className="font-medium text-white">{formatCOP(subtotal)}</span>
        </div>

        {/* Retención Comisión UniTrade (12%) */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            Retención Comisión UniTrade ({(COMISION_PORCENTAJE * 100).toFixed(0)}%)
          </span>
          <span className="font-medium text-red-400">
            -{formatCOP(retencion)}
          </span>
        </div>

        {/* Total a pagar por el Arrendatario */}
        <div className="flex justify-between font-bold border-t border-[var(--color-border)] pt-3">
          <span className="text-gray-400">Total a pagar</span>
          <span className="text-xl text-[var(--color-neon)]">
            {formatCOP(totalPagar)}
          </span>
        </div>
      </div>

      {/* Botón de acción principal */}
      <div className="pt-4">
        {vista === "processing" ? (
          <IndicadorCarga texto="Procesando" tamaño="sm" />
        ) : (
          <button
            onClick={manejarConfirmarPago}
            disabled={vista !== "idle"}
            className="w-full btn-primary py-3 px-6 rounded-full font-medium transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {vista === "processing"
              ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Procesando...</>
              : <><CreditCard className="w-5 h-5 mr-2" /> Confirmar y Pagar (Sandbox)</>}
          </button>
        )}
      </div>

      {/* Mostrar estado de éxito o error */}
      {vista === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium">Transacción autorizada</p>
          </div>
          <p className="text-sm">
            Tu reserva ha sido confirmada y el artículo está reservado para ti.
          </p>
        </div>
      )}

      {vista === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Error en el pago</p>
          </div>
          <p className="text-sm">
            No fue posible procesar el pago en este momento. Inténtalo de nuevo.
          </p>
        </div>
      )}
    </ModalGenerico>
  );
};

export default ModalConfirmacionPago;