/**
 * @file QRScanner.jsx
 * Componente lector de código QR usando html5-qrcode con fallback seguro.
 * - Soporta cámara trasera (environment) y frontal (user)
 * - Manejo de permisos y errores de cámara sin romper el árbol de React
 * - Fallback a entrada manual si no hay cámara o el usuario niega el permiso
 * - Accesible: aria-labels, estados de carga, mensajes de error claros
 * - Robusto en iOS Safari: facingMode exact "environment" con fallback,
 *   playsInline y muted en el elemento <video> de la librería subyacente
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, RotateCcw, Zap } from "lucide-react";

const QRScanner = ({
  onScan,
  onError,
  onClose,
  showFallback = true,
  className = "",
}) => {
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [camaraSoportada, setCamaraSoportada] = useState(null);
  const html5QrcodeRef = useRef(null);
  const containerRef = useRef(null);

  /**
   * Verifica de forma segura si el navegador expone las APIs necesarias
   * para acceder a la cámara (navigator, mediaDevices, getUserMedia).
   * Nunca lanza: devuelve false si falta alguna API.
   */
  const camaraDisponible = useCallback(() => {
    try {
      if (typeof navigator === "undefined") return false;
      if (!navigator.mediaDevices) return false;
      if (typeof navigator.mediaDevices.getUserMedia !== "function") return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const comprobarSoporte = async () => {
      try {
        setCamaraSoportada(camaraDisponible());
      } catch {
        setCamaraSoportada(false);
      }
    };
    comprobarSoporte();
  }, [camaraDisponible]);

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.warn("Error deteniendo scanner:", err);
      } finally {
        html5QrcodeRef.current = null;
        setScanning(false);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || html5QrcodeRef.current) return;
    if (!camaraDisponible()) {
      setError("Este navegador no soporta acceso a la cámara. Usa la entrada manual.");
      setCamaraSoportada(false);
      onError?.(new Error("Cámara no soportada"));
      return;
    }

    try {
      const html5Qrcode = new Html5Qrcode(containerRef.current.id);
      html5QrcodeRef.current = html5Qrcode;

      // iOS Safari exige facingMode exact y atributos playsInline/muted en <video>.
      // html5-qrcode los pasa internamente; aquí forzamos environment con fallback seguro.
      const restriccionesVideo =
        facingMode === "environment"
          ? { facingMode: { exact: "environment" } }
          : { facingMode: "user" };

      await html5Qrcode.start(
        restriccionesVideo,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopScanner();
          onScan?.(decodedText);
        },
        (_errorMessage) => {
          // Silenciar errores de escaneo continuo (cámara aún enfocando)
        },
      );
      setScanning(true);
      setError("");
    } catch (err) {
      html5QrcodeRef.current = null;
      setScanning(false);
      // Fallback: si environment falla en iOS, probar user como último recurso.
      if (facingMode === "environment") {
        setFacingMode("user");
        setTimeout(() => setScanning(true), 200);
        return;
      }
      setError("No se pudo acceder a la cámara. Verifica los permisos o usa la entrada manual.");
      onError?.(err);
    }
  }, [facingMode, camaraDisponible, stopScanner, onScan, onError]);

  /**
   * Verifica permiso de cámara de forma segura, sin romper si falta la API.
   */
  useEffect(() => {
    const checkPermission = async () => {
      if (!camaraDisponible()) {
        setHasPermission(false);
        setCamaraSoportada(false);
        setError(
          "Cámara no disponible en este navegador. Usa la entrada manual.",
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices
          .getUserMedia({ video: { facingMode } })
          .catch((err) => {
            throw err;
          });
        stream.getTracks().forEach((track) => track.stop());
        setHasPermission(true);
        setCamaraSoportada(true);
        setError("");
      } catch {
        setHasPermission(false);
        setCamaraSoportada(false);
        setError(
          "Permiso de cámara denegado o no disponible. Usa la entrada manual.",
        );
      }
    };
    checkPermission();
  }, [facingMode, camaraDisponible]);

  useEffect(() => {
    if (scanning) {
      startScanner().catch((err) => {
        console.warn("Error iniciando escáner:", err);
        setScanning(false);
        setError("No se pudo iniciar el escáner. Usa la entrada manual.");
        onError?.(err);
      });
    }
    return () => {
      stopScanner();
    };
  }, [scanning, startScanner, stopScanner]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    stopScanner();
    setTimeout(() => setScanning(true), 100);
  };

  const toggleTorch = async () => {
    if (html5QrcodeRef.current && scanning) {
      try {
        await html5QrcodeRef.current.applyVideoConstraints({
          advanced: [{ torch: !torchEnabled }],
        });
        setTorchEnabled(!torchEnabled);
      } catch (err) {
        console.warn("Torch no disponible:", err);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose?.();
  };

  // Si no hay soporte de cámara en absoluto, mostrar directamente la alternativa manual.
  if (camaraSoportada === false && !showFallback) {
    return (
      <div className={`glass-card p-6 text-center ${className}`} role="alert">
        <Camera className="w-12 h-12 mx-auto text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Cámara no disponible
        </h3>
        <p className="text-gray-400 mb-4">
          {error || "Este navegador no soporta acceso a la cámara."}
        </p>
        <button onClick={onClose} className="btn-secondary">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div
      className={`glass-card overflow-hidden ${className}`}
      role="region"
      aria-label="Escáner QR"
    >
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Escáner QR</h3>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          aria-label="Cerrar escáner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && !scanning && (
        <div className="px-4 pb-4 text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => setScanning(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar cámara
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        id="qr-scanner-container"
        className="relative mx-4 mb-4"
        style={{ width: "100%", aspectRatio: "1/1", maxWidth: "320px" }}
        aria-live="polite"
        aria-label="Vista de cámara para escanear código QR"
      >
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-canvas)] z-10">
            <div className="animate-pulse text-[var(--color-neon)]">
              <Zap className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Iniciando cámara...</p>
            </div>
          </div>
        )}
      </div>

      {scanning && !error && (
        <div className="px-4 pb-4 flex items-center justify-center gap-3">
          <button
            onClick={toggleCamera}
            disabled={!scanning}
            className="btn-secondary flex items-center gap-2"
            aria-label={
              facingMode === "environment"
                ? "Cambiar a cámara frontal"
                : "Cambiar a cámara trasera"
            }
          >
            <RotateCcw className="w-4 h-4" />
            Cambiar cámara
          </button>
          <button
            onClick={toggleTorch}
            disabled={!scanning || facingMode === "user"}
            className={`btn-secondary flex items-center gap-2 ${torchEnabled ? "bg-[var(--color-neon)]/20 border-[var(--color-neon)]" : ""}`}
            aria-label={
              torchEnabled ? "Apagar linterna" : "Encender linterna"
            }
            aria-pressed={torchEnabled}
          >
            <Zap className="w-4 h-4" />
            {torchEnabled ? "Apagar luz" : "Encender luz"}
          </button>
        </div>
      )}

      {!scanning && showFallback && camaraDisponible() && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)]">
          <button
            onClick={() => setScanning(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Iniciar escáner
          </button>
        </div>
      )}

      {/* Alternativa manual SIEMPRE visible: campo de texto para ingresar código/PIN/token */}
      <div className="px-4 pb-4 border-t border-[var(--color-border)]">
        <p className="text-[11px] text-gray-500 mb-2 text-center uppercase tracking-wider font-semibold">
          Entrada manual
        </p>
        <div className="relative">
          <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Pega el enlace del QR, el código de verificación o el PIN"
            className="w-full pl-9 glass-input text-sm"
            autoComplete="off"
            spellCheck={false}
            aria-label="Código de verificación o PIN manual"
          />
        </div>
        <p className="mt-2 text-[11px] text-gray-500 text-center">
          Aparece debajo del QR en el perfil del estudiante.
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
