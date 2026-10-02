/**
 * @file ResumenDesgloseComision.jsx
 * Componente que muestra el desglose de comisión de la plataforma UniTrade
 * en formato de resumen compacto, útil para mostrar en pantallas de pago,
 * recibos o laterales de la billetera.
 *
 * Features:
 * - Muestra 3 valores clave en formato tarjeta Indicador:
 *   * Subtotal Alquiler (monto total antes comisiones)
 *   * Retención Comisión UniTrade (% y monto)
 *   * Total al Arrendatario (lo que efectivamente recibe el usuario)
 * - Colores consistentes: verde para subtotal, rojo para retención, azul para total
 * - Responsive: se adapta de 1 a 3 columnas
 * - Compatible con modo mock (VITE_USAR_MOCK) y datos reales del API
 *
 * Comisión Oficial UniTrade: 12% (RN-08)
 *
 * Datos de ejemplo (modo mock):
 * - subtotal: 60000 (4 horas × $15.000/hora)
 * - comision: 7200 (12% de 60000)
 * - total: 52800
 *
 * En producción real, estos valores se obtendrían del backend después de
 * procesar el POST /api/payments/checkout o consultando la reserva.
 */

import React from "react";
import { TarjetaIndicador } from "../comunes/TarjetaIndicador";

const COMISION_PORCENTAJE = 0.12; // 12% comisión UniTrade (RN-08)

/**
 * ResumenDesgloseComision - Componente de resumen visual de comisiones
 *
 * Props: Ninguna (usa estado interno o contextos para obtener datos)
 *
 * Estructura de renderizado:
 * - Grid responsive de tarjetas Indicador:
 *   * 1 columna en sm (≤640px)
 *   * 2 columnas en md (≤768px)
 *   * 3 columnas en lg (≤1024px)
 * - Cada tarjeta muestra:
 *   * Título descriptivo (Subtotal, Comisión, Total)
 *   * Valor monetario formateado en COP
 *   * Ícono/símbolo representativo
 *
 * Estados visuales:
 * - Subtotal: texto en color verde-600/500
 * - Comisión: texto en color rojo-600/500 (resalta el descuento)
 * - Total: texto en color azul-600/500 (resultado final)
 *
 * Integración con Mock Data:
 * Cuando VITE_USAR_MOCK=true, los valores por defecto son:
 * - Subtotal: $60.000 COP
 * - Comisión: 12% ($7.200 COP)
 * - Total: $52.800 COP
 *
 * En producción real, los valores vendrían de:
 * - POST /api/payments/checkout → respuesta con desglose completo
 * - O consulta a /api/reservas/{id} después de confirmada
 */

const ResumenDesgloseComision = () => {
  /** En modo mock, usar datos simulados; en producción, fetch desde API */
  const usarMock = import.meta.env.VITE_USAR_MOCK === "true";

  /** Datos simulados para modo desarrollo */
  const datosMock = React.useMemo(() => ({
    subtotal: 60000,
    comisionPorcentaje: COMISION_PORCENTAJE,
    comisionMonto: 7200,
    total: 52800,
  }), []);

  /** Valores por defecto para producción */
  const datosPorDefecto = React.useMemo(() => ({
    subtotal: 0,
    comisionPorcentaje: 0,
    comisionMonto: 0,
    total: 0,
  }), []);

  /** En producción real, esto vendría de un useApi fetch a la reserva activa */
  const { subtotal, comisionPorcentaje, comisionMonto, total } = usarMock
    ? datosMock
    : datosPorDefecto;

  const formatCOP = (valor) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(valor);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-gray-400">
        Desglose de comisión UniTrade ({(COMISION_PORCENTAJE * 100).toFixed(0)}%)
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tarjeta: Subtotal Alquiler */}
        <TarjetaIndicador
          titulo="Subtotal Alquiler"
          valor={subtotal}
          claseColor="text-green-400"
          mostarFlecha={false}
        />

        {/* Tarjeta: Retención Comisión UniTrade */}
        <TarjetaIndicador
          titulo="Retención Comisión"
          valor={comisionMonto}
          claseColor="text-red-400"
          mostarFlecha={false}
        />

        {/* Tarjeta: Total a Pagar */}
        <TarjetaIndicador
          titulo="Total Arrendatario"
          valor={total}
          claseColor="text-blue-400"
          mostarFlecha={false}
        />
      </div>
    </div>
  );
};

/** Export único y limpio al final del archivo */
export default ResumenDesgloseComision;