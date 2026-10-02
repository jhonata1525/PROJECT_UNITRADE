/**
 * @file FormularioRetiroModal.jsx
 * Modal para solicitar retiro a Nequi/Daviplata/Banco.
 * Validaciones: monto mínimo $5.000 COP, no mayor al saldo disponible, número cuenta/teléfono requerido.
 */

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { solicitarRetiro, listarEntidades } from "../../servicios/servicioBilletera";

const MIN_RETIRO = 5000;

export const FormularioRetiroModal = ({
  isOpen,
  onClose,
  saldoDisponible = 0,
  onSuccess,
}) => {
  const [entidadSeleccionada, setEntidadSeleccionada] = useState("Nequi");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [montoRetiro, setMontoRetiro] = useState("");
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const cargarEntidades = async () => {
      try {
        const data = await listarEntidades();
        setEntidades(data);
      } catch (err) {
        console.error("Error cargando entidades:", err);
      }
    };
    cargarEntidades();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "unset";
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

  const montoNumerico = parseFloat(montoRetiro);
  const esMontoValido = montoRetiro &&
    !isNaN(montoNumerico) &&
    montoNumerico >= MIN_RETIRO &&
    montoNumerico <= saldoDisponible;

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito(false);

    if (!esMontoValido) {
      if (montoRetiro && montoNumerico < MIN_RETIRO) {
        setError(`El monto mínimo de retiro es $${MIN_RETIRO.toLocaleString()} COP`);
      } else if (montoNumerico > saldoDisponible) {
        setError(`El monto no puede ser mayor al saldo disponible ($${saldoDisponible.toLocaleString()} COP)`);
      } else {
        setError("Ingresa un monto válido");
      }
      return;
    }

    if (!numeroCuenta.trim()) {
      setError("Ingresa el número de cuenta o teléfono");
      return;
    }

    setLoading(true);
    try {
      const resultado = await solicitarRetiro({
        entidadFinanciera: entidadSeleccionada,
        numeroCuenta: numeroCuenta.trim(),
        monto: montoNumerico,
      });

      if (resultado.success) {
        setExito(true);
        setNumeroCuenta("");
        setMontoRetiro("");
        onSuccess?.(resultado);
      }
    } catch (err) {
      setError(err.message || "Error al procesar el retiro");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] p-6 animate-scale-in"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-xl font-bold text-white">
              Solicitar Retiro
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {exito && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center">
              ¡Retiro procesado exitosamente!
            </div>
          )}

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="entidadFinanciera"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Entidad Financiera
              </label>
              <select
                id="entidadFinanciera"
                value={entidadSeleccionada}
                onChange={(e) => setEntidadSeleccionada(e.target.value)}
                disabled={loading || exito}
                className="glass-input bg-[var(--color-surface)] cursor-pointer"
              >
                {entidades.map((entidad) => (
                  <option key={entidad.valor} value={entidad.valor}>
                    {entidad.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="numeroCuenta"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Número de Cuenta / Teléfono
              </label>
              <input
                type="text"
                id="numeroCuenta"
                value={numeroCuenta}
                onChange={(e) => setNumeroCuenta(e.target.value.replace(/\D/g, ""))}
                placeholder={
                  entidadSeleccionada === "Daviplata" || entidadSeleccionada === "Nequi"
                    ? "Ej: 3101234567"
                    : "Ej: 12345678-9"
                }
                disabled={loading || exito}
                className="glass-input"
                aria-describedby="telefono-help"
              />
              <p className="text-xs text-gray-500 mt-1" id="telefono-help">
                Ingresa tu número de Daviplata/Nequi o número de cuenta bancario
              </p>
            </div>

            <div>
              <label
                htmlFor="montoRetiro"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Monto a Retirar
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  id="montoRetiro"
                  value={montoRetiro}
                  onChange={(e) => setMontoRetiro(e.target.value)}
                  min={MIN_RETIRO}
                  max={saldoDisponible}
                  step="1000"
                  disabled={loading || exito}
                  className={`glass-input pl-7 pr-10 ${
                    montoRetiro && !esMontoValido
                      ? "border-red-500/50 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="0"
                  aria-invalid={montoRetiro && !esMontoValido}
                  aria-describedby={montoRetiro && !esMontoValido ? "monto-error" : "monto-help"}
                />
                {(montoRetiro && esMontoValido) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">✓</span>
                )}
                {(montoRetiro && !esMontoValido) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">⚠</span>
                )}
              </div>
              {(montoRetiro && !esMontoValido) && (
                <p className="text-xs text-red-400 mt-1" id="monto-error" role="alert">
                  {montoNumerico < MIN_RETIRO
                    ? `El monto mínimo es $${MIN_RETIRO.toLocaleString()} COP`
                    : `El monto no puede superar el saldo disponible ($${saldoDisponible.toLocaleString()} COP)`
                  }
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1" id="monto-help">
                Saldo disponible: ${saldoDisponible.toLocaleString()} COP · Mínimo: $${MIN_RETIRO.toLocaleString()} COP
              </p>
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
                disabled={loading}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !esMontoValido || exito}
                className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" />
                      <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Procesando...
                  </>
                ) : exito ? (
                  "¡Completado!"
                ) : (
                  "Solicitar Retiro"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioRetiroModal;