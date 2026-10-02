/**
 * @file ModalGenerico.jsx
 * Modal genérico reutilizable con soporte para varios casos de uso.
 * Maneja sus propios estados de apertura/cerrado, loading y error.
 */

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { X } from "lucide-react";

const ModalGenerico = forwardRef(({
  abierto,
  titulo,
  onCancelar,
  children,
  size = "md",
}, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => {},
    close: () => onCancelar?.(),
    setLoading,
    setError,
  }));

  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
      setLoading(false);
      setError(null);
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [abierto]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && abierto) onCancelar?.();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [abierto, onCancelar]);

  const cerrarModal = () => {
    setLoading(false);
    onCancelar?.();
  };

  if (!abierto) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titulo ? "modal-title" : undefined}
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={cerrarModal}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-scale-in`}
      >
        {(titulo || onCancelar) && (
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
            {titulo && (
              <h3 id="modal-title" className="text-xl font-bold text-white">
                {titulo}
              </h3>
            )}
            <button
              onClick={cerrarModal}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="animate-spin h-10 w-10 text-[var(--color-neon)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle className="opacity-25" cx="12" cy="12" r="10" />
                <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <p className="mt-3 text-sm text-gray-400">Procesando...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

ModalGenerico.displayName = "ModalGenerico";

export const useModal = (initialOpen = false) => {
  const [abierto, setAbierto] = useState(initialOpen);
  return { abierto, setAbierto };
};

export default ModalGenerico;