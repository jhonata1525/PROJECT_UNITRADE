import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { TarjetaIndicador } from '../comunes/TarjetaIndicador';

/**
 * Componente HistorialTransacciones (HU-10)
 * Muestra la lista de movimientos financieros (Ingresos por alquileres y Retiros a bancos/Nequi).
 */
const HistorialTransacciones = ({ transacciones = [] }) => {
  // Datos de prueba en caso de no recibir la lista por props
  const historialMock = transacciones.length > 0 ? transacciones : [
    {
      id: 'TRX-9821',
      tipo: 'INGRESO',
      concepto: 'Alquiler MacBook Pro 13"',
      monto: 45200,
      fecha: '2026-09-28 14:30',
      estado: 'COMPLETADO',
      destino: 'Billetera UniTrade'
    },
    {
      id: 'TRX-9810',
      tipo: 'RETIRO',
      concepto: 'Retiro a Nequi (300***1234)',
      monto: 20000,
      fecha: '2026-09-25 09:15',
      estado: 'COMPLETADO',
      destino: 'Nequi'
    },
    {
      id: 'TRX-9755',
      tipo: 'RETIRO',
      concepto: 'Retiro a Bancolombia',
      monto: 15000,
      fecha: '2026-09-29 18:00',
      estado: 'PENDIENTE',
      destino: 'Bancolombia'
    }
  ];

  // Helper para renderizar insignia de estado con Tailwind
  const renderBadgeEstado = (estado) => {
    switch (estado) {
      case 'COMPLETADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completado
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3.5 h-3.5" /> En Proceso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3.5 h-3.5" /> Fallido
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Historial de Transacciones</h3>
        <p className="text-sm text-gray-500">Últimos movimientos de ingresos y solicitudes de retiro</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs uppercase bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">Tipo / Concepto</th>
              <th scope="col" className="px-6 py-3">Fecha</th>
              <th scope="col" className="px-6 py-3">Destino / Origen</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {historialMock.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.tipo === 'INGRESO' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {item.tipo === 'INGRESO' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{item.concepto}</p>
                    <p className="text-xs text-gray-400">{item.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.fecha}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.destino}</td>
                <td className="px-6 py-4 whitespace-nowrap">{renderBadgeEstado(item.estado)}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${item.tipo === 'INGRESO' ? 'text-green-600' : 'text-gray-900'}`}>
                  {item.tipo === 'INGRESO' ? '+' : '-'}${item.monto.toLocaleString('es-CO')} COP\n                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialTransacciones;