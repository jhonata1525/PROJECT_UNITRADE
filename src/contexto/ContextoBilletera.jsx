/**
 * @file ContextoBilletera.jsx
 * Contexto global opcional para la billetera virtual (HU-10).
 *
 * La página de billetera consulta el backend directamente; este contexto queda
 * disponible por si otra vista necesita compartir saldo e historial.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./ContextoAutenticacion";
import { servicioBilletera } from "../servicios/servicioBilletera";

const ContextoBilletera = createContext({
  saldoDisponible: 0,
  saldoPendiente: 0,
  totalGanado: 0,
  totalRetirado: 0,
  retirosProceso: 0,
  historialTransacciones: [],
  actualizarSaldo: () => {},
  actualizarHistorial: () => {},
  recargarDatos: async () => {},
  solicitarRetiro: async () => {},
  loading: false,
  error: "",
});

export const ProveedorBilletera = ({ children }) => {
  const { usuario } = useAuth();
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [totalGanado, setTotalGanado] = useState(0);
  const [totalRetirado, setTotalRetirado] = useState(0);
  const [retirosProceso, setRetirosProceso] = useState(0);
  const [historialTransacciones, setHistorialTransacciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actualizarSaldo = (nuevoSaldo) => {
    setSaldoDisponible(nuevoSaldo);
  };

  const actualizarHistorial = (nuevaTransaccion) => {
    setHistorialTransacciones((prev) => [nuevaTransaccion, ...prev]);
  };

  const recargarDatos = async () => {
    if (!usuario?.id) return;
    setLoading(true);
    setError("");
    try {
      const [balance, historial] = await Promise.all([
        servicioBilletera.obtenerBalance(usuario.id),
        servicioBilletera.obtenerHistorial(usuario.id),
      ]);
      setSaldoDisponible(balance?.saldoDisponible || 0);
      setSaldoPendiente(balance?.saldoPendiente || 0);
      setTotalGanado(balance?.totalGanado || 0);
      setTotalRetirado(balance?.totalRetirado || 0);
      setRetirosProceso(balance?.retirosProceso || 0);
      setHistorialTransacciones(Array.isArray(historial) ? historial : []);
    } catch (err) {
      setError(
        servicioBilletera.mensajeErrorBilletera(
          err,
          "No se pudo cargar la billetera."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const solicitarRetiro = async (datos) => {
    if (!usuario?.id) {
      throw new Error("No se pudo identificar al usuario.");
    }
    setLoading(true);
    try {
      const resultado = await servicioBilletera.solicitarRetiro(usuario.id, datos);
      await recargarDatos();
      return resultado;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    recargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  return (
    <ContextoBilletera.Provider
      value={{
        saldoDisponible,
        saldoPendiente,
        totalGanado,
        totalRetirado,
        retirosProceso,
        historialTransacciones,
        actualizarSaldo,
        actualizarHistorial,
        recargarDatos,
        solicitarRetiro,
        loading,
        error,
      }}
    >
      {children}
    </ContextoBilletera.Provider>
  );
};

export const useBilletera = () => useContext(ContextoBilletera);

export default ContextoBilletera;
