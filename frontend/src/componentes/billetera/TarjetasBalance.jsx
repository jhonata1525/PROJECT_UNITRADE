import React from "react";

/**
 * @file TarjetasBalance.jsx
 * Tarjetas principales de la billetera:
 * - Saldo disponible
 * - Saldo pendiente (retiros en proceso)
 * - Ganancias totales
 * - Total retirado
 */

export const TarjetasBalance = ({
  saldoDisponible = 0,
  saldoPendiente = 0,
  totalGanado = 0,
  totalRetirado = 0,
}) => {
  const formatearCOP = (valor) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);

  const tarjetas = [
    {
      titulo: "Saldo Disponible",
      valor: formatearCOP(saldoDisponible),
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorIcono: "text-green-500 bg-green-100 dark:bg-green-900/30",
      colorTexto: "text-green-600 dark:text-green-400",
    },
    {
      titulo: "Saldo Pendiente",
      valor: formatearCOP(saldoPendiente),
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorIcono: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
      colorTexto: "text-yellow-600 dark:text-yellow-400",
    },
    {
      titulo: "Ganancias Totales",
      valor: formatearCOP(totalGanado),
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      colorIcono: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
      colorTexto: "text-blue-600 dark:text-blue-400",
    },
    {
      titulo: "Total Retirado",
      valor: formatearCOP(totalRetirado),
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      colorIcono: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
      colorTexto: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {tarjetas.map((tarjeta) => (
        <div
          key={tarjeta.titulo}
          className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {tarjeta.titulo}
              </p>
              <p className={`text-xl sm:text-2xl font-bold break-words ${tarjeta.colorTexto}`}>
                {tarjeta.valor}
              </p>
            </div>
            <div className={`p-3 rounded-lg flex-shrink-0 ${tarjeta.colorIcono}`}>
              {tarjeta.icono}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TarjetasBalance;
