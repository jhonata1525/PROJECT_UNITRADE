/**
 * @file HistorialTransacciones.jsx
 * Tabla/Lista estilizada con glassmorphism para mostrar fecha, tipo (Ingreso/Retiro),
 * monto y estado (Completado/Pendiente).
 */

import React from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const ESTADOS_CONFIG = {
  COMPLETADO: {
    label: "Completado",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-400",
  },
  PENDIENTE: {
    label: "En Proceso",
    icon: Clock,
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-400",
  },
  FALLIDO: {
    label: "Fallido",
    icon: AlertCircle,
    bg: "bg-red-500/10 border-red-500/30",
    text: "text-red-400",
  },
};

const TIPOS_CONFIG = {
  INGRESO: {
    icon: ArrowDownLeft,
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    montoColor: "text-emerald-400",
    prefix: "+",
  },
  RETIRO: {
    icon: ArrowUpRight,
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    montoColor: "text-gray-300",
    prefix: "-",
  },
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

const formatearCOP = (monto) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(monto);

const HistorialTransacciones = ({ transacciones = [] }) => {
  if (transacciones.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">
            Historial de Transacciones
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Últimos movimientos de ingresos y solicitudes de retiro
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
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
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-[var(--color-border)]">
        <h3 className="text-lg font-bold text-white">
          Historial de Transacciones
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Últimos movimientos de ingresos y solicitudes de retiro
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-[var(--color-canvas)] text-gray-400 border-b border-[var(--color-border)]">
            <tr>
              <th scope="col" className="px-6 py-3">Tipo / Concepto</th>
              <th scope="col" className="px-6 py-3">Fecha</th>
              <th scope="col" className="px-6 py-3">Destino / Origen</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {transacciones.map((item) => {
              const tipoConfig = TIPOS_CONFIG[item.tipo] || TIPOS_CONFIG.RETIRO;
              const Icon = tipoConfig.icon;
              const estadoConfig = ESTADOS_CONFIG[item.estado] || ESTADOS_CONFIG.FALLIDO;
              const EstadoIcon = estadoConfig.icon;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tipoConfig.bg} ${tipoConfig.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.concepto}</p>
                      <p className="text-xs text-gray-500">ID: {item.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {formatearFecha(item.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {item.destino}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                      <EstadoIcon className="w-3.5 h-3.5" />
                      {estadoConfig.label}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right font-bold ${tipoConfig.montoColor}`}
                  >
                    {tipoConfig.prefix}{formatearCOP(item.monto)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialTransacciones;