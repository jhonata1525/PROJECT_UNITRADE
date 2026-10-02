/**
 * @file AlertaToast.jsx
 * Componente toast/alerta para mostrar mensajes temporales de éxito o error.
 * Se auto-oculta después de un tiempo determinado.
 * Accesible con role="alert" y aria-live="polite" para lectores de pantalla.
 */

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const AlertaToast = ({ tipo, mensaje, duracion = 5000, onClose }) => {
  const [mostrar, setMostrar] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setMostrar(true);
    setExiting(false);

    timeoutRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setMostrar(false);
        onClose?.();
      }, 300);
    }, duracion);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [mensaje, tipo, duracion, onClose]);

  const clasesTipo = {
    éxito: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    advertencia: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  }[tipo] || "bg-gray-500/10 border-gray-500/30 text-gray-400";

  const iconos = {
    éxito: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    advertencia: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  if (!mostrar) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-4 right-4 ${clasesTipo} border px-4 py-3 rounded-xl shadow-2xl max-w-md z-50 flex items-start gap-3 animate-slide-up ${exiting ? "animate-fade-out" : ""}`}
      onClick={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setExiting(true);
        setTimeout(() => {
          setMostrar(false);
          onClose?.();
        }, 300);
      }}
    >
      <div className="flex-shrink-0 mt-0.5">{iconos[tipo] || iconos.error}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{mensaje}</p>
      </div>
      <button
        onClick={() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setExiting(true);
          setTimeout(() => {
            setMostrar(false);
            onClose?.();
          }, 300);
        }}
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AlertaToast;