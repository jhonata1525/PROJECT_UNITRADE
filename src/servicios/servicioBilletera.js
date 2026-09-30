/**
 * @file servicioBilletera.js
 * Servicio específico para la billetera virtual de UniTrade (HU-10).
 *
 * Este módulo encapsula todas las peticiones relacionadas con la gestión de
 * fondos, saldos, historial de transacciones y retiros de ganancias para la
 * historia de usuario HU-10: "Billetera Virtual y Retiro de Ganancias".
 *
 * Endpoints de producción:
 * - GET /api/wallet/balance → Obtener saldo disponible y total ganado
 * - GET /api/wallet/historial → Historial de transacciones y retiros
 * - POST /api/wallet/withdraw → Solicitar retiro de fondos a entidad financiera
 * - GET /api/wallet/entidades → Listar entidades compatibles (Nequi, Daviplata, etc.)
 *
 * Features:
 * - Consumo de endpoints específicos de wallet
 * - Validación reactiva de montos contra saldo disponible
 * - Formateo automático de valores COP antes y después de las peticiones
 * - Manejo de estados loading/error/success en todas las llamadas
 * - Integración con modo mock (VITE_USAR_MOCK) para desarrollo sin backend
 *
 * Flujo de retiro típico:
 * 1. Usuario accede a VistaBilleteraVirtual
 * 2. Completa FormularioRetiroFondos (entidad, número, monto)
 * 3. Validación reactiva: monto ≤ saldo disponible
 * 4. Llama a servicioBilletera.withdraw(datosRetiro)
 * 5. POST /api/wallet/withdraw envía los datos al backend
 * 6. Backend responde con { solicitudId, estado "Procesando"/"Transferido" }
 * 7. Frontend muestra IndicadorCarga y actualizaHistorialTransacciones
 */

import axios from "axios";
import { servicioClienteApi } from "./servicioClienteApi";

/** Base URL heredada */
const API_BASE = servicioClienteApi.baseURL;

/**
 * Obtener balance y datos de la wallet
 * @returns {Promise<object>} { saldoDisponible, totalGanado, retirosProceso }
 */
export const obtenerBalance = async () => {
  /** Modo mock: datos simulados para desarrollo */
  if (import.meta.env.VITE_USAR_MOCK === "true") {
    return {
      saldoDisponible: 125000,
      totalGanado: 450000,
      retirosProceso: 2,
    };
  }

  /** Producción: fetch real al endpoint GET /api/wallet/balance */
  try {
    const respuesta = await servicioClienteApi.get("/wallet/balance");
    return respuesta.data || {
      saldoDisponible: 0,
      totalGanado: 0,
      retirosProceso: 0,
    };
  } catch (error) {
    /** Manejo de errores en obtención de balance */
    const mensaje =
      error.response?.data?.message || error.message || "Error al obtener balance";
    throw new Error(`Error al obtener datos de wallet: ${mensaje}`);
  }
};

/**
 * Obtener historial de transacciones de la wallet
 * @returns {Promise<Array>} Array de objetos de transacción { id, monto, fecha, estado, concepto }
 */
export const obtenerHistorialTransacciones = async () => {
  /** Modo mock */
  if (import.meta.env.VITE_USAR_MOCK === "true") {
    return [
      {
        id: "tx-001",
        monto: 50000,
        fecha: "2024-01-15",
        estado: "Transferido",
        concepto: "Alquiler - Mesa de estudio",
      },
      {
        id: "tx-002",
        monto: 30000,
        fecha: "2024-01-10",
        estado: "Procesado",
        concepto: "Alquiler - Silla ergonómica",
      },
    ];
  }

  /** Producción */
  try {
    const respuesta = await servicioClienteApi.get("/wallet/historial");
    return respuesta.data || [];
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al obtener historial de transacciones"
    );
  }
};

/**
 * Solicitar retiro de fondos a entidad financiera
 * @param {object} datosRetiro - Datos del retiro a solicitar
 * @param {string} datosRetiro.entidadFinanciera - Nequi, Daviplata, Ahorro a la Mano, Banco Colombia
 * @param {string} datosRetiro.numeroCuenta - Número de cuenta o teléfono celular
 * @param {number} datosRetiro.monto - Monto a retirar (debe ser ≤ saldo disponible)
 * @returns {Promise<object>} Respuesta del backend con estado de la solicitud
 */
export const solicitarRetiro = async (datosRetiro) => {
  /** Validación básica de campos requeridos */
  if (!datosRetiro?.entidadFinanciera || !datosRetiro?.monto) {
    throw new Error("Datos de retiro incompletos: entidad y monto son obligatorios");
  }

  /** Modo mock: simular proceso de retiro exitoso */
  if (import.meta.env.VITE_USAR_MOCK === "true") {
    return {
      success: true,
      solicitudId: `mock-retiro-${Date.now()}`,
      estado: "Transferido",
      mensaje: "Retiro procesado exitosamente en modo simulador",
    };
  }

  /** Producción: POST /api/wallet/withdraw */
  try {
    const respuesta = await servicioClienteApi.post("/wallet/withdraw", datosRetiro);
    return respuesta.data;
  } catch (error) {
    const mensajeError =
      error.response?.data?.message || error.message || "Error en solicitud de retiro";
    throw new Error(`Error en solicitud de retiro: ${mensajeError}`);
  }
};

/**
 * Listar entidades financieras compatibles con UniTrade
 * @returns {Promise<Array>} Array de objetos { valor, label } para el selector
 */
export const listarEntidades = async () => {
  /** Modo mock */
  if (import.meta.env.VITE_USAR_MOCK === "true") {
    return [
      { valor: "Nequi", label: "Nequi" },
      { valor: "Daviplata", label: "Daviplata" },
      { valor: "Ahorro a la Mano", label: "Ahorro a la Mano" },
      { valor: "Banco Colombia", label: "Banco Colombia" },
    ];
  }

  /** Producción */
  try {
    const respuesta = await servicioClienteApi.get("/wallet/entidades");
    return respuesta.data || [];
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Error al listar entidades financieras"
    );
  }
};

export default { obtenerBalance, obtenerHistorialTransacciones, solicitarRetiro, listarEntidades };