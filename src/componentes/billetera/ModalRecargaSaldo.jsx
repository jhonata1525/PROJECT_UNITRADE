/**
 * @file ModalRecargaSaldo.jsx
 * Modal para recargar saldo en la billetera virtual.
 * Validaciones: monto mínimo $10.000 COP, medio de pago válido.
 */

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const MIN_RECARGA = 10000;
const MEDIOS_PAGO = ["Nequi", "Daviplata", "PSE"];
const MONTOS_SUGERIDOS = [10000, 20000, 50000, 100000];

export const ModalRecargaSaldo = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("Nequi");
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => modalRef.current?.focus(), 100);
      setError("");
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
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const montoNumerico = parseFloat(monto);
  const esMontoValido = monto && !isNaN(montoNumerico) && montoNumerico >= MIN_RECARGA;

  const manejarSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!esMontoValido) {
      setError(`El monto mínimo de recarga es $${MIN_RECARGA.toLocaleString()} COP`);
      return;
    }

    onConfirm({ monto: montoNumerico, medioPago });
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
        onClick={onClose}
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
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monto a Recargar
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {MONTOS_SUGERIDOS.map((m) => (
                  <button
                    type="button"
                    key={m}
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
                  min={MIN_RECARGA}
                  step="1000"
                  className={`glass-input pl-7 ${!esMontoValido && monto ? "border-red-500/50 focus:ring-red-500" : ""}`}
                  aria-invalid={!esMontoValido && monto}
                  aria-describedby={!esMontoValido && monto ? "recarga-error" : "recarga-help"}
                />
              </div>
              {!esMontoValido && monto && (
                <p className="text-xs text-red-400 mt-1" id="recarga-error" role="alert">
                  El monto mínimo es $${MIN_RECARGA.toLocaleString()} COP
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1" id="recarga-help">
                Mínimo: $${MIN_RECARGA.toLocaleString()} COP
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Medio de Pago
              </label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
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
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!esMontoValido}
                className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Confirmar Recarga
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalRecargaSaldo;