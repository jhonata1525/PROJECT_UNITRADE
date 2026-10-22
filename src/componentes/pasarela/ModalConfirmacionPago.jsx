/**
 * @file ModalConfirmacionPago.jsx
 * Tarjeta de confirmación y pago de una reserva (HU-06).
 *
 * Se usa en la página /pago y también puede reutilizarse en otros flujos.
 * El backend calcula los montos y procesa el cobro en sandbox.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { useAuth } from "../../contexto/ContextoAutenticacion";
import {
  generarClaveIdempotencia,
  mensajeErrorPagos,
  procesarCheckout,
} from "../../servicios/servicioPagos";

const COMISION = 0.12;

const formatCOP = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);

const ModalConfirmacionPago = ({
  articulo,
  horasIniciales = 1,
  onSuccess,
}) => {
  const { usuario } = useAuth();
  const [horas, setHoras] = useState(horasIniciales);
  const [vista, setVista] = useState("idle");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const idempotenciaRef = useRef(null);

  useEffect(() => {
    setVista("idle");
    setError("");
    setResultado(null);
    setHoras(horasIniciales);
    idempotenciaRef.current = null;
  }, [articulo?.id, horasIniciales]);

  const tarifaHora = Number(articulo?.precioPorDia) || 0;
  const subtotal = horas * tarifaHora;
  const comision = Math.round(subtotal * COMISION);
  const total = subtotal;
  const montoPropietario = subtotal - comision;

  const manejarPagar = async () => {
    if (!usuario?.id) {
      setError("No se pudo identificar al usuario. Vuelve a iniciar sesión.");
      setVista("error");
      return;
    }
    if (!articulo?.id) {
      setError("No hay un artículo seleccionado para pagar.");
      setVista("error");
      return;
    }

    setVista("processing");
    setError("");

    try {
      if (!idempotenciaRef.current) {
        idempotenciaRef.current = generarClaveIdempotencia();
      }

      const respuesta = await procesarCheckout(
        usuario.id,
        {
          articuloId: articulo.id,
          horas,
          metodo: "sandbox",
        },
        idempotenciaRef.current
      );

      if (!respuesta?.exito) {
        throw new Error(respuesta?.mensaje || "El pago no fue aprobado.");
      }

      setResultado(respuesta);
      setVista("success");
      onSuccess?.(respuesta);
    } catch (err) {
      setError(mensajeErrorPagos(err, "No se pudo procesar el pago."));
      setVista("error");
      // Si la intención falló, la siguiente necesita una clave nueva.
      idempotenciaRef.current = null;
    }
  };

  if (!articulo) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 text-gray-400">
          <Package className="w-6 h-6" />
          <p>No hay un artículo seleccionado para pagar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-canvas)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {articulo.fotoUrl ? (
            <img
              src={articulo.fotoUrl}
              alt={articulo.nombre}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Package className="w-7 h-7 text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">
            {articulo.nombre}
          </h2>
          <p className="text-sm text-gray-400">
            {formatCOP(tarifaHora)} / hora
          </p>
        </div>
      </div>

      {vista !== "success" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Horas de alquiler
            </label>
            <select
              value={horas}
              onChange={(e) => setHoras(Number(e.target.value))}
              disabled={vista === "processing"}
              className="glass-input bg-[var(--color-surface)] cursor-pointer"
            >
              {Array.from({ length: 9 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h} hora{h !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span className="font-mono text-gray-200">{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Comisión UniTrade (12%)</span>
              <span className="font-mono text-gray-200">-{formatCOP(comision)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
              <span className="font-medium text-white">Total a pagar</span>
              <span className="font-mono text-lg font-bold text-[var(--color-neon)]">
                {formatCOP(total)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Recibe el propietario</span>
              <span className="font-mono">{formatCOP(montoPropietario)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200/90">
            <p className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Cobro simulado en sandbox
            </p>
            <p className="mt-1 text-xs text-emerald-200/70">
              No se descuenta dinero real. El backend calcula la comisión y abona
              el saldo al propietario.
            </p>
          </div>

          {vista === "error" && error && (
            <div
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={manejarPagar}
            disabled={vista === "processing" || tarifaHora <= 0}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {vista === "processing" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando pago...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Confirmar y pagar (sandbox)
              </>
            )}
          </button>
        </>
      )}

      {vista === "success" && resultado && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Pago aprobado</h3>
            <p className="text-sm text-gray-400">{resultado.mensaje}</p>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] p-4 text-sm space-y-2">
            <p className="flex items-center gap-2 font-medium text-white">
              <Receipt className="w-4 h-4" /> Recibo sandbox
            </p>
            <div className="flex justify-between gap-3 text-gray-400">
              <span>Pago</span>
              <span className="font-mono text-xs break-all text-right text-gray-200">
                {resultado.pagoId}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-gray-400">
              <span>Transacción</span>
              <span className="font-mono text-xs break-all text-right text-gray-200">
                {resultado.transaccionId}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-gray-400">
              <span>Total pagado</span>
              <span className="font-mono text-gray-200">
                {formatCOP(resultado.desglose?.total ?? total)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-gray-400">
              <span>Comisión</span>
              <span className="font-mono text-gray-200">
                {formatCOP(resultado.desglose?.comision ?? comision)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-gray-400">
              <span>Recibe el propietario</span>
              <span className="font-mono text-gray-200">
                {formatCOP(resultado.desglose?.montoPropietario ?? montoPropietario)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalConfirmacionPago;
