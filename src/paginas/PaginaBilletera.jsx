/**
 * @file PaginaBilletera.jsx
 * Billetera virtual (HU-10) conectada al backend.
 *
 * - Saldos e historial vienen de PostgreSQL (/wallet/balance, /wallet/historial).
 * - Los retiros ejecutan un payout simulado en sandbox.
 * - La recarga es de prueba y no cobra dinero real.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import TarjetasBalance from "../componentes/billetera/TarjetasBalance";
import HistorialTransacciones from "../componentes/billetera/HistorialTransacciones";
import FormularioRetiroModal from "../componentes/billetera/FormularioRetiroModal";
import ModalRecargaSaldo from "../componentes/billetera/ModalRecargaSaldo";
import IndicadorCarga from "../componentes/comunes/IndicadorCarga";
import { useAuth } from "../contexto/ContextoAutenticacion";
import {
  mensajeErrorBilletera,
  obtenerBalance,
  obtenerHistorialTransacciones,
  recargarSaldo,
} from "../servicios/servicioBilletera";

const MIN_RETIRO = 10000;

export const PaginaBilletera = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const usuarioId = usuario?.id;

  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [totalGanado, setTotalGanado] = useState(0);
  const [totalRetirado, setTotalRetirado] = useState(0);
  const [retirosProceso, setRetirosProceso] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mostrarModalRecarga, setMostrarModalRecarga] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cargarDatos = useCallback(async () => {
    if (!usuarioId) {
      setError("No se pudo identificar al usuario. Vuelve a iniciar sesión.");
      setCargandoInicial(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [balance, transacciones] = await Promise.all([
        obtenerBalance(usuarioId),
        obtenerHistorialTransacciones(usuarioId, { limite: 50 }),
      ]);

      setSaldoDisponible(balance?.saldoDisponible || 0);
      setSaldoPendiente(balance?.saldoPendiente || 0);
      setTotalGanado(balance?.totalGanado || 0);
      setTotalRetirado(balance?.totalRetirado || 0);
      setRetirosProceso(balance?.retirosProceso || 0);
      setHistorial(Array.isArray(transacciones) ? transacciones : []);
    } catch (err) {
      setError(
        mensajeErrorBilletera(err, "Error al cargar los datos de la billetera.")
      );
    } finally {
      setLoading(false);
      setCargandoInicial(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(""), 6000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const manejarRetiroExitoso = async (resultado) => {
    setAviso(resultado?.mensaje || "Retiro procesado en sandbox.");
    await cargarDatos();
  };

  const manejarRecarga = async (datosRecarga) => {
    if (!usuarioId) {
      throw new Error("No se pudo identificar al usuario.");
    }

    try {
      const resultado = await recargarSaldo(usuarioId, datosRecarga);
      setAviso(resultado?.mensaje || "Recarga acreditada.");
      await cargarDatos();
      setMostrarModalRecarga(false);
    } catch (err) {
      const mensaje = mensajeErrorBilletera(
        err,
        "No se pudo procesar la recarga."
      );
      setError(mensaje);
      throw new Error(mensaje, { cause: err });
    }
  };

  if (cargandoInicial) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center">
        <div className="text-center">
          <IndicadorCarga texto="Cargando billetera..." tamaño="lg" />
        </div>
      </div>
    );
  }

  const puedeRetirar = saldoDisponible >= MIN_RETIRO;

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-white">
      <NavegacionLateral />

      <main className="max-w-7xl mx-auto transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6 px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-medium text-sm"
        >
          ← Volver al Panel
        </button>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Billetera Virtual</h1>
            <p className="text-gray-300 mt-1">
              Administra tus ganancias de alquileres universitarios
            </p>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Modo sandbox · sin dinero real
          </span>
        </div>

        {aviso && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            {aviso}
          </div>
        )}

        {error && (
          <div
            className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start justify-between gap-3"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-300 hover:text-white"
              aria-label="Cerrar mensaje de error"
            >
              ×
            </button>
          </div>
        )}

        <TarjetasBalance
          saldoDisponible={saldoDisponible}
          saldoPendiente={saldoPendiente}
          totalGanado={totalGanado}
          totalRetirado={totalRetirado}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <HistorialTransacciones transacciones={historial} />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white">Retirar ganancias</h3>
              <p className="mt-1 text-sm text-gray-400">
                El retiro se envía a Nequi, Daviplata o cuenta bancaria mediante
                una dispersión simulada.
              </p>
              <p className="mt-3 text-xs text-gray-500">
                Retiros en proceso: {retirosProceso}
              </p>
              <button
                onClick={() => setModalAbierto(true)}
                disabled={!puedeRetirar || loading}
                className="mt-4 w-full btn-primary disabled:opacity-50"
              >
                {puedeRetirar
                  ? "Solicitar Retiro"
                  : `Saldo insuficiente (mín. $${MIN_RETIRO.toLocaleString("es-CO")})`}
              </button>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold text-white">Recarga de prueba</h3>
              <p className="mt-1 text-sm text-gray-400">
                Acredita saldo simulado para probar el retiro. No se cobra dinero
                real y no cuenta como ganancia.
              </p>
              <button
                onClick={() => setMostrarModalRecarga(true)}
                disabled={loading}
                className="mt-4 w-full btn-secondary disabled:opacity-50"
              >
                Recargar saldo (sandbox)
              </button>
            </div>
          </div>
        </div>

        <FormularioRetiroModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          saldoDisponible={saldoDisponible}
          usuarioId={usuarioId}
          onSuccess={manejarRetiroExitoso}
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
