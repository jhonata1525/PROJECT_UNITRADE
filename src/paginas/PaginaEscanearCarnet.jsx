/**
 * @file PaginaEscanearCarnet.jsx
 * Escáner interno de carnets: un estudiante escanea el QR de otro y el
 * backend de UniTrade devuelve el veredicto. El escáner solo es el operador;
 * la validación real siempre la hace el sistema.
 */

import React from "react";
import axios from "axios";
import { Camera, Image as ImageIcon, QrCode, RotateCcw, Search } from "lucide-react";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import { verificarCarnet } from "../servicios/servicioCarnet";
import ResultadoVerificacionCarnet, {
  EstadoCargandoCarnet,
} from "../componentes/carnet/ResultadoVerificacionCarnet";

const QRScanner = React.lazy(
  () => import("../componentes/comunes/QRScanner"),
);

const EXTRAER_TOKEN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const MAX_LADO_REGION = 2600;
const MAX_REGIONES = 8;

const cargarImagen = (url) =>
  new Promise((resolve, reject) => {
    const imagen = new globalThis.Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () =>
      reject(new Error("El navegador no pudo abrir la imagen"));
    imagen.src = url;
  });

/**
 * Recorta una región de la foto y la decodifica con jsQR.
 * Las capturas de página completa son muy alargadas: si se reducen enteras,
 * el QR queda demasiado pequeño. Por eso se escanean por regiones.
 */
const leerRegion = (jsQR, imagen, sx, sy, sw, sh) => {
  if (sw <= 0 || sh <= 0) return null;

  const escala = Math.min(1, MAX_LADO_REGION / Math.max(sw, sh));
  const ancho = Math.max(1, Math.round(sw * escala));
  const alto = Math.max(1, Math.round(sh * escala));
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const contexto = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexto) return null;

  contexto.drawImage(imagen, sx, sy, sw, sh, 0, 0, ancho, alto);
  const { data } = contexto.getImageData(0, 0, ancho, alto);
  const resultado = jsQR(data, ancho, alto, {
    inversionAttempts: "attemptBoth",
  });

  // Liberar memoria en celulares antes de probar la siguiente región.
  canvas.width = 0;
  canvas.height = 0;

  return resultado?.data ?? null;
};

const construirRegiones = (ancho, alto) => {
  const regiones = [[0, 0, ancho, alto]];
  const aspecto = ancho / alto;
  const agregar = (region) => {
    if (regiones.length < MAX_REGIONES) regiones.push(region);
  };

  if (aspecto < 0.72) {
    // Captura de página completa: bandas horizontales con solape.
    const altoBanda = Math.round(ancho * 1.2);
    const solape = Math.round(altoBanda * 0.2);
    const paso = Math.max(1, altoBanda - solape);

    for (let y = 0; y < alto && regiones.length < MAX_REGIONES; y += paso) {
      agregar([0, y, ancho, Math.min(altoBanda, alto - y)]);
      if (y + altoBanda >= alto) break;
    }
  } else if (aspecto > 1.4) {
    // Captura muy ancha: bandas verticales con solape.
    const anchoBanda = Math.round(alto * 1.2);
    const solape = Math.round(anchoBanda * 0.2);
    const paso = Math.max(1, anchoBanda - solape);

    for (let x = 0; x < ancho && regiones.length < MAX_REGIONES; x += paso) {
      agregar([x, 0, Math.min(anchoBanda, ancho - x), alto]);
      if (x + anchoBanda >= ancho) break;
    }
  } else {
    // Foto normal: cuadrantes con solape y un recorte central.
    const mitadAncho = Math.round(ancho / 2);
    const mitadAlto = Math.round(alto / 2);
    const solapeX = Math.round(ancho * 0.12);
    const solapeY = Math.round(alto * 0.12);

    agregar([0, 0, mitadAncho + solapeX, mitadAlto + solapeY]);
    agregar([mitadAncho - solapeX, 0, mitadAncho + solapeX, mitadAlto + solapeY]);
    agregar([0, mitadAlto - solapeY, mitadAncho + solapeX, mitadAlto + solapeY]);
    agregar([
      mitadAncho - solapeX,
      mitadAlto - solapeY,
      mitadAncho + solapeX,
      mitadAlto + solapeY,
    ]);
    agregar([
      Math.round(ancho * 0.2),
      Math.round(alto * 0.2),
      Math.round(ancho * 0.6),
      Math.round(alto * 0.6),
    ]);
  }

  return regiones;
};

/** Intento nativo (rápido) en navegadores que soportan BarcodeDetector. */
const decodificarConBarcodeDetector = async (archivo) => {
  const Detector = globalThis.BarcodeDetector;

  if (
    typeof Detector !== "function" ||
    typeof globalThis.createImageBitmap !== "function"
  ) {
    return null;
  }

  let bitmap = null;

  try {
    bitmap = await globalThis.createImageBitmap(archivo);
    const detector = new Detector({ formats: ["qr_code"] });
    const codigos = await detector.detect(bitmap);
    return codigos?.[0]?.rawValue ?? null;
  } catch {
    return null;
  } finally {
    bitmap?.close?.();
  }
};

/** Decodifica el QR de una foto o captura con jsQR, por regiones. */
const decodificarQrDeImagen = async (archivo) => {
  const { default: jsQR } = await import("jsqr");
  const url = URL.createObjectURL(archivo);

  try {
    const imagen = await cargarImagen(url);
    const anchoOriginal = imagen.naturalWidth || imagen.width;
    const altoOriginal = imagen.naturalHeight || imagen.height;

    if (!anchoOriginal || !altoOriginal) return null;

    for (const region of construirRegiones(anchoOriginal, altoOriginal)) {
      const codigo = leerRegion(jsQR, imagen, ...region);
      if (codigo) return codigo;
    }

    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Último intento con el lector de html5-qrcode (ZXing). */
const decodificarQrConLector = async (archivo) => {
  const { Html5Qrcode } = await import("html5-qrcode");
  const lector = new Html5Qrcode("lector-qr-imagen");

  try {
    return await lector.scanFile(archivo, false);
  } finally {
    lector.clear();
  }
};

const decodificarQrDeArchivo = async (archivo) => {
  const nativo = await decodificarConBarcodeDetector(archivo);
  if (nativo) return nativo;

  let jsqr = null;

  try {
    jsqr = await decodificarQrDeImagen(archivo);
  } catch (fallo) {
    console.warn("No se pudo decodificar con jsQR:", fallo);
  }

  if (jsqr) return jsqr;

  return decodificarQrConLector(archivo);
};

/**
 * Acepta el token pegado directamente o la URL completa del QR.
 * @param {string} texto Contenido escaneado o pegado
 */
const extraerToken = (texto) => {
  const limpio = String(texto ?? "").trim();
  if (!limpio) return null;

  const coincidencia = limpio.match(EXTRAER_TOKEN);
  return coincidencia ? coincidencia[0] : null;
};

export default function PaginaEscanearCarnet() {
  const [texto, setTexto] = React.useState("");
  const [resultado, setResultado] = React.useState(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState("");
  const [escanerAbierto, setEscanerAbierto] = React.useState(false);
  const [leyendoFoto, setLeyendoFoto] = React.useState(false);
  const [vistaPrevia, setVistaPrevia] = React.useState("");
  const inputFotoRef = React.useRef(null);
  const urlPreviaRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (urlPreviaRef.current) URL.revokeObjectURL(urlPreviaRef.current);
    };
  }, []);

  const puedeUsarCamara =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    Boolean(globalThis.navigator?.mediaDevices?.getUserMedia);

  const verificar = React.useCallback(async (valor) => {
    const token = extraerToken(valor);

    if (!token) {
      setResultado(null);
      setError(
        "Ese código no corresponde a un carnet de UniTrade. Usa el enlace del QR o el código de verificación largo que aparece debajo del QR en el perfil (no el código estudiantil).",
      );
      return;
    }

    setEscanerAbierto(false);
    setError("");
    setResultado(null);
    setCargando(true);

    try {
      const data = await verificarCarnet(token);
      setResultado(data);
    } catch (fallo) {
      if (axios.isAxiosError(fallo) && fallo.response?.status === 404) {
        const data = fallo.response.data ?? {};
        setResultado({
          valido: false,
          motivos: [data.motivo || "CARNET_NO_ENCONTRADO"],
          mensaje: data.mensaje,
          carnet: null,
        });
      } else {
        setError(
          axios.isAxiosError(fallo) && !fallo.response
            ? "No se pudo conectar con el servidor de UniTrade."
            : "Ocurrió un error al consultar el carnet. Intenta de nuevo.",
        );
      }
    } finally {
      setCargando(false);
    }
  }, []);

  const handleScan = React.useCallback(
    (codigo) => {
      verificar(codigo);
    },
    [verificar],
  );

  const handleErrorEscaner = React.useCallback(() => {
    setError(
      "No se pudo abrir la cámara. Revisa los permisos o usa el código manual.",
    );
  }, []);

  const handleCerrarEscaner = React.useCallback(() => {
    setEscanerAbierto(false);
  }, []);

  const handleFoto = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!archivo) return;

    if (urlPreviaRef.current) URL.revokeObjectURL(urlPreviaRef.current);
    const urlPrevia = URL.createObjectURL(archivo);
    urlPreviaRef.current = urlPrevia;
    setVistaPrevia(urlPrevia);

    setError("");
    setLeyendoFoto(true);

    try {
      let codigo = null;

      try {
        codigo = await decodificarQrDeArchivo(archivo);
      } catch (fallo) {
        console.warn("No se pudo decodificar el QR:", fallo);
      }

      if (!codigo) {
        setError(
          "No se pudo leer el QR. Asegúrate de que se vea completo, nítido y sin reflejos. Si es una foto de iPhone, prueba con una captura de pantalla o pega el enlace que aparece debajo del QR en el perfil.",
        );
        return;
      }

      await verificar(codigo);
    } finally {
      setLeyendoFoto(false);
    }
  };

  const handleSubmit = (evento) => {
    evento.preventDefault();
    if (!texto.trim()) {
      setError("Pega el enlace o el código del carnet.");
      return;
    }
    verificar(texto);
  };

  const reiniciar = () => {
    setTexto("");
    setResultado(null);
    setError("");
    setVistaPrevia("");
    if (urlPreviaRef.current) {
      URL.revokeObjectURL(urlPreviaRef.current);
      urlPreviaRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-gray-100">
      <NavegacionLateral onLogout={() => {}} onProfileClick={() => {}} />

      <main className="transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
        <div className="page-container max-w-2xl">
          <header className="mb-6 animate-slide-up">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-7 h-7 text-[var(--color-neon)]" />
              Verificar carnet
            </h1>
            <p className="text-gray-400 mt-1">
              Escanea el QR de otro estudiante para confirmar que su cuenta está
              activa en UniTrade.
            </p>
          </header>

          <section className="glass-card p-5 animate-slide-up">
            {escanerAbierto ? (
              <React.Suspense
                fallback={
                  <p className="text-sm text-gray-400">Cargando escáner...</p>
                }
              >
                <QRScanner
                  onScan={handleScan}
                  onClose={handleCerrarEscaner}
                  onError={handleErrorEscaner}
                />
              </React.Suspense>
            ) : puedeUsarCamara ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setEscanerAbierto(true);
                }}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Escanear QR con cámara
              </button>
            ) : (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                La cámara del navegador solo funciona en HTTPS o localhost. En
                la red local usa la foto del QR o pega el enlace.
              </p>
            )}

            {!escanerAbierto && (
              <>
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFoto}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={leyendoFoto || cargando}
                  className={`w-full mt-2 flex items-center justify-center gap-2 ${
                    puedeUsarCamara ? "btn-secondary" : "btn-primary"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  {leyendoFoto ? "Leyendo foto..." : "Tomar o subir foto del QR"}
                </button>
                {!puedeUsarCamara && (
                  <p className="text-[11px] text-gray-500">
                    Si el QR está en este mismo celular, guarda una captura de
                    pantalla y súbela aquí.
                  </p>
                )}
                {vistaPrevia && (
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <img
                      src={vistaPrevia}
                      alt="QR seleccionado"
                      className="max-h-44 w-auto rounded-lg border border-[var(--color-border)] object-contain"
                    />
                    <p className="text-[11px] text-gray-500">
                      Foto seleccionada
                    </p>
                  </div>
                )}
                <div
                  id="lector-qr-imagen"
                  className="fixed -left-[9999px] top-0"
                  aria-hidden="true"
                />
              </>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-2">
              <label
                htmlFor="codigo-carnet"
                className="block text-sm font-medium text-gray-300"
              >
                O pega el enlace o el código de verificación
              </label>
              <p className="text-[11px] text-gray-500">
                Aparece debajo del QR en el perfil del estudiante.
              </p>
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="codigo-carnet"
                  type="text"
                  value={texto}
                  onChange={(evento) => setTexto(evento.target.value)}
                  placeholder="Enlace del QR o código de verificación"
                  className="glass-input pl-9"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Verificar código
              </button>
            </form>

            {error && (
              <p
                className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2"
                role="alert"
              >
                <QrCode className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </p>
            )}
          </section>

          {cargando && (
            <section className="glass-card p-6 mt-4">
              <EstadoCargandoCarnet />
            </section>
          )}

          {!cargando && resultado && (
            <section className="glass-card p-6 mt-4 animate-fade-in">
              <ResultadoVerificacionCarnet resultado={resultado} />
              <button
                type="button"
                onClick={reiniciar}
                className="btn-secondary w-full mt-4 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Escanear otro carnet
              </button>
            </section>
          )}

          <p className="mt-4 text-center text-xs text-gray-500">
            El escaneo confirma identidad y estado de cuenta. No autoriza pagos,
            entregas ni cambios en el perfil. La inscripción oficial solo puede
            certificarla la universidad.
          </p>
        </div>
      </main>
    </div>
  );
}
