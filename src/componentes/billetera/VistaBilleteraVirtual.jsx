/**
 * @file VistaBilleteraVirtual.jsx
 * Panel principal de la Billetera Virtual de UniTrade (Historia de Usuario HU-10).
 */

import React, { useState, useEffect } from "react";
import { TarjetaIndicador } from "../comunes/TarjetaIndicador";
import { useApi } from "../../hooks/useApi";
import FormularioRetiroFondos from "./FormularioRetiroFondos";
import HistorialTransacciones from "./HistorialTransacciones";

const VistaBilleteraVirtual = () => {
  const { fetchApi, execute } = useApi("/api/wallet/balance");
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [totalGanado, setTotalGanado] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [retirosProceso, setRetirosProceso] = useState(0);

  useEffect(() => {
    if (import.meta.env.VITE_USAR_MOCK === "true") {
      setSaldoDisponible(125000);
      setTotalGanado(450000);
      setRetirosProceso(2);
      setHistorial([
        { id: "tx-001", monto: 50000, fecha: "2024-01-15", estado: "Transferido", concepto: "Alquiler - Mesa de estudio" },
        { id: "tx-002", monto: 30000, fecha: "2024-01-10", estado: "Procesado", concepto: "Alquiler - Silla ergonómica" },
      ]);
    } else {
      const cargarDatos = async () => {
        try {
          const result = await fetchApi();
          setSaldoDisponible(result?.saldoDisponible || 0);
          setTotalGanado(result?.totalGanado || 0);
          setHistorial(result?.historial || []);
          setRetirosProceso(result?.retirosProceso || 0);
        } catch (err) {
          console.error("Error al cargar datos de la wallet:", err);
          setHistorial([]);
        }
      };
      cargarDatos();
    }
  }, [fetchApi]);

  const manejarSolicitarRetiro = async (datosRetiro) => {
    setRetirosProceso((prev) => prev + 1);
    try {
      await execute({
        metodo: "POST",
        endpoint: "/api/wallet/withdraw",
        datos: {
          entidadFinanciera: datosRetiro.entidad,
          numeroCuenta: datosRetiro.numeroCuenta,
          monto: datosRetiro.monto,
          moneda: "COP",
        },
      });
      setTimeout(() => {
        setRetirosProceso((prev) => Math.max(0, prev - 1));
      }, 2000);
    } catch (err) {
      setTimeout(() => {
        setRetirosProceso((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
  };

  const formatearCOP = (numero) =>
    numero.toLocaleString("es-CO", { minimumFractionDigits: 2, style: "currency", currency: "COP" });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Billetera Virtual
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Administra tus ganancias de alquileres universitarios
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <TarjetaIndicador titulo="Saldo Disponible" valor={saldoDisponible} claseColor="text-green-600" mostarFlecha={false} />
          <TarjetaIndicador titulo="Total Ganado" valor={totalGanado} claseColor="text-blue-600" mostarFlecha={false} />
          <TarjetaIndicador titulo="Retiros en Proceso" valor={retirosProceso} claseColor="text-yellow-600" mostarFlecha={true} />
        </div>

        <FormularioRetiroFondos onSolicitarRetiro={manejarSolicitarRetiro} />
        <HistorialTransacciones historial={historial} />
      </div>
    </div>
  );
};

export default VistaBilleteraVirtual;