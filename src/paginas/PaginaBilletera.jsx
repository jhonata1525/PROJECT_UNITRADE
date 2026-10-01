import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Encabezado } from "../componentes/comunes/Encabezado";
import TarjetasBalance from "../componentes/billetera/TarjetasBalance";
import HistorialTransacciones from "../componentes/billetera/HistorialTransacciones";
import FormularioRetiroModal from "../componentes/billetera/FormularioRetiroModal";
import { obtenerBalance, obtenerHistorialTransacciones, solicitarRetiro, agregarIngreso } from "../servicios/servicioBilletera";

/**
 * @file PaginaBilletera.jsx
 * Página principal de la Billetera Virtual de UniTrade (HU-10).
 * Integra: TarjetasBalance, HistorialTransacciones, FormularioRetiroModal y ModalRecargaSaldo.
 */

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
      console.error("Error cargando billetera:", err);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" />
            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p className="text-gray-400">Cargando billetera...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen p-6">
      <Encabezado />

      <main className="max-w-7xl mx-auto">
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
          <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-sm" role="alert">
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
              className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative overflow-hidden"
            >
              {saldoDisponible <= 0 ? "Saldo insuficiente para retiro" : "Solicitar Retiro"}
            </button>

            <button
              onClick={() => setMostrarModalRecarga(true)}
              className="w-full py-3 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors relative overflow-hidden"
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

const ModalRecargaSaldo = ({ isOpen, onClose, onConfirm }) => {
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("Nequi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mediosPago = ["Nequi", "Daviplata", "PSE"];

  const montosSugeridos = [10000, 20000, 50000, 100000];

  const manejarSubmit = (e) => {
    e.preventDefault();
    setError("");
    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    onConfirm({ monto: montoNum, medioPago });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recarga-title"
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-recarga-title" className="text-xl font-bold text-white">
              Recargar Saldo
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monto a Recargar
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {montosSugeridos.map((m) => (
                  <button
                    type="button"
                    onClick={() => setMonto(m.toString())}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      monto === m.toString()
                        ? "bg-green-600 text-white"
                        : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                    }`}
                  >
                    ${m.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0"
                  min="1000"
                  step="1000"
                  className="w-full pl-7 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Medio de Pago
              </label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {mediosPago.map((medio) => (
                  <option key={medio} value={medio}>
                    {medio}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-gray-300 font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Procesando..." : "Confirmar Recarga"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaginaBilletera;