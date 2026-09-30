/**
 * @file TarjetaIndicador.jsx
 * Componente tarjeta pequeña para mostrar indicadores financieros clave
 * (saldo, total ganado, retiros procesados) en la vista de billetera.
 * Utiliza diseño grid responsive que se adapta de 1 a 3 columnas.
 */

import React from "react";

/**
 * Componente TarjetaIndicador - Card con indicador financiero
 * - Recibe: titulo (label), valor (number o string),Color de acento opcional, siMostrarFlecha
 * - Muestra el label arriba y el valor principal grande en el centro
 * - styling con sombras sutiles y efectos hover para retroalimentación visual
 * - En producción estos valores vendrían del ContextoBilletera o API de wallet
 */
export const TarjetaIndicador = ({
  titulo,
  valor,
  claseColor = "text-gray-600",
  mostarFlecha = false,
}) => {
  /** Formatea el valor monetario con separador de miles y 2 decimales */
  const valorFormateado = React.useMemo(
    () => new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, style: "currency", currency: "COP" }).format(
      typeof valor === "number" ? valor : 0
    ),
    [valor]
  );

  return (
    <div
      className="
        bg-white dark:bg-gray-800
        rounded-lg
        p-5
        shadow-sm
        hover:shadow-md
        transition-shadow
        duration-200
        border-y-2
        border-blue-500
      "
    >
      <div className="flex flex-col gap-2">
        {/* Label/título del indicador - más pequeño */}
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {titulo}
        </p>

        {/* Valor principal - grande y destacado */}
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${claseColor}`}>
            {valorFormateado}
          </span>

          {mostarFlecha && (
            <svg
              className="w-4 h-4 text-gray-300 dark:text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};