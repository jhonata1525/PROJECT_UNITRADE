import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { solicitarRetiro, listarEntidades } from "../../servicios/servicioBilletera";

/**
 * @file FormularioRetiroModal.jsx
 * Modal para solicitar retiro a Nequi/Daviplata.
 * Validación: El monto no debe superar el saldo disponible.
 */

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

  const esMontoValido = montoRetiro && !isNaN(parseFloat(montoRetiro)) && parseFloat(montoRetiro) <= saldoDisponible && parseFloat(montoRetiro) > 0;

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito(false);

    if (!esMontoValido) {
      setError("El monto no puede ser mayor al saldo disponible");
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
        monto: parseFloat(montoRetiro),
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
        className="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          ref={modalRef}
          tabIndex={-1}
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 px-6 py-6 shadow-xl transition-all text-left sm:max-w-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Solicitar Retiro
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {exito && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-sm text-center">
              ¡Retiro procesado exitosamente!
            </div>
          )}

          <form onSubmit={manejarSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="entidadFinanciera"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Entidad Financiera
              </label>
              <select
                id="entidadFinanciera"
                value={entidadSeleccionada}
                onChange={(e) => setEntidadSeleccionada(e.target.value)}
                disabled={loading || exito}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                aria-describedby="telefono-help"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" id="telefono-help">
                Ingresa tu número de Daviplata/Nequi o número de cuenta bancario
              </p>
            </div>

            <div>
              <label
                htmlFor="montoRetiro"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                  min="1000"
                  max={saldoDisponible}
                  step="1000"
                  disabled={loading || exito}
                  className={`w-full pl-7 pr-10 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                    montoRetiro && !esMontoValido
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="0"
                  aria-invalid={montoRetiro && !esMontoValido}
                  aria-describedby="monto-error monto-help"
                />
                {(montoRetiro && esMontoValido) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                )}
                {(montoRetiro && !esMontoValido) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">⚠</span>
                )}
              </div>
              {(montoRetiro && !esMontoValido) && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1" id="monto-error">
                  El monto no puede ser mayor al saldo disponible (${saldoDisponible.toLocaleString()})
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" id="monto-help">
                Saldo disponible: ${saldoDisponible.toLocaleString()} COP
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-sm" role="alert">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !esMontoValido || exito}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" />
                      <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Procesando...
                  </span>
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