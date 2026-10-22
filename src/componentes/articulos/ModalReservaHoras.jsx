/**
 * @file ModalReservaHoras.jsx
 * Reserva y pago por horas (HU-05 + HU-06).
 *
 * El pago se procesa en el backend con la pasarela sandbox:
 * - El arrendatario paga el subtotal.
 * - UniTrade retiene el 12% de comisión.
 * - El propietario recibe el resto en su billetera.
 *
 * No se descuenta dinero real ni se usan tarjetas reales.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import PinInput from "../comunes/PinInput";
import { useAuth } from "../../contexto/ContextoAutenticacion";
import {
  generarClaveIdempotencia,
  mensajeErrorPagos,
  procesarCheckout,
} from "../../servicios/servicioPagos";

const HORA_INICIO = 8;
const HORA_FIN = 18;
const HORAS_INICIO = Array.from(
  { length: HORA_FIN - HORA_INICIO - 1 },
  (_, i) => HORA_INICIO + i
);
const HORAS_FIN = Array.from(
  { length: HORA_FIN - HORA_INICIO - 1 },
  (_, i) => HORA_INICIO + i + 1
);
const COMISION = 0.12;

const formatHora = (hora) => `${hora.toString().padStart(2, "0")}:00`;

const formatCOP = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor);

const formatFecha = (fecha) =>
  new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(fecha);

const generarPin = () => Math.floor(1000 + Math.random() * 9000).toString();

/**
 * Construye las fechas de la reserva para hoy o mañana.
 * Si el horario elegido ya pasó, se agenda para mañana.
 */
const calcularFechas = (horaInicio, horaFin) => {
  const ahora = new Date();
  const inicio = new Date(ahora);
  inicio.setHours(horaInicio, 0, 0, 0);

  const fin = new Date(ahora);
  fin.setHours(horaFin, 0, 0, 0);

  const esManana = inicio <= ahora;
  if (esManana) {
    inicio.setDate(inicio.getDate() + 1);
    fin.setDate(fin.getDate() + 1);
  }

  return { inicio, fin, esManana };
};

