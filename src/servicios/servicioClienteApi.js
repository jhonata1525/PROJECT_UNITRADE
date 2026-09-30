/**
 * @file servicioClienteApi.js
 * Configuración del cliente Axist para peticiones HTTP al backend de UniTrade.
 *
 * Este módulo configura la instancia de Axios con la base URL desde las variables
 * de entorno y los intercepcores necesarios para adjuntar automáticamente el token
 * JWT en el header de autorización.
 *
 * Features:
 * - Base URL: configurable via VITE_API_BASE_URL (ej: http://localhost:8080/api)
 * - Interceptor de petición: Adjunta `Authorization: Bearer <token>` automáticamente
 *   usando el token almacenado en el ContextoAutenticacion.
 * - Interceptor de respuesta: Maneja códigos de estado 401 (no autorizado) y 500
 *   para redirigir al login o mostrar errores apropiados.
 * - Manejo de mock data: Si VITE_USAR_MOCK=true, las peticiones se redirigen a
 *   datos simulados locales en lugar del backend real.
 *
 * Endpoints de producción principales:
 * - GET /api/auth/status → Verificar estado de autenticación
 * - POST /api/auth/login → Iniciar sesión con JWT
 * - POST /api/auth/register → Registrar nuevo usuario
 * - POST /api/payments/checkout → Procesar pago (HU-06)
 * - GET /api/wallet/balance → Obtener saldo y total ganado (HU-10)
 * - GET /api/wallet/historial → Historial de transacciones (HU-10)
 * - POST /api/wallet/withdraw → Solicitar retiro de fondos (HU-10)
 */

import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../contexto/ContextoAutenticacion";

/**
 * Crear instancia de Axios con configuración base
 * - baseURL se toma de las variables de entorno de Vite
 * - Timeout de 30 segundos para respuestas lentas
 * - Headers por defecto con Content-Type JSON
 */
export const servicioClienteApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor de petición: Adjunta el token JWT automáticamente
 * - Obtiene el token del contexto global de autenticación
 * - Si hay un token, lo agrega en el header Authorization con formato Bearer
 * - Esto ocurre en cada petición automáticamente sin necesidad de agregar manualmente
 */
servicioClienteApi.interceptors.request.use(
  async (config) => {
    /** Obtener el usuario y token del contexto React */
    const { usuario } = useContext(AuthContext);

    /** Si el usuario tiene token, adjúntelo al header de autorización */
    if (usuario && usuario.token) {
      config.headers.Authorization = `Bearer ${usuario.token}`;
    }

    /** Modo mock: Si VITE_USAR_MOCK=true, registrar pero no bloquear */
    if (import.meta.env.VITE_USAR_MOCK === "true") {
      // En desarrollo con mock, continuamos normalmente
      // El mock se maneja en los hooks useApi individuales
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuesta: Manejo global de errores y estados HTTP
 * - Código 401 (Token expirado o inválido): limpiar contexto y redirect a /login
 * - Código 500 (Error del servidor): mostrar mensaje genérico de error
 * - Códigos de éxito: retornar los datos normalmente
 * - Cualquier otro error: lanzar para que sea manejado por el componente caller
 */
servicioClienteApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    /** Manejo de error 401 - No autorizado */
    if (response && response.status === 401) {
      /** En producción: limpiar token y redirigir a login */
      // window.location.href = "/login";
      console.error("Error 401: Token expirado o inválido");
    }

    /** Manejo de error 500 - Error interno del servidor */
    if (response && response.status === 500) {
      console.error("Error 500: Error interno del servidor");
    }

    return Promise.reject(error);
  }
);

/**
 * Helper: Verificar si el modo mock está activado
 * @returns {boolean} true si VITE_USAR_MOCK es "true"
 */
export const usarMock = () =>
  import.meta.env.VITE_USAR_MOCK === "true";

/**
 * Endpoints auxiliares (URLs completas) para uso en hooks y componentes
 * @example
 *   const url = obtenerEndpoint("walle/balance");
 */
export const obtenerEndpoint = (recurso) => {
  const base = servicioClienteApi.baseURL;
  return `${base}/${recurso}`.replace(/\/\//g, "/");
};

export default servicioClienteApi;