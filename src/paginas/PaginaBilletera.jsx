/**
 * @file PaginaBilletera.jsx
 * Página principal de la Billetera Virtual de UniTrade (HU-10).
 * Integra: TarjetasBalance, HistorialTransacciones, FormularioRetiroModal, ModalRecargaSaldo.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import TarjetasBalance from "../componentes/billetera/TarjetasBalance";
import HistorialTransacciones from "../componentes/billetera/HistorialTransacciones";
import FormularioRetiroModal from "../componentes/billetera/FormularioRetiroModal";
import ModalRecargaSaldo from "../componentes/billetera/ModalRecargaSaldo";
import { obtenerBalance, obtenerHistorialTransacciones, solicitarRetiro, agregarIngreso } from "../servicios/servicioBilletera";
import IndicadorCarga from "../componentes/comunes/IndicadorCarga";

export const PaginaBilletera = () => {
  const navigate = useNavigate();
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [totalGanado, setTotalGanado] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mostrarModalRecarga, setMostrarModalRecarga] = useState(false);
  const [error, setError] = useState("");

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [balance, transacciones] = await Promise.all([
        obtenerBalance(),
        obtenerHistorialTransacciones(),
      ]);
      setSaldoDisponible(balance.saldoDisponible || 0);
      setSaldoPendiente(balance.retirosProceso ? balance.retirosProceso * 10000 : 0);
      setTotalGanado(balance.totalGanado || 0);
      setHistorial(transacciones || []);
    } catch (err) {
      setError("Error al cargar los datos de la billetera");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const manejarSolicitarRetiro = async (datosRetiro) => {
    setLoading(true);
    setError("");
    try {
      const resultado = await solicitarRetiro(datosRetiro);
      if (resultado.success) {
        await cargarDatos();
        setModalAbierto(false);
      }
    } catch (err) {
      setError(err.message || "Error al procesar el retiro");
    } finally {
      setLoading(false);
    }
  };

  const manejarRecarga = async (datosRecarga) => {
    const { monto, medioPago } = datosRecarga;
    if (!monto || monto <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await agregarIngreso(`Recarga vía ${medioPago}`, monto);
      await cargarDatos();
      setMostrarModalRecarga(false);
    } catch (err) {
      setError(err.message || "Error al procesar la recarga");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center">
        <div className="text-center">
          <IndicadorCarga texto="Cargando billetera..." tamaño="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-white">
      <NavegacionLateral onLogout={() => {}} onProfileClick={() => {}} />

      <main className="max-w-7xl mx-auto transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6 px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-medium text-sm"
        >
          ← Volver al Panel
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Billetera Virtual
          </h1>
          <p className="text-gray-300 mt-1">
            Administra tus ganancias de alquileres universitarios
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
            {error}
          </div>
        )}

        <TarjetasBalance
          saldoDisponible={saldoDisponible}
          saldoPendiente={saldoPendiente}
          totalGanado={totalGanado}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <HistorialTransacciones transacciones={historial} />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <button
              onClick={() => setModalAbierto(true)}
              disabled={saldoDisponible <= 0}
              className="w-full btn-primary disabled:opacity-50"
            >
              {saldoDisponible <= 0 ? "Saldo insuficiente para retiro" : "Solicitar Retiro"}
            </button>

            <button
              onClick={() => setMostrarModalRecarga(true)}
              className="w-full btn-primary bg-green-600 hover:bg-green-700"
            >
              Recargar Saldo
            </button>
          </div>
        </div>

        <FormularioRetiroModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          saldoDisponible={saldoDisponible}
          onSuccess={manejarSolicitarRetiro}
        />

        <ModalRecargaSaldo
          isOpen={mostrarModalRecarga}
          onClose={() => setMostrarModalRecarga(false)}
          onConfirm={manejarRecarga}
        />
      </main>
    </div>
  );
};

export default PaginaBilletera;