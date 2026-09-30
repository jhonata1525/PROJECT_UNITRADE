/**
 * @file servicioPasarelaPago.js
 * Servicio específico para la pasarela de pagos de UniTrade (HU-06).
 *
 * Este módulo encapsula todas las peticiones relacionadas con el procesamiento
 * de pagos y el desglose de comisiones para la historia de usuario HU-06:
 * "Procesamiento de Pago y Comisión".
 *
 * Endpoints de producción:
 * - POST /api/payments/checkout → Crear sesión de pago en Sandbox/Stripe
 *   Body: { itemId, horas, subtotal, retencion, total, usuarioId, moneda }
 * - GET /api/payments/status/:transactionId → Consultar estado de transacción
 * - GET /api/payments/history → Historial de pagos del usuario
 *
 * Features:
 * - Validación pre-vuelos: Verificar que los datos requeridos estén presentes
 * - Formateo de cantidades en COP antes de enviar al backend
 * - Manejo de respuestas con estados: pending, succeeded, failed
 * - Integración con modo mock (VITE_USAR_MOCK) para desarrollo sin backend
 *
 * Flujo de pago típico:
 * 1. Usuario hace clic en "Confirmar y Pagar (Sandbox)" en ModalConfirmacionPago
 * 2. Componente llama a servicioPasarelaPago.checkout(datosPago)
 * 3. Se envía POST /api/payments/checkout con los datos del artículo reservado
 * 4. Backend responde con { transactionId, estado, urlSandbox }
 * 5. Frontend muestra estado de éxito/error según la respuesta
 */

import axios from "axios";
import { servicioClienteApi } from "./servicioClienteApi";

/** Base URL heredada del servicioClienteApi principal */
const API_BASE = servicioClienteApi.baseURL;

/**
 * Crear sesión de pago en sandbox (HU-06)
 * @param {object} datosPago - Datos del proceso de pago
 * @param {string} datosPago.itemId - Identificador del artículo reservado
 * @param {number} datosPago.horas - Cantidad de horas reservadas
 * @param {number} datosPago.subtotal - Subtotal del alquiler (COP)
 * @param {number} datosPago.retencion - Retención comisión UniTrade (COP)
 * @param {number} datosPago.total - Total a pagar por el arrendatario (COP)
 * @param {string} datosPago.moneda - Código monetario (ej: "COP")
 * @param {string} datosPago.usuarioId - ID del usuario que realiza el pago
 * @returns {Promise<object>} Respuesta del backend con estado de transacción
 */
export const procesarCheckout = async (datosPago) => {
  /** Validación de datos requeridos antes de enviar al backend */
  if (!datosPago?.itemId || !datosPago?.total) {
    throw new Error("Datos de pago incompletos: itemId y total son obligatorios");
  }

  /** Modo mock: simular respuesta exitosa sin llamar al backend real */
  if (import.meta.env.VITE_USAR_MOCK === "true") {
    /** Simulación de respuesta exitosa en modo desarrollo */
    return {
      success: true,
      transactionId: `mock-tx-${Date.now()}`,
      estado: "confirmada",
      mensaje: "Pago procesado exitosamente en modo simulador",
      urlSandbox: null,
    };
  }

  /** Producción: Llamada real al endpoint POST /api/payments/checkout */
  try {
    const respuesta = await servicioClienteApi.post("/payments/checkout", datosPago);
    return respuesta.data;
  } catch (error) {
    /** Manejo de errores específicos de la pasarela */
    const mensajeError =
      error.response?.data?.message || error.message || "Error desconocido en la pasarela";
    throw new Error(`Error en checkout de pago: ${mensajeError}`);
  }
};

/**
 * Consultar estado de una transacción por ID
 * @param {string} transactionId - Identificador único de la transacción
 * @returns {Promise<object>} Estado actual de la transacción
 */
export const consultarEstadoTransaccion = async (transactionId) => {
  if (!transactionId) {
    throw new Error("ID de transacción es obligatorio");
  }

  /** Modo mock */
  if (import.meta.env.VITE_USAR_MOCK === "true") {
    return {
      success: true,
      estado: "confirmada",
      fecha: new Date().toISOString(),
    };
  }

  /** Producción */
  try {
    const respuesta = await servicioClienteApi.get(`/payments/status/${transactionId}`);
    return respuesta.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al consultar estado de transacción"
    );
  }
};

/**
 * Obtener historial de pagos del usuario
 * @returns {Promise<Array>} Array de objetos de historial de pagos
 */
export const obtenerHistorialPagos = async () => {
  /** Modo mock */
  if (import.meta.env.VITE_USAR_MOCK === "true") {
    return [
      {
        id: "tx-001",
        fecha: "2024-01-15",
        monto: 54000,
        estado: "exitosa",
        concepto: "Reserva - Mesa de estudio",
      },
    ];
  }

  /** Producción */
  try {
    const respuesta = await servicioClienteApi.get("/payments/history");
    return respuesta.data || [];
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al obtener historial de pagos"
    );
  }
};

export default { procesarCheckout, consultarEstadoTransaccion, obtenerHistorialPagos };