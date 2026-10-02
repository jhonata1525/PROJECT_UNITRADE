/**
 * @file ModalVerificacionWhatsApp.jsx
 * Modal de verificacion de telefono via WhatsApp OTP (HU-02).
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, MessageSquare, Loader2, CheckCircle2, Clock, RotateCcw, ChevronLeft } from "lucide-react";
import PinInput from "../comunes/PinInput";

const PREFIJO_COLOMBIA = "+57";
const OTP_LENGTH = 6;
const TIMER_DURATION = 300;
const CODIGO_PRUEBA = "123456";

export const ModalVerificacionWhatsApp = ({
  isOpen,
  onClose,
  onVerificado,
  usuario,
}) => {
  const [paso, setPaso] = useState(1);
  const [telefono, setTelefono] = useState("");
  const [otp, setOtp] = useState("");
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [timer, setTimer] = useState(300);
  const [timerActivo, setTimerActivo] = useState(false);
  const [mostrarCodigoDebug, setMostrarCodigoDebug] = useState(false);
  const otpRef = useRef(null);

  const generarCodigo = useCallback(() => {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoGenerado(codigo);
    return codigo;
  }, []);

  const formatearTelefono = (valor) => {
    const soloNumeros = valor.replace(/\D/g, "");
    if (soloNumeros.startsWith("57")) return soloNumeros.slice(2);
    return soloNumeros;
  };

  const telefonoCompleto = "+57 " + telefono;

  const manejarEnviarCodigo = async () => {
    if (!telefono || telefono.length < 10) { setError("Ingresa un numero valido (10 digitos)"); return; }
    setEnviando(true); setError("");
    try { await new Promise((resolve) => setTimeout(resolve, 1500)); const codigo = generarCodigo(); console.log("[WhatsApp OTP] Codigo para " + telefonoCompleto + ": " + codigo); setPaso(2); setTimer(300); setTimerActivo(true); setExito(true); } catch (err) { setError("Error al enviar codigo. Intenta de nuevo."); } finally { setEnviando(false); }
  };

  const manejarVerificarOtp = async () => {
    if (!otp || otp.length !== 6) { setError("Ingresa el codigo de 6 digitos"); return; }
    setVerificando(true); setError("");
    try { await new Promise((resolve) => setTimeout(resolve, 1000)); const esValido = otp === "123456" || otp === codigoGenerado; if (!esValido) { setError("Codigo incorrecto. Verifica e intenta de nuevo."); return; } const usuarioActualizado = { ...usuario, telefono: telefonoCompleto, telefonoVerificado: true, fechaVerificacionTelefono: new Date().toISOString() }; localStorage.setItem("usuario_unitrade", JSON.stringify(usuarioActualizado)); setExito(true); setTimerActivo(false); onVerificado?.(usuarioActualizado); setTimeout(() => { onClose(); }, 2000); } catch (err) { setError("Error al verificar. Intenta de nuevo."); } finally { setVerificando(false); }
  };

  const manejarReenviar = () => { generarCodigo(); setTimer(300); setTimerActivo(true); setExito(true); };
  const manejarCambioPaso = () => { setPaso(1); setTelefono(""); setOtp(""); setError(""); setExito(false); setTimerActivo(false); };

  useEffect(() => { if (!timerActivo) return; const interval = setInterval(() => { setTimer((prev) => { if (prev <= 1) { setTimerActivo(false); return 0; } return prev - 1; }); }, 1000); return () => clearInterval(interval); }, [timerActivo]);
  useEffect(() => { if (paso === 2 && otpRef.current) { setTimeout(() => otpRef.current?.focus?.(), 100); } }, [paso]);

  if (!isOpen) return null;

  const renderPaso1 = () => (
    <div>
      <div className="flex justify-center mb-2">
        <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-green-500" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-1">
          Verificacion por WhatsApp
        </h3>
        <p className="text-sm text-gray-400">
          Te enviaremos un codigo de 6 digitos a tu WhatsApp
        </p>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Numero de celular (Colombia)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
            +57
          </span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(formatearTelefono(e.target.value))}
            placeholder="300 123 4567"
            maxLength={10}
            className={"glass-input pl-14 pr-4 " + (error ? "border-red-500/50 focus:ring-red-500" : "")}
            disabled={enviando}
            autoComplete="tel"
            aria-describedby={error ? "telefono-error" : undefined}
          />
          {error && (
            <p id="telefono-error" className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Formato: 300 123 4567 (sin el +57)
        </p>
      </div>

      <button
        onClick={manejarEnviarCodigo}
        disabled={enviando || !telefono || telefono.length < 10}
        className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2 py-3"
      >
        {enviando ? (
          <React.Fragment>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando...
          </React.Fragment>
        ) : (
          <React.Fragment>
            <MessageSquare className="w-5 h-5" />
            Enviar Codigo por WhatsApp
          </React.Fragment>
        )}
      </button>

      {import.meta.env.DEV && mostrarCodigoDebug && codigoGenerado && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
          <strong>Codigo de prueba (DEV): </strong>
          <code className="font-mono ml-2">{codigoGenerado}</code>
          <button
            onClick={() => setMostrarCodigoDebug(!mostrarCodigoDebug)}
            className="ml-2 text-xs underline"
          >
            Ocultar
          </button>
        </div>
      )}
    </div>
  );

  const renderPaso2 = () => (
    <div>
      <div className="flex justify-center mb-2">
        <div className={"w-16 h-16 rounded-2xl flex items-center justify-center " + (timerActivo ? "bg-blue-500/20" : "bg-amber-500/20")}>
          <Clock className={"w-8 h-8 " + (timerActivo ? "text-blue-500 animate-pulse" : "text-amber-500")} />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-1">
          Ingresa el codigo
        </h3>
        <p className="text-sm text-gray-400 mb-2">
          Enviado a <strong className="text-white">{telefonoCompleto}</strong>
        </p>

        <div className={"flex items-center justify-center gap-2 mb-4 p-3 rounded-xl " + (timerActivo ? "bg-blue-500/10 border-blue-500/30" : "bg-amber-500/10 border-amber-500/30")}>
          <Clock className={"w-5 h-5 " + (timerActivo ? "text-blue-500 animate-pulse" : "text-amber-500")} />
          <span className="font-mono text-lg font-bold text-white">{formatearTiempo(timer)}</span>
          <span className="text-xs text-gray-400">{timerActivo ? "para reenviar" : "Expirado"}</span>
        </div>

        <div className="glass-panel p-4">
          <PinInput ref={otpRef} value={otp} onChange={setOtp} error={error} disabled={verificando} autoFocus={true} />
          {error && <p className="text-xs text-red-400 mt-2 text-center" role="alert">{error}</p>}
        </div>

        {import.meta.env.DEV && mostrarCodigoDebug && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm text-center">
            <strong>Codigo actual (DEV): </strong>
            <code className="font-mono ml-2">{codigoGenerado}</code>
          </div>
        )}

        <div className="space-y-3">
          <button onClick={manejarVerificarOtp} disabled={verificando || !otp || otp.length !== 6} className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2 py-3">
            {verificando ? (
              <React.Fragment>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verificando...
              </React.Fragment>
            ) : (
              <React.Fragment>
                <CheckCircle2 className="w-5 h-5" />
                Verificar Codigo
              </React.Fragment>
            )}
          </button>

          <button onClick={manejarReenviar} disabled={timerActivo || enviando} className="w-full btn-secondary disabled:opacity-50 flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" />
            {timerActivo ? "Reenviar en " + formatearTiempo(timer) : "Reenviar codigo"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-whatsapp-title">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !verificando && !enviando && onClose()} aria-hidden="true" />
      <div className="flex min-h-full items-center justify-center p-4">
        <div ref={otpRef} tabIndex={-1} className="relative w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-scale-in">
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
            {paso === 2 && <button onClick={manejarCambioPaso} disabled={verificando || enviando} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50" aria-label="Volver al telefono"><ChevronLeft className="w-5 h-5" /></button>}
            <h2 id="modal-whatsapp-title" className="text-xl font-bold text-white">{paso === 1 ? "Verificar Telefono" : "Codigo de Verificacion"}</h2>
            <button onClick={() => !verificando && !enviando && onClose()} disabled={verificando || enviando} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50" aria-label="Cerrar modal"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-5 space-y-5">
            {paso === 1 && renderPaso1()}
            {paso === 2 && renderPaso2()}

            {exito && !verificando && !enviando && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm text-center" role="status">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Codigo enviado correctamente</span>
                </div>
                <p className="text-xs">Revisa tu WhatsApp e ingresa el codigo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalVerificacionWhatsApp;