/**
 * @file FormularioRetiroModal.jsx
 * Solicitud de retiro de ganancias (HU-10) con payout simulado en sandbox.
 *
 * El backend valida el saldo, retiene el monto, ejecuta la dispersión y
 * devuelve el resultado. Si el payout falla, el saldo se restaura.
 */

import React, { useEffect, useRef, useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  listarEntidades,
  mensajeErrorBilletera,
  solicitarRetiro,
} from "../../servicios/servicioBilletera";

const MIN_RETIRO = 10000;
const MAX_RETIRO = 5000000;

const formatCOP = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);

export const FormularioRetiroModal = ({
  isOpen,
  onClose,
  saldoDisponible = 0,
  onSuccess,
  usuarioId,
}) => {
  const [entidadSeleccionada, setEntidadSeleccionada] = useState("NEQUI");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [montoRetiro, setMontoRetiro] = useState("");
  const [entidades, setEntidades] = useState([]);
  const [forzarFallo, setForzarFallo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setError("");
    setExito(null);
    setNumeroCuenta("");
    setMontoRetiro("");
    setForzarFallo(false);

    let cancelado = false;
    listarEntidades()
      .then((data) => {
        if (cancelado) return;
        setEntidades(data);
        setEntidadSeleccionada((actual) =>
          data.some((entidad) => entidad.valor === actual)
            ? actual
            : data[0]?.valor || "NEQUI"
        );
      })
      .catch((err) => {
        if (!cancelado) {
          setError(mensajeErrorBilletera(err, "No se pudieron cargar los métodos de retiro."));
        }
      });

    return () => {
      cancelado = true;
    };
  }, [isOpen]);

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
      if (e.key === "Escape" && isOpen && !loading) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, loading, onClose]);

  const montoNumerico = Number(montoRetiro);
  const esMontoValido =
    montoRetiro !== "" &&
    Number.isInteger(montoNumerico) &&
    montoNumerico >= MIN_RETIRO &&
    montoNumerico <= saldoDisponible &&
    montoNumerico <= MAX_RETIRO;
  const esCuentaValida = /^\d{6,20}$/.test(numeroCuenta.trim());

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!esMontoValido) {
      if (montoNumerico < MIN_RETIRO) {
        setError(`El monto mínimo de retiro es ${formatCOP(MIN_RETIRO)}.`);
      } else if (montoNumerico > saldoDisponible) {
        setError(`El monto no puede superar el saldo disponible (${formatCOP(saldoDisponible)}).`);
      } else {
        setError("Ingresa un monto válido.");
      }
      return;
    }

    if (!esCuentaValida) {
      setError("Ingresa entre 6 y 20 dígitos, sin espacios ni guiones.");
      return;
    }

    if (!usuarioId) {
      setError("No se pudo identificar al usuario. Vuelve a iniciar sesión.");
      return;
    }

    setLoading(true);
    try {
      const resultado = await solicitarRetiro(usuarioId, {
        metodo: entidadSeleccionada,
        cuenta: numeroCuenta.trim(),
        monto: montoNumerico,
        forzarFallo,
      });

      if (resultado?.exito) {
        setExito(resultado);
        onSuccess?.(resultado);
      } else {
        setError(resultado?.mensaje || "El retiro no fue aprobado por la pasarela.");
      }
    } catch (err) {
      setError(mensajeErrorBilletera(err, "No se pudo procesar el retiro."));
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
        onClick={() => !loading && onClose()}
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

          {exito ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Retiro procesado en sandbox
                </div>
                <p className="text-sm mt-2 text-emerald-200/90">{exito.mensaje}</p>
                <dl className="mt-3 space-y-1 text-sm text-emerald-100/80">
                  <div className="flex justify-between gap-3">
                    <dt>Monto</dt>
                    <dd className="font-mono">{formatCOP(exito.monto)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Saldo restante</dt>
                    <dd className="font-mono">{formatCOP(exito.saldoDisponible)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Payout</dt>
                    <dd className="font-mono text-xs break-all text-right">{exito.idPayout}</dd>
                  </div>
                </dl>
              </div>
              <button type="button" onClick={onClose} className="w-full btn-primary">
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={manejarSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs">
                Retiro simulado. No se envía dinero real: la dispersión se procesa
                en la pasarela sandbox.
              </div>

              <div>
                <label
                  htmlFor="entidadFinanciera"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Entidad financiera
                </label>
                <select
                  id="entidadFinanciera"
                  value={entidadSeleccionada}
                  onChange={(e) => setEntidadSeleccionada(e.target.value)}
                  disabled={loading}
                  className="glass-input bg-[var(--color-surface)] cursor-pointer"
                >
                  {entidades.length === 0 && (
                    <option value="NEQUI">Nequi</option>
                  )}
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
                  Número de cuenta / teléfono
                </label>
                <input
                  type="text"
                  id="numeroCuenta"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value.replace(/\D/g, ""))}
                  placeholder={
                    entidadSeleccionada === "NEQUI" || entidadSeleccionada === "DAVIPLATA"
                      ? "Ej: 3001234567"
                      : "Ej: 1234567890"
                  }
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={loading}
                  className="glass-input"
                  aria-describedby="cuenta-help"
                />
                <p className="text-xs text-gray-500 mt-1" id="cuenta-help">
                  Nequi/Daviplata: celular de 10 dígitos. Banco: cuenta de 6 a 20 dígitos.
                </p>
              </div>

              <div>
                <label
                  htmlFor="montoRetiro"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Monto a retirar
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
                    disabled={loading}
                    className={`glass-input pl-7 ${
                      montoRetiro !== "" && !esMontoValido
                        ? "border-red-500/50 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="0"
                    aria-invalid={montoRetiro !== "" && !esMontoValido}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Disponible: {formatCOP(saldoDisponible)} · Mínimo: {formatCOP(MIN_RETIRO)}
                </p>
              </div>

              <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forzarFallo}
                  onChange={(e) => setForzarFallo(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5"
                />
                <span>
                  Simular rechazo del payout (sandbox). Sirve para comprobar que el
                  saldo se devuelve automáticamente.
                </span>
              </label>

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
                  disabled={loading}
                  className="flex-1 btn-secondary disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !esMontoValido || !esCuentaValida}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
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
                    "Solicitar Retiro"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormularioRetiroModal;
