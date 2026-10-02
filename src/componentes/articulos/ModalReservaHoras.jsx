/**
 * @file ModalReservaHoras.jsx
 * Modal para reserva de alquiler por horas con cotizador en tiempo real (HU-05).
 * - Selector de hora inicio/fin (bloques 1h, 08:00-18:00)
 * - Cálculo automático: Total = Horas * Tarifa por hora
 * - Verificación de saldo billetera (RN-07)
 * - Generación QR/PIN al confirmar (HU-07)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Clock, Wallet, CreditCard, CheckCircle2, AlertCircle, Copy, Loader2, Package } from "lucide-react";
import { obtenerBalance, obtenerHistorialTransacciones } from "../../servicios/servicioBilletera";
import PinInput from "../comunes/PinInput";
import QRScanner from "../comunes/QRScanner";
import ModalRecargaSaldo from "../billetera/ModalRecargaSaldo";

const HORA_INICIO = 8;
const HORA_FIN = 18;
const HORAS_DISPONIBLES = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i);

const formatHora = (hora) => `${hora.toString().padStart(2, "0")}:00`;

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

const generarPin = () => Math.floor(1000 + Math.random() * 9000).toString();

const generarQRData = (reserva) => {
  return JSON.stringify({
    tipo: "reserva_untrade",
    reservaId: reserva.id,
    articuloId: reserva.articuloId,
    articuloNombre: reserva.articuloNombre,
    horaInicio: reserva.horaInicio,
    horaFin: reserva.horaFin,
    pin: reserva.pin,
    timestamp: Date.now(),
  });
};

export const ModalReservaHoras = ({
  isOpen,
  onClose,
  articulo,
  onReservaExitosa,
}) => {
  const [horaInicio, setHoraInicio] = useState(HORA_INICIO);
  const [horaFin, setHoraFin] = useState(HORA_INICIO + 1);
  const [saldoDisponible, setSaldoDisponible] = useState(0);
  const [loadingSaldo, setLoadingSaldo] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState(null);
  const [mostrarRecarga, setMostrarRecarga] = useState(false);
  const [error, setError] = useState("");
  const qrRef = useRef(null);

  const horasSeleccionadas = horaFin - horaInicio;
  const totalPagar = horasSeleccionadas * (articulo?.precioPorDia || 0);
  const saldoSuficiente = saldoDisponible >= totalPagar;

  const cargarSaldo = useCallback(async () => {
    setLoadingSaldo(true);
    try {
      const balance = await obtenerBalance();
      setSaldoDisponible(balance.saldoDisponible || 0);
    } catch (err) {
      setError("Error al cargar saldo de billetera");
    } finally {
      setLoadingSaldo(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarSaldo();
      setReservaConfirmada(null);
      setMostrarRecarga(false);
      setError("");
    }
  }, [isOpen, cargarSaldo]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !reservaConfirmada) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, reservaConfirmada, onClose]);

  const handleConfirmar = useCallback(async () => {
    if (!saldoSuficiente) {
      setMostrarRecarga(true);
      return;
    }

    setConfirmando(true);
    setError("");

    try {
      const pin = generarPin();
      const nuevaReserva = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        articuloId: articulo.id,
        articuloNombre: articulo.nombre,
        horaInicio: formatHora(horaInicio),
        horaFin: formatHora(horaFin),
        horas: horasSeleccionadas,
        tarifaHora: articulo.precioPorDia,
        total: totalPagar,
        pin,
        qrData: null,
        fecha: new Date().toISOString().split("T")[0],
        estado: "CONFIRMADA",
      };

      nuevaReserva.qrData = generarQRData(nuevaReserva);

      const balance = await obtenerBalance();
      const nuevoBalance = {
        ...balance,
        saldoDisponible: balance.saldoDisponible - totalPagar,
        retirosProceso: balance.retirosProceso + 1,
      };
      localStorage.setItem("untrade_wallet_balance", JSON.stringify(nuevoBalance));

      const historial = await obtenerHistorialTransacciones();
      const nuevaTransaccion = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tipo: "RETIRO",
        concepto: `Reserva: ${articulo.nombre} (${horasSeleccionadas}h)`,
        monto: totalPagar,
        fecha: new Date().toISOString().split("T")[0],
        estado: "COMPLETADO",
        destino: "Reserva de alquiler",
      };
      historial.unshift(nuevaTransaccion);
      localStorage.setItem("untrade_wallet_historial", JSON.stringify(historial));

      await new Promise((resolve) => setTimeout(resolve, 500));

      setReservaConfirmada(nuevaReserva);
      onReservaExitosa?.(nuevaReserva);
    } catch (err) {
      setError(err.message || "Error al procesar la reserva");
    } finally {
      setConfirmando(false);
    }
  }, [saldoSuficiente, totalPagar, articulo, horaInicio, horaFin, horasSeleccionadas, onReservaExitosa]);

  const handleRecargaExitosa = async (datos) => {
    await cargarSaldo();
    setMostrarRecarga(false);
  };

  const copiarQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        canvas.toBlob((blob) => {
          navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        });
      }
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
        onClick={() => !reservaConfirmada && onClose()}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-scale-in"
        >
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
                {/* Artículo info */}
                <div className="glass-panel p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[var(--color-canvas)] flex items-center justify-center flex-shrink-0">
                      {articulo?.fotoUrl ? (
                        <img src={articulo.fotoUrl} alt={articulo.nombre} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-7 h-7 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{articulo?.nombre}</h3>
                      <p className="text-sm text-gray-400">
                        {formatCOP(articulo?.precioPorDia || 0)} / hora
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selector de horas */}
                <div className="glass-panel p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[var(--color-neon)]" />
                    Seleccionar Horario
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Hora de Inicio</label>
                      <select
                        value={horaInicio}
                        onChange={(e) => {
                          const nuevaHora = parseInt(e.target.value);
                          setHoraInicio(nuevaHora);
                          if (nuevaHora >= horaFin) {
                            setHoraFin(Math.min(nuevaHora + 1, HORA_FIN));
                          }
                        }}
                        className="glass-input bg-[var(--color-surface)] cursor-pointer"
                        disabled={confirmando}
                      >
                        {HORAS_DISPONIBLES.filter(h => h < HORA_FIN).map((h) => (
                          <option key={h} value={h}>{formatHora(h)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Hora de Fin</label>
                      <select
                        value={horaFin}
                        onChange={(e) => setHoraFin(parseInt(e.target.value))}
                        className="glass-input bg-[var(--color-surface)] cursor-pointer"
                        disabled={confirmando}
                      >
                        {HORAS_DISPONIBLES.filter(h => h > horaInicio).map((h) => (
                          <option key={h} value={h}>{formatHora(h)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {horasSeleccionadas} hora{horasSeleccionadas !== 1 ? "s" : ""} seleccionada{horasSeleccionadas !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Cotizador */}
                <div className="glass-panel p-4 bg-gradient-to-r from-[var(--color-neon)]/5 to-[var(--color-accent-500)]/5 border-[var(--color-neon)]/20">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tarifa por hora</span>
                      <span className="font-medium text-white">{formatCOP(articulo?.precioPorDia || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Horas</span>
                      <span className="font-medium text-white">{horasSeleccionadas} h</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
                      <span className="text-white font-medium">Total a Pagar</span>
                      <span className="text-xl font-bold text-[var(--color-neon)]">{formatCOP(totalPagar)}</span>
                    </div>
                  </div>
                </div>

                {/* Verificación de billetera */}
                <div className="glass-panel p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[var(--color-neon)]" />
                    Verificación de Billetera
                  </h4>
                  {loadingSaldo ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 text-[var(--color-neon)] animate-spin mr-2" />
                      <span className="text-gray-400">Verificando saldo...</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${saldoSuficiente ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${saldoSuficiente ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                        {saldoSuficiente ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${saldoSuficiente ? "text-emerald-400" : "text-red-400"}`}>
                          {saldoSuficiente ? "Saldo suficiente" : "Saldo insuficiente"}
                        </p>
                        <p className="text-xs text-gray-400">
                          Disponible: {formatCOP(saldoDisponible)} · Requerido: {formatCOP(totalPagar)}
                        </p>
                      </div>
                    </div>
                  )}
                  {!saldoSuficiente && !loadingSaldo && (
                    <button
                      onClick={() => setMostrarRecarga(true)}
                      className="w-full mt-3 btn-primary bg-amber-600 hover:bg-amber-700 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Recargar Billetera
                    </button>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm" role="alert">
                    {error}
                  </div>
                )}

                {/* Botones de acción */}
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
                    disabled={confirmando || loadingSaldo || !saldoSuficiente}
                    className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {confirmando ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Reserva"
                    )}
                  </button>
                </div>
              </>
            )}

            {reservaConfirmada && (
              <>
                {/* Confirmación exitosa con QR y PIN */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">¡Reserva Confirmada!</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Tu reserva para <strong className="text-white">{articulo.nombre}</strong> ha sido procesada.
                  </p>
                </div>

                <div className="glass-panel p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Hora Inicio</p>
                      <p className="font-mono text-lg font-bold text-white">{reservaConfirmada.horaInicio}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Hora Fin</p>
                      <p className="font-mono text-lg font-bold text-white">{reservaConfirmada.horaFin}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Duración</p>
                      <p className="font-mono text-lg font-bold text-white">{reservaConfirmada.horas}h</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-canvas)]">
                      <p className="text-xs text-gray-400">Total Pagado</p>
                      <p className="font-mono text-lg font-bold text-[var(--color-neon)]">{formatCOP(reservaConfirmada.total)}</p>
                    </div>
                  </div>

                  {/* PIN */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[var(--color-neon)]/10 to-[var(--color-accent-500)]/10 border border-[var(--color-neon)]/30">
                    <p className="text-xs text-gray-400 mb-2">Código PIN de Entrega</p>
                    <div className="flex justify-center">
                      <PinInput value={reservaConfirmada.pin} disabled />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Comparte este PIN con el propietario al recoger el artículo
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 text-center">Código QR de la Reserva</p>
                    <div ref={qrRef} className="flex justify-center">
                      <QRScanner
                        onScan={() => {}}
                        showFallback={false}
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Escanea para ver detalles de la reserva
                    </p>
                    <button
                      onClick={copiarQR}
                      className="w-full btn-secondary text-xs flex items-center justify-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar QR
                    </button>
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

      {/* Modal Recarga Saldo */}
      <ModalRecargaSaldo
        isOpen={mostrarRecarga}
        onClose={() => setMostrarRecarga(false)}
        onConfirm={handleRecargaExitosa}
      />
    </div>
  );
};

export default ModalReservaHoras;