export const ModalReservaHoras = ({
  isOpen,
  onClose,
  articulo,
  onReservaExitosa,
}) => {
  const { usuario } = useAuth();
  const [horaInicio, setHoraInicio] = useState(HORA_INICIO);
  const [horaFin, setHoraFin] = useState(HORA_INICIO + 1);
  const [confirmando, setConfirmando] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(null);
  const [error, setError] = useState("");
  const idempotenciaRef = useRef(null);

  const { inicio, fin, esManana } = useMemo(
    () => calcularFechas(horaInicio, horaFin),
    [horaInicio, horaFin]
  );

  const horasSeleccionadas = horaFin - horaInicio;
  const tarifaHora = Number(articulo?.precioPorDia) || 0;
  const subtotal = horasSeleccionadas * tarifaHora;
  const comision = Math.round(subtotal * COMISION);
  const total = subtotal;
  const montoPropietario = subtotal - comision;

  useEffect(() => {
    if (!isOpen) return;
    setReservaConfirmada(null);
    setError("");
    setHoraInicio(HORA_INICIO);
    setHoraFin(HORA_INICIO + 1);
    idempotenciaRef.current = null;
  }, [isOpen, articulo?.id]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !reservaConfirmada && !confirmando) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, reservaConfirmada, confirmando, onClose]);

  const manejarCambioInicio = (valor) => {
    const nuevaHora = Number(valor);
    setHoraInicio(nuevaHora);
    if (nuevaHora >= horaFin) {
      setHoraFin(nuevaHora + 1);
    }
  };

  const handleConfirmar = async () => {
    if (!usuario?.id) {
      setError("No se pudo identificar al usuario. Vuelve a iniciar sesión.");
      return;
    }
    if (!articulo?.id) {
      setError("No se seleccionó ningún artículo.");
      return;
    }
    if (tarifaHora <= 0) {
      setError("El artículo no tiene una tarifa por hora válida.");
      return;
    }

    setConfirmando(true);
    setError("");

    try {
      if (!idempotenciaRef.current) {
        idempotenciaRef.current = generarClaveIdempotencia();
      }

      const respuesta = await procesarCheckout(
        usuario.id,
        {
          articuloId: articulo.id,
          horas: horasSeleccionadas,
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          metodo: "sandbox",
        },
        idempotenciaRef.current
      );

      if (!respuesta?.exito) {
        throw new Error(respuesta?.mensaje || "El pago no fue aprobado.");
      }

      const pin = generarPin();
      const reserva = {
        id: respuesta.alquilerId,
        pagoId: respuesta.pagoId,
        transaccionId: respuesta.transaccionId,
        articuloId: articulo.id,
        articuloNombre: articulo.nombre,
        horaInicio: formatHora(horaInicio),
        horaFin: formatHora(horaFin),
        fecha: inicio.toISOString(),
        fechaTexto: `${esManana ? "Mañana" : "Hoy"}, ${formatFecha(inicio)}`,
        horas: horasSeleccionadas,
        tarifaHora,
        total: respuesta.desglose?.total ?? total,
        desglose:
          respuesta.desglose ?? {
            subtotal,
            comision,
            total,
            montoPropietario,
            porcentajeComision: COMISION,
          },
        pin,
        estado: respuesta.estado,
        mensaje: respuesta.mensaje,
      };

      setReservaConfirmada(reserva);
      onReservaExitosa?.(reserva);
    } catch (err) {
      setError(mensajeErrorPagos(err, "No se pudo procesar el pago."));
      // Una nueva intención necesita una nueva clave si la anterior falló.
      idempotenciaRef.current = null;
    } finally {
      setConfirmando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reserva-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !reservaConfirmada && !confirmando && onClose()}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-scale-in">
          {!reservaConfirmada && (
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
              <h2 id="modal-reserva-title" className="text-xl font-bold text-white">
                Reservar por Horas
              </h2>
              <button
                onClick={onClose}
                disabled={confirmando}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="p-5 space-y-5">
            {!reservaConfirmada && (
              <>
                <div className="glass-panel p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[var(--color-canvas)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {articulo?.fotoUrl ? (
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
                      <h3 className="font-semibold text-white truncate">
                        {articulo?.nombre}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {formatCOP(tarifaHora)} / hora
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[var(--color-neon)]" />
                    Fecha y horario
                  </h4>
                  <p className="mb-3 text-xs text-gray-400">
                    {esManana ? "Mañana" : "Hoy"}, {formatFecha(inicio)}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Hora de inicio</label>
                      <select
                        value={horaInicio}
                        onChange={(e) => manejarCambioInicio(e.target.value)}
                        className="glass-input bg-[var(--color-surface)] cursor-pointer"
                        disabled={confirmando}
                      >
                        {HORAS_INICIO.map((h) => (
                          <option key={h} value={h}>
                            {formatHora(h)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Hora de fin</label>
                      <select
                        value={horaFin}
                        onChange={(e) => setHoraFin(Number(e.target.value))}
                        className="glass-input bg-[var(--color-surface)] cursor-pointer"
                        disabled={confirmando}
                      >
                        {HORAS_FIN.filter((h) => h > horaInicio).map((h) => (
                          <option key={h} value={h}>
                            {formatHora(h)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {horasSeleccionadas} hora{horasSeleccionadas !== 1 ? "s" : ""} seleccionada
                    {horasSeleccionadas !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="glass-panel p-4 bg-gradient-to-r from-[var(--color-neon)]/5 to-[var(--color-accent-500)]/5 border-[var(--color-neon)]/20">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tarifa por hora</span>
                      <span className="font-medium text-white">{formatCOP(tarifaHora)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Horas</span>
                      <span className="font-medium text-white">{horasSeleccionadas} h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Subtotal</span>
                      <span className="font-medium text-white">{formatCOP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">
                        Comisión UniTrade (12%)
                      </span>
                      <span className="text-xs text-gray-400">-{formatCOP(comision)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
                      <span className="text-white font-medium">Total a pagar</span>
                      <span className="text-xl font-bold text-[var(--color-neon)]">
                        {formatCOP(total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Recibe el propietario</span>
                      <span className="font-mono">{formatCOP(montoPropietario)}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-4">
                  <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Pago en sandbox
                  </h4>
                  <p className="text-sm text-gray-400">
                    Se simula el cobro con una tarjeta de prueba. No se descuenta
                    dinero real. Al aprobarse, la reserva queda creada y el saldo
                    del propietario se abona automáticamente.
                  </p>
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
                    onClick={onClose}
                    disabled={confirmando}
                    className="flex-1 btn-secondary disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmar}
                    disabled={confirmando || tarifaHora <= 0}
                    className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {confirmando ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pagar y reservar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {reservaConfirmada && (
              <>
                <div className="text-center py-3">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Pago aprobado y reserva creada
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {reservaConfirmada.articuloNombre} · {reservaConfirmada.fechaTexto}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    Sandbox · sin dinero real
                  </span>
                </div>

                <div className="glass-panel p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Hora inicio</p>
                      <p className="font-mono text-lg font-bold text-white">
                        {reservaConfirmada.horaInicio}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Hora fin</p>
                      <p className="font-mono text-lg font-bold text-white">
                        {reservaConfirmada.horaFin}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Duración</p>
                      <p className="font-mono text-lg font-bold text-white">
                        {reservaConfirmada.horas}h
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Total pagado</p>
                      <p className="font-mono text-lg font-bold text-[var(--color-neon)]">
                        {formatCOP(reservaConfirmada.total)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                    <p className="mb-2 flex items-center gap-2 font-medium text-white">
                      <Receipt className="w-4 h-4" /> Recibo del pago
                    </p>
                    <div className="space-y-1 text-gray-400">
                      <div className="flex justify-between gap-3">
                        <span>Subtotal</span>
                        <span className="font-mono text-gray-200">
                          {formatCOP(reservaConfirmada.desglose.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Comisión UniTrade (12%)</span>
                        <span className="font-mono text-gray-200">
                          -{formatCOP(reservaConfirmada.desglose.comision)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Recibe el propietario</span>
                        <span className="font-mono text-gray-200">
                          {formatCOP(reservaConfirmada.desglose.montoPropietario)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-[var(--color-border)] pt-1">
                        <span>Estado del pago</span>
                        <span className="font-mono text-emerald-400">
                          {reservaConfirmada.estado}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Transacción sandbox</span>
                        <span className="font-mono text-xs break-all text-right text-gray-300">
                          {reservaConfirmada.transaccionId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gradient-to-r from-[var(--color-neon)]/10 to-[var(--color-accent-500)]/10 border border-[var(--color-neon)]/30">
                    <p className="text-xs text-gray-400 mb-2">Código PIN de entrega</p>
                    <div className="flex justify-center">
                      <PinInput
                        value={reservaConfirmada.pin}
                        onChange={() => {}}
                        disabled
                        autoFocus={false}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Comparte este PIN con el propietario al recoger el artículo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setReservaConfirmada(null);
                      onClose();
                    }}
                    className="flex-1 btn-primary"
                  >
                    Finalizar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalReservaHoras;
