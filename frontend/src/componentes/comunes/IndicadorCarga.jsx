/**
 * @file IndicadorCarga.jsx
 * Componente de indicador de carga (spinner) usado en todo el aplicativo
 * cuando se realizan peticiones async a los endpoints del backend.
 * Versión simplificada y reutilizable.
 */

import React from "react";

/**
 * IndicadorCarga - Spinner con texto asociado
 * Props:
 * - texto: string opcional que describe qué se está cargando
 * - tamaño: "sm" | "md" | "lg" para controlar el tamaño del spinner (default: "md")
 *
 * Uso típico en hooks useApi o componentes que hacen peticiones fetch:
 *   <IndicadorCarga texto="Cargando datos de la billetera" />
 *
 * En producción, este componente se muestra/oculta según el estado 'loading'
 * retornado por el hook useApi o useFetch personalizado.
 *
 * Ejemplo de integración:
 *   const { data, loading, error } = useApi('/api/wallet/balance');
 *   return loading ? <IndicadorCarga texto="Obteniendo saldo" /> : <TarjetaSaldo {...data} />;
 */

const IndicadorCarga = ({ texto = "Cargando", tamaño = "md" }) => {
  /** Tamaños disponibles: sm=12px, md=16px, lg=20px del texto asociado */
  const tamanioClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[tamaño] || "text-base";

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 border-2 border-border rounded-full border-t-2 animate-spin"></div>
      <span className={[tamanioClass, "text-gray-600", "dark:text-gray-300"]}>
        {texto}
      </span>
    </div>
  );
};

export default IndicadorCarga;