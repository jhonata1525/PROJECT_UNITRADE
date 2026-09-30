/**
 * @file ModalConfirmacionPago.jsx
 * Componente modal que muestra el resumen del pago y desglose de comisión
 * para la Historia de Usuario HU-06: Procesamiento de Pago y Comisión.
 *
 * Features principales:
 * - Muestra el artículo universitario reservado (nombre, horas, tarifa/hora)
 * - Desglose financiero transparente:
   * Subtotal Alquiler
   * Retención Comisión UniTrade (% de la plataforma)
   * Total a pagar por el Arrendatario
 * - Botón destacado "Confirmar y Pagar (Sandbox)"
 * - Estados de manejo: Procesando (Spinner), Éxito (Transacción autorizada y reserva a estado "Confirmada") y Error
 * - Comentario explícito sobre el endpoint objetivo: POST /api/payments/checkout.
 */

import React, { useState, useEffect } from "react";
import ModalGenerico from "../comunes/ModalGenerico";
import IndicadorCarga from "../comunes/IndicadorCarga";
import AlertaToast from "../comunes/AlertaToast";
import { useApi } from "../../hooks/useApi";
import { useContext } from "react";
import { AuthContext } from "../../contexto/ContextoAutenticacion";
import { useNavigate } from "react-router-dom";

/**
 * ModalConfirmacionPago - Modal de confirmación de pago con desglose de comisión
 *
 * Estados de la interfaz:
 * - "idle": Estado inicial, muestra el resumen estático y botón de confirmar
 * - "processing": Cuando el usuario hace clic en confirmar, muestra spinner y desactiva botón
 * - "success": Después de autorización exitosa, muestra mensaje de transacción confirmada
 * - "error": Si la petición falla, muestra mensaje de error con detalles
 *
 * Props: Ninguna (es un componente autónomo que usa contexto y hooks)
 *
 * Datos simulados (cuando VITE_USAR_MOCK=true):
 * - artículo: { nombre: "Mesa de estudio", horas: 4, tarifaHora: 15000 }
 * - comisionPlataforma: 0.10 (10%)
 * - subtotal: horas * tarifaHora
 * - retención: subtotal * comisionPlataforma
 * - total: subtotal - retención
 *
 * Endpoint producción: POST /api/payments/checkout
 * Datos enviados: { itemId, horas, subtotal, retencion, total, usuarioId }
 */

const ModalConfirmacionPago = () => {
  /** Hook personalizado que maneja estados loading/error/success y fetch al endpoint */
  const { datos, loading, error, fetchApi, execute } = useApi("/api/payments/checkout");

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
  const comisionPorcentaje = 0.10; // 10% comisión UniTrade (constante de negocio)
  const retencion = subtotal * comisionPorcentaje;
  const totalPagar = subtotal - retencion;

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
      const respuesta = await execute({
        metodo: "POST",
        datos: {
          itemId: articulo.nombre,
          horas: articulo.horas,
          subtotal: subtotal,
          retencion: retencion,
          total: totalPagar,
          moneda: "COP",
        },
      });

      // En caso de éxito: transición a vista success y mostrar toast
      setVista("success");
      // TODO: Toast de éxito - "Transacción autorizada y reserva confirmada"
      // En producción aquí recibiríamos: { transactionId, estado: "confirmada" }
    } catch (err) {
      // En caso de error: transición a vista error
      setVista("error");
      // TODO: Toast de error con mensaje de la falla
    }
  };

  /** Efecto que reacciona al cambio de vista para manejar navegación/post-procesado */
  useEffect(() => {
    switch (vista) {
      case "success": {
        // En un caso completo, aquí navegaríamos a la página de confirmación
        // o mostraríamos el resumen de que la reserva está "Confirmada"
        setTimeout(() => {
          // window.location.href = "/confirmacion-pago";
        }, 2000);
        break;
      }
      case "error": {
        // Mantener el usuario informado y permitir reintentar
        break;
      }
      default:
        break;
    }
  }, [vista]);

  return (
    <ModalGenerico
      abierto={vista !== "idle" || true} // Siempre visible para HU-06
      titulo="Confirmar Pago - UniTrade"
      onCancelar={() => setVista("idle")}
    >
      {/* Resumen del artículo reservado */}
      <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Resumen de tu reserva
        </h2>

        {/* Nombre del artículo */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-gray-500 dark:text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
              <path d="M9 10H7a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-2" />
            </svg>
          </div>
          <div className="flex-1 pt-1">
            <p className="text-gray-700 dark:text-gray-300">
              {articulo.nombre}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {articulo.horas} horas seleccionadas · ${articulo.tarifaHora}/hora
            </p>
          </div>
        </div>

        {/* Tarifa por hora desglosada */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Tarifa por hora:</span>
          <span className="font-medium">${articulo.tarifaHora.toLocaleString()}</span>
          <span className="text-gray-500 dark:text-gray-400">Horas:</span>
          <span className="font-medium">{articulo.horas}</span>
        </div>
      </div>

      {/* Desglose financiero transparente */}
      <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Desglose financiero
        </h3>

        {/* Subtotal Alquiler */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal Alquiler</span>
          <span className="font-medium">${subtotal.toLocaleString()}</span>
        </div>

        {/* Retención Comisión UniTrade (%) */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Retención Comisión UniTrade ({comisionPorcentaje * 100}%)
          </span>
          <span className="font-medium text-red-600 dark:text-red-400">
            -${retencion.toLocaleString()}
          </span>
        </div>

        {/* Total a pagar por el Arrendatario */}
        <div className="flex justify-between text-bold border-t border-gray-200 dark:border-gray-700 pt-3">
          <span className="text-gray-600 dark:text-gray-400">Total a pagar</span>
          <span className="font-xl text-red-600 dark:text-red-300">
            $${totalPagar.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Botón de acción principal */}
      <div className="pt-4">
        {/* Botón destacado "Confirmar y Pagar (Sandbox)" */}
        {vista === "processing" ? (
          <IndicadorCarga texto="Procesando" tamaño="sm" />
        ) : (
          <BotonDestacado
            onClick={manejarConfirmarPago}
            disabled={vista !== "idle"}
            clase="w-full"
          >
            {vista === "processing"
              ? "Procesando..."
              : "Confirmar y Pagar (Sandbox)"}
          </BotonDestacado>
        )}
      </div>

      {/* Mostrar estado de éxito o error */}
      {vista === "success" && (
        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 p-4 rounded-md mb-4 text-center">
          <p className="font-medium">Transacción autorizada</p>
          <p className="text-sm mt-1">
            Tu reserva ha sido confirmada y el artículo está reservado para ti.
          </p>
        </div>
      )}

      {vista === "error" && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 p-4 rounded-md mb-4 text-center">
          <p className="font-medium">Error en el pago</p>
          <p className="text-sm mt-1">
            No fue posible procesar el pago en este momento. Inténtalo de nuevo.
          </p>
        </div>
      )}
    </ModalGenerico>
  );
};

/** Componente helper BotonDestacado usado dentro del modal */
const BotonDestacado = ({
  onClick,
  children,
  disabled = false,
  clase = "btn-primary",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={` ${clase} py-3 px-6 rounded-full font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      type="button"
    >
      {children}
    </button>
  );
};

export default ModalConfirmacionPago;
