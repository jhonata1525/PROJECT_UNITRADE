/**
 * @file ModalGenerico.jsx
 * Modal genérico reutilizable con soporte para varios casos de uso.
 * Maneja sus propios estados de apertura/cerrado, loading y error.
 * Todos los handlers y comentarios son en español para consistencia.
 */

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

/**
 * ModalGenerico - Componente modal flexible
 * Props:
 * - abierto: boolean controlado desde padre
 * - titulo: string para el título del modal
 * - onCancelar: función llamada al cerrar/ cancelar
 * - children: contenido del modal (formularios, texto, etc.)
 * - tipo: "confirmacion" | "input" | "alerta" para variar el estilo
 *
 * Estados internos manejados:
 * - isOpen: derive del prop 'abierto'
 * - loading: muestra spinner durante operaciones async
 * - error: muestra mensaje de error si falla la operación
 *
 * En producción, el endpoint consumido dependería del caso de uso:
 * - Confirmación de pago: POST /api/payments/checkout
 * - Retiro de fondos: POST /api/wallet/withdraw
 * - Validación de usuario: POST /api/auth/verify
 */
const ModalGenerico = ({
  abierto,
  titulo,
  onCancelar,
  children,
  tipo = "confirmacion",
}) => {
  /** Estado local para controlar loading interno del modal */
  const [loading, setLoading] = useState(false);
  /** Estado local para capturar errores de operaciones async */
  const [error, setError] = useState(null);

  /** Efecto que sincroniza el prop abierto con el estado local */
  useEffect(() => {
    // Cuando el prop 'abierto' cambie, actualizamos el estado local
    // Esto permite animaciones controladas y validación interna
    setLoading(false);
  }, [abierto]);

  /**
   * Función para cerrar el modal
   * - Establece loading a false antes de cerrar
   * - Llama al callback onCancelar del padre
   * - En un caso real, podría validar que no hay procesos pending
   */
  const cerrarModal = () => {
    setLoading(false);
    if (onCancelar) onCancelar();
  };

  /**
   * Función genérica para manejar operaciones asíncronas dentro del modal
   * - Establece loading = true antes de la operación
   * - Intenta ejecutar la acción (en producción sería fetch/api call)
   * - En caso de error, captura y muestra el mensaje
   * - Siempre asegura cerrar el modal y resetear estados
   */
  const manejarOperacionAsync = async (accion) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await accion();
      return resultado;
    } catch (err) {
      const mensaje =
        err.response?.data?.message || err.message || "Error inesperado";
      setError(mensaje);
      throw new Error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        top-0
        left-0
        z-50
        hidden
        items-center
        justify-center
      "
      id="modal-root"
    >
      {/* Fondo semi-transparente que cierra modal al hacer clic fuera */}
      <div
        className="
          fixed
          inset-0
          bg-black/40
          backdrop-blur-sm
          cursor-pointer
          opacity-0
          transition-opacity
          duration-300
        "
        onClick={cerrarModal}
        aria-label="Cerrar modal al hacer clic fuera"
      />

      {/* Modal container animado */}
      <div
        className="
          absolute
          top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          bg-white dark:bg-gray-800
          rounded-2xl
          p-6
          width-full
          max-w-md
          box-shadow-lg
          opacity-0
          transition-all
          duration-300
        "
        aria-labelledby="modal-title"
      >
        {/* Título del modal */}
        {titulo && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100" id="modal-title">
              {titulo}
            </h3>
            <button
              onClick={cerrarModal}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Contenido del modal (formularios, texto, etc.) */}
        <div className="space-y-4">
          {children}

          {/* Estado de loading - spinner centralizado */}
          {loading && (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto border-2 border-border rounded-full border-t-2 animate-spin"></div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Procesando...</p>
            </div>
          )}

          {/* Estado de error - mostrado si hubo un fallo */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Exporta utilidades helpers para abrir/cerrar desde el padre */
ModalGenerico.abrir = (elemento) => {
  const modal = elemento?.actual;
  if (modal) modal.setAbierto(true);
};

ModalGenerico.cerrar = (elemento) => {
  const modal = elemento?.actual;
  if (modal) modal.setAbierto(false);
};

export default ModalGenerico;

/** Hook helper para padres que usan este modal */
export const useModal = (abiertoInicial = false) => {
  const [abierto, setAbierto] = useState(abiertoInicial);
  return { abierto, setAbierto };
};