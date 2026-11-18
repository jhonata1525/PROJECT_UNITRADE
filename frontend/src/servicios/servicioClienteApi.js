/**
 * @file servicioClienteApi.js
 * Configuración del cliente Axist para peticiones HTTP al backend de UniTrade.
 *
 * Este módulo configura la instancia de Axios con la base URL desde las variables
 * de entorno y los intercepcores necesarios para adjuntar automáticamente el token
 * JWT en el header de autorización.
 *
 * Features:
 * - Base URL: configurable via VITE_API_BASE_URL (por defecto `/api`, que Vite
 *   redirige al backend en http://localhost:8081 con el proxy de vite.config.js)
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

/**
 * Crear instancia de Axios con configuración base
 * - baseURL se toma de las variables de entorno de Vite
 * - Timeout de 30 segundos para respuestas lentas
 * - Headers por defecto con Content-Type JSON
 */
export const servicioClienteApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor de solicitud: registra la hora de inicio y, si la respuesta
 * tarda más de 4 segundos (arranque en frío en Render), dispara un evento
 * global `unitrade:solicitud-lenta` para que la UI muestre un mensaje claro
 * sin bloquear la aplicación.
 */
const TIEMPO_LARGO_MS = 4000;
servicioClienteApi.interceptors.request.use((config) => {
  config.metadata = config.metadata || {};
  config.metadata.inicio = Date.now();
  return config;
});

servicioClienteApi.interceptors.response.use(
  (response) => {
    const inicio = response.config?.metadata?.inicio;
    if (inicio && Date.now() - inicio > TIEMPO_LARGO_MS) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("unitrade:solicitud-lenta", {
            detail: { url: response.config?.url, ms: Date.now() - inicio },
          })
        );
      }
      console.warn(
        `[UniTrade] Solicitud lenta (>4s): ${response.config?.url} (${Date.now() - inicio}ms)`
      );
    }
    return response;
  },
  (error) => {
    const inicio = error.config?.metadata?.inicio;
    if (inicio && Date.now() - inicio > TIEMPO_LARGO_MS) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("unitrade:solicitud-lenta", {
            detail: { url: error.config?.url, ms: Date.now() - inicio },
          })
        );
      }
      console.warn(
        `[UniTrade] Solicitud lenta fallida (>4s): ${error.config?.url} (${Date.now() - inicio}ms)`
      );
    }
    return Promise.reject(error);
  }
);

/**
 * Interceptor de petición: Adjunta el token JWT automáticamente
 * - Obtiene el token de localStorage directamente (no se pueden usar hooks aquí)
 * - Si hay un token, lo agrega en el header Authorization con formato Bearer
 * - Esto ocurre en cada petición automáticamente sin necesidad de agregar manualmente
 */
servicioClienteApi.interceptors.request.use(
  async (config) => {
    /** Obtener el token de localStorage directamente */
    const token = localStorage.getItem("uniTrade_token");

    /** Si hay token, adjúntelo al header de autorización */
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem("uniTrade_token");
      localStorage.removeItem("usuario_unitrade");

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
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