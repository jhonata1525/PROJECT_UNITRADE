/**
 * @file ContextoBilletera.jsx
 * Contexto global para gestión de la billetera virtual.
 *
 * Provee estado global y funciones para:
 * - Saldo disponible y total ganado por alquileres
 * - Historial de transacciones recibidas
 * - Solicitudes de retiro de fondos
 * - Estados de loading/error/success compartidos
 *
 * Endpoints consumidos:
 * - GET /api/wallet/balance → saldoDisponible, totalGanado
 * - GET /api/wallet/historial → historialTransacciones
 * - POST /api/wallet/withdraw → solicitarRetiro
 *
 * Modo mock: Si VITE_USAR_MOCK=true, los valores iniciales vienen definidos
 * en los propios servicios (servicioBilletera.js) en lugar de llamar al backend.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { servicioBilletera } from "../servicios/servicioBilletera";

const ContextoBilletera = createContext({
  saldoDisponible: 0,
  totalGanado: 0,
  retirosProceso: 0,
  historialTransacciones: [],
  actualizarSaldo: () => {},
  actualizarHistorial: () => {},
  solicitarRetiro: async () => {},
  loading: false,
});

export const ProveedorBilletera = ({ children }) => {
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [totalGanado, setTotalGanado] = useState(0);
  const [retirosProceso, setRetirosProceso] = useState(0);
  const [historialTransacciones, setHistorialTransacciones] = useState([]);
  const [loading, setLoading] = useState(false);

  const actualizarSaldo = (nuevoSaldo) => {
    setSaldoDisponible(nuevoSaldo);
  };

  const actualizarHistorial = (nuevaTransaccion) => {
    setHistorialTransacciones((prev) => [nuevaTransaccion, ...prev]);
  };

  const solicitarRetiro = async (datos) => {
    setLoading(true);
    try {
      const resultado = await servicioBilletera.solicitarRetiro(datos);
      return resultado;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [balance, historial] = await Promise.all([
          servicioBilletera.obtenerBalance(),
          servicioBilletera.obtenerHistorial(),
        ]);
        setSaldoDisponible(balance.saldoDisponible || 0);
        setTotalGanado(balance.totalGanado || 0);
        setHistorialTransacciones(historial || []);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  return (
    <ContextoBilletera.Provider
      value={{
        saldoDisponible,
        totalGanado,
        retirosProceso,
        historialTransacciones,
        actualizarSaldo,
        actualizarHistorial,
        solicitarRetiro,
        loading,
      }}
    >
      {children}
    </ContextoBilletera.Provider>
  );
};

export const useBilletera = () => useContext(ContextoBilletera);

export default ContextoBilletera;