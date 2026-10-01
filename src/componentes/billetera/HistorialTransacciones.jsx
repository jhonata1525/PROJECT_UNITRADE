import React from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * @file HistorialTransacciones.jsx
 * Tabla/Lista estilizada con Tailwind para mostrar fecha, tipo (Ingreso/Retiro),
 * monto y estado (Completado/Pendiente).
 */

const HistorialTransacciones = ({ transacciones = [] }) => {
  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case "COMPLETADO":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completado
          </span>
        );
      case "PENDIENTE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3.5 h-3.5" /> En Proceso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="w-3.5 h-3.5" /> Fallido
          </span>
        );
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (transacciones.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Historial de Transacciones
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Últimos movimientos de ingresos y solicitudes de retiro
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-center">No hay transacciones registradas</p>
          <p className="text-xs text-center mt-1">
            Tus ingresos por alquileres y retiros aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Historial de Transacciones
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Últimos movimientos de ingresos y solicitudes de retiro
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-600">
            <tr>
              <th scope="col" className="px-6 py-3">Tipo / Concepto</th>
              <th scope="col" className="px-6 py-3">Fecha</th>
              <th scope="col" className="px-6 py-3">Destino / Origen</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {transacciones.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      item.tipo === "INGRESO"
                        ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {item.tipo === "INGRESO" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{item.concepto}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {formatearFecha(item.fecha)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                  {item.destino}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{renderBadgeEstado(item.estado)}</td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                    item.tipo === "INGRESO"
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {item.tipo === "INGRESO" ? "+" : "-"}
                  {new Intl.NumberFormat("es-CO").format(item.monto)} COP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialTransacciones;