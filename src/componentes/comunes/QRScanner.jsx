/**
 * @file QRScanner.jsx
 * Componente lector de código QR usando html5-qrcode con fallback seguro.
 * - Soporta cámara trasera (environment) y frontal (user)
 * - Manejo de permisos y errores de cámara
 * - Fallback a entrada manual si no hay cámara
 * - Accesible: aria-labels, estados de carga, mensajes de error claros
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
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const containerRef = useRef(null);

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && scanning) {
      try {
        await html5QrcodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.warn("Error deteniendo scanner:", err);
      }
    }
  }, [scanning]);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scanning) return;

    try {
      const html5Qrcode = new Html5Qrcode(containerRef.current.id);
      html5QrcodeRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode, torch: torchEnabled },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopScanner();
          onScan?.(decodedText);
        },
        (errorMessage) => {
          // Silenciar errores de escaneo continuo
        }
      );
      setScanning(true);
      setError("");
    } catch (err) {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
      onError?.(err);
    }
  }, [facingMode, torchEnabled, scanning, onScan, onError, stopScanner]);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
        setError("Permiso de cámara denegado. Usa la entrada manual.");
      }
    };
    checkPermission();
  }, [facingMode]);

  useEffect(() => {
    if (scanning) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [scanning, startScanner, stopScanner]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    stopScanner();
    setTimeout(() => setScanning(true), 100);
  };

  const toggleTorch = async () => {
    if (html5QrcodeRef.current && scanning) {
      try {
        await html5QrcodeRef.current.applyVideoConstraints({ advanced: [{ torch: !torchEnabled }] });
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

  if (!hasPermission && !showFallback) {
    return (
      <div className={`glass-card p-6 text-center ${className}`} role="alert">
        <Camera className="w-12 h-12 mx-auto text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Cámara no disponible</h3>
        <p className="text-gray-400 mb-4">{error || "No se pudo acceder a la cámara"}</p>
        <button onClick={onClose} className="btn-secondary">
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className={`glass-card overflow-hidden ${className}`} role="region" aria-label="Escáner QR">
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
          {showFallback && (
            <button
              onClick={() => setScanning(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar cámara
            </button>
          )}
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
            aria-label={facingMode === "environment" ? "Cambiar a cámara frontal" : "Cambiar a cámara trasera"}
          >
            <RotateCcw className="w-4 h-4" />
            Cambiar cámara
          </button>
          <button
            onClick={toggleTorch}
            disabled={!scanning || facingMode === "user"}
            className={`btn-secondary flex items-center gap-2 ${torchEnabled ? "bg-[var(--color-neon)]/20 border-[var(--color-neon)]" : ""}`}
            aria-label={torchEnabled ? "Apagar linterna" : "Encender linterna"}
            aria-pressed={torchEnabled}
          >
            <Zap className="w-4 h-4" />
            {torchEnabled ? "Apagar luz" : "Encender luz"}
          </button>
        </div>
      )}

      {!scanning && showFallback && (
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
    </div>
  );
};

export default QRScanner;