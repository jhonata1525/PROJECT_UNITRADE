/**
 * @file ModalRecargaSaldo.jsx
 * Recarga de saldo de prueba para la billetera (solo sandbox).
 *
 * No se integra una pasarela real: el backend acredita saldo simulado para
 * poder demostrar el flujo de retiro de HU-10.
 */

import React, { useEffect, useRef, useState } from "react";
import { X, AlertCircle } from "lucide-react";

const MIN_RECARGA = 10000;
const MAX_RECARGA = 5000000;
const MEDIOS_PAGO = ["Nequi", "Daviplata", "PSE"];
const MONTOS_SUGERIDOS = [10000, 20000, 50000, 100000];

export const ModalRecargaSaldo = ({ isOpen, onClose, onConfirm }) => {
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("Nequi");
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => modalRef.current?.focus(), 100);
      setError("");
      setProcesando(false);
    } else {
      document.body.style.overflow = "unset";
      setMonto("");
      setMedioPago("Nequi");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !procesando) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, procesando, onClose]);

  const montoNumerico = Number(monto);
  const esMontoValido =
    monto !== "" &&
    Number.isInteger(montoNumerico) &&
    montoNumerico >= MIN_RECARGA &&
    montoNumerico <= MAX_RECARGA;

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!esMontoValido) {
      if (montoNumerico > MAX_RECARGA) {
        setError(
          `El monto máximo de recarga es $${MAX_RECARGA.toLocaleString("es-CO")} COP.`
        );
      } else {
        setError(
          `El monto mínimo de recarga es $${MIN_RECARGA.toLocaleString("es-CO")} COP.`
        );
      }
      return;
    }

    setProcesando(true);
    try {
      await onConfirm({ monto: montoNumerico, medioPago });
    } catch (err) {
      setError(err?.message || "No se pudo procesar la recarga.");
    } finally {
      setProcesando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recarga-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !procesando && onClose()}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] p-6 animate-scale-in"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-recarga-title" className="text-xl font-bold text-white">
              Recargar Saldo
            </h2>
            <button
              onClick={onClose}
              disabled={procesando}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              Recarga de prueba (sandbox). No se cobra dinero real; el saldo se
              acredita para demostrar la billetera y el retiro.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monto a recargar
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {MONTOS_SUGERIDOS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMonto(m.toString())}
                    disabled={procesando}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      monto === m.toString()
                        ? "bg-green-600 text-white"
                        : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                    }`}
                  >
                    ${m.toLocaleString("es-CO")}
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
                  min={MIN_RECARGA}
                  max={MAX_RECARGA}
                  step="1000"
                  disabled={procesando}
                  className={`glass-input pl-7 ${
                    monto !== "" && !esMontoValido
                      ? "border-red-500/50 focus:ring-red-500"
                      : ""
                  }`}
                  aria-invalid={monto !== "" && !esMontoValido}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo: ${MIN_RECARGA.toLocaleString("es-CO")} · Máximo: $
                {MAX_RECARGA.toLocaleString("es-CO")} COP
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Medio de pago simulado
              </label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
                disabled={procesando}
                className="glass-input bg-[var(--color-surface)] cursor-pointer"
              >
                {MEDIOS_PAGO.map((medio) => (
                  <option key={medio} value={medio}>
                    {medio}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!esMontoValido || procesando}
                className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" />
                      <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  "Confirmar recarga sandbox"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalRecargaSaldo;
