/**
 * @file AlertaToast.jsx
 * Componente toast/alerta para mostrar mensajes temporales de éxito o error.
 * Se auto-oculta después de un tiempo determinado.
 * Accesible con role="alert" y aria-live="polite" para lectores de pantalla.
 */

import React, { useState, useEffect } from "react";

/**
 * AlertaToast - Componente de mensaje temporario
 * Props:
 * - tipo: "éxito" | "error" | "advertencia" define el estilo visual
 * - mensaje: string el texto a mostrar al usuario
 * - duracion: número milisegundos antes de auto-ocultarse (default: 5000)
 *
 * Características de accesibilidad:
 * - role="alert" notifica automáticamente a lectores de pantalla
 * - aria-live="polite" para anuncios no interruptivos
 * - focus trapping no necesario ya que es efímero, pero se mantiene outline visible
 *
 * Casos de uso en la aplicación:
 * - Después de un retiro exitoso: "Retiro de $50.000 procesado correctamente"
 * - Si falla la transacción: "Saldo insuficiente para el retiro solicitado"
 * - Confirmación de pago: "Pago autorizado en sandbox UniTrade"
 *
 * Flujo de funcionamiento:
 * 1. Componente se monta con el mensaje y tipo indicados
 * 2. useEffect inicia un timeout para auto-cerrar
 * 3. El padre controla cuándo mostrar el toast mediante el prop 'mostrar'
 * 4. Al expirar el tiempo, el toast se oculta y el estado se resetea
 */
const AlertaToast = ({ tipo, mensaje, duracion = 5000 }) => {
  /** Controla si el toast es visible actualmente */
  const [mostrar, setMostrar] = useState(false);

  /** Al montar el componente, iniciar el auto-cierre después de 'duracion' ms */
  useEffect(() => {
    const timer = setTimeout(() => {
      setMostrar(false);
    }, duracion);

    // Limpiar timeout al desmontar el componente
    return () => clearTimeout(timer);
  }, [mensaje, tipo, duracion, setMostrar]);

  /** Clasetas CSS según el tipo de mensaje */
  const clasesTipo = {
    éxito: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    advertencia: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300",
  }[tipo] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 transform -x-1/2 ${clasesTipo} px-6 py-3 rounded-full shadow-xl max-w-md z-50 opacity-0 transition-opacity duration-500`}
      onClick={() => setMostrar(false)}
      style={{ visibility: mostrar ? "visible" : "hidden" }}
    >
      <div className="flex items-center gap-3">
        {/* Ícono según tipo - usando caracteres Unicode simples */}
        <span className="text-lg">
          {tipo === "éxito" ? "✓" : tipo === "error" ? "✗" : "!"}
        </span>
        <span className="text-sm font-medium">{mensaje}</span>
      </div>
    </div>
  );
};

export default AlertaToast;