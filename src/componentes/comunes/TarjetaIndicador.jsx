/**
 * @file TarjetaIndicador.jsx
 * Componente tarjeta pequeña para mostrar indicadores financieros clave
 * (saldo, total ganado, retiros procesados) en la vista de billetera.
 * Glassmorphism styling consistente con el sistema de diseño.
 */

import React from "react";

export const TarjetaIndicador = ({
  titulo,
  valor,
  claseColor = "text-[var(--color-neon)]",
  mostarFlecha = false,
}) => {
  const valorFormateado = React.useMemo(
    () => new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, style: "currency", currency: "COP" }).format(
      typeof valor === "number" ? valor : 0
    ),
    [valor]
  );

  return (
    <div className="glass-card-hover p-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-400">
          {titulo}
        </p>

        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${claseColor}`}>
            {valorFormateado}
          </span>

          {mostarFlecha && (
            <svg
              className="w-4 h-4 text-gray-500"
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

export default TarjetaIndicador;