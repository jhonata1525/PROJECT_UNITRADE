import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  HelpCircle,
  Package,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../../contexto/ContextoAutenticacion";

const VERSION_ONBOARDING = "v1";

/**
 * Contenido de la bienvenida. Cada diapositiva explica una parte de UniTrade
 * con lenguaje sencillo para un estudiante que entra por primera vez.
 */
const DIAPOSITIVAS = [
  {
    icono: Sparkles,
    etiqueta: "Bienvenido",
    titulo: "Tu campus, tus cosas, tu dinero",
    descripcion:
      "UniTrade es la plataforma de alquiler de tu universidad. Compra horas de uso, publica lo que no usas y cobra sin efectivo.",
    puntos: [
      "Solo para correos @unisimon.edu.co",
      "Pagos protegidos con billetera virtual",
      "Entregas verificadas con QR y PIN",
    ],
  },
  {
    icono: Compass,
    etiqueta: "Alquilar",
    titulo: "¿Necesitas algo? Alquílalo en 3 pasos",
    descripcion:
      "Encuentra artículos cerca de ti y paga solo por las horas que los necesites.",
    puntos: [
      "1. Explora el catálogo y filtra por categoría",
      "2. Reserva por horas y paga desde tu billetera",
      "3. Muéstrale tu QR o PIN al propietario al recibir",
    ],
  },
  {
    icono: Package,
    etiqueta: "Publicar",
    titulo: "¿Tienes algo sin usar? Publícalo y gana",
    descripcion:
      "Convierte tus libros, calculadoras o equipos en ingresos mientras no los usas.",
    puntos: [
      "Publica con fotos, precio por hora y estado",
      "Confirma la entrega escaneando el QR del arrendatario",
      "Recibe el dinero en tu billetera (comisión del 12%)",
    ],
  },
  {
    icono: ShieldCheck,
    etiqueta: "Confianza",
    titulo: "Todo bajo control y seguro",
    descripcion:
      "Tu identidad y tus entregas quedan protegidas dentro de la comunidad universitaria.",
    puntos: [
      "Carnet digital con QR verificable",
      "Calificaciones después de cada alquiler",
      "Historial de pagos, saldo y retiros en un solo lugar",
    ],
  },
];

const PASOS_TOUR = [
  {
    clave: "catalogo",
    titulo: "Explora el catálogo",
    texto:
      "Aquí ves todo lo que otros estudiantes ofrecen. Filtra por categoría y abre un artículo para reservarlo por horas.",
  },
  {
    clave: "dashboard",
    titulo: "Tu panel de control",
    texto:
      "Resumen de tu saldo, tus artículos, tu calificación y los próximos pasos recomendados.",
  },
  {
    clave: "mis-articulos",
    titulo: "Publica y entrega",
    texto:
      "Publica lo que no usas y confirma entregas o devoluciones con el PIN o el QR del arrendatario.",
  },
  {
    clave: "mis-alquileres",
    titulo: "Tus alquileres",
    texto:
      "Consulta tus reservas. Si alquilas, aquí ves el PIN y el QR que debes mostrar al propietario.",
  },
  {
    clave: "billetera",
    titulo: "Tu billetera",
    texto:
      "Revisa tu saldo, recarga, mira tus movimientos y solicita retiros a Nequi, Daviplata o banco.",
  },
  {
    clave: "pago",
    titulo: "Pagos y comprobantes",
    texto:
      "Historial y estado de cada pago que hagas o recibas dentro de UniTrade.",
  },
  {
    clave: "escanear-carnet",
    titulo: "Verifica carnets",
    texto:
      "Escanea el QR del carnet de otro estudiante para confirmar que pertenece a la comunidad UniTrade.",
  },
  {
    clave: "perfil",
    titulo: "Completa tu perfil",
    texto:
      "Define tu sede, punto de entrega y horarios. Un perfil completo genera más confianza al alquilar.",
  },
];

const IconoDiapositiva = ({ icono: Icono }) => (
  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center shadow-lg shadow-blue-500/20">
    <Icono className="w-7 h-7 text-white" />
  </div>
);

const PuntosProgreso = ({ total, actual }) => (
  <div className="flex items-center gap-1.5" aria-hidden="true">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={`h-1.5 rounded-full transition-all ${
          i === actual
            ? "w-6 bg-[var(--color-neon)]"
            : "w-1.5 bg-white/25"
        }`}
      />
    ))}
  </div>
);

export const OnboardingEstudiante = () => {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [fase, setFase] = React.useState("cerrado");
  const [indice, setIndice] = React.useState(0);
  const [rectObjetivo, setRectObjetivo] = React.useState(null);

  const claveAlmacen = usuario?.id
    ? `unitrade_onboarding_${VERSION_ONBOARDING}_${usuario.id}`
    : null;
  const esRutaPublica =
    location.pathname === "/login" ||
    location.pathname === "/registro" ||
    location.pathname.startsWith("/verificar");

  const marcarComoVisto = React.useCallback(() => {
    if (claveAlmacen) {
      localStorage.setItem(claveAlmacen, "1");
    }
  }, [claveAlmacen]);

  const cerrar = React.useCallback(() => {
    marcarComoVisto();
    setFase("cerrado");
  }, [marcarComoVisto]);

  const empezarTour = React.useCallback(() => {
    marcarComoVisto();
    setIndice(0);
    setFase("tour");
  }, [marcarComoVisto]);

  const abrirAyuda = () => {
    setIndice(0);
    setFase("bienvenida");
  };

  // Permite abrir la guía desde cualquier pantalla (por ejemplo, el Dashboard).
  React.useEffect(() => {
    const abrir = () => {
      setIndice(0);
      setFase("bienvenida");
    };
    window.addEventListener("unitrade:abrir-onboarding", abrir);
    return () =>
      window.removeEventListener("unitrade:abrir-onboarding", abrir);
  }, []);

  // Se muestra automáticamente la primera vez que el usuario inicia sesión.
  React.useEffect(() => {
    if (!claveAlmacen || esRutaPublica) {
      setFase("cerrado");
      return;
    }
    const yaVisto = localStorage.getItem(claveAlmacen);
    if (!yaVisto) {
      setIndice(0);
      setFase("bienvenida");
    }
  }, [claveAlmacen, esRutaPublica]);

  // Bloquea el scroll de la página mientras el onboarding está abierto.
  React.useEffect(() => {
    if (fase === "cerrado") return undefined;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [fase]);

  const total = fase === "tour" ? PASOS_TOUR.length : DIAPOSITIVAS.length;

  const avanzar = React.useCallback(() => {
    if (fase === "bienvenida") {
      if (indice < DIAPOSITIVAS.length - 1) {
        setIndice((actual) => actual + 1);
      } else {
        empezarTour();
      }
      return;
    }
    if (fase === "tour") {
      if (indice < PASOS_TOUR.length - 1) {
        setIndice((actual) => actual + 1);
      } else {
        marcarComoVisto();
        setFase("cerrado");
        navigate("/catalogo");
      }
    }
  }, [fase, indice, empezarTour, marcarComoVisto, navigate]);

  const retroceder = React.useCallback(() => {
    setIndice((actual) => Math.max(0, actual - 1));
  }, []);

  // Atajos de teclado para que el recorrido sea ágil.
  React.useEffect(() => {
    if (fase === "cerrado") return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") cerrar();
      if (evento.key === "ArrowRight") avanzar();
      if (evento.key === "ArrowLeft") retroceder();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [fase, avanzar, retroceder, cerrar]);

  // Localiza el elemento del menú que ilumina cada paso del tour.
  React.useLayoutEffect(() => {
    if (fase !== "tour") {
      setRectObjetivo(null);
      return undefined;
    }

    const actualizar = () => {
      const selector = `[data-tour="${PASOS_TOUR[indice]?.clave}"]`;
      const candidatos = Array.from(document.querySelectorAll(selector));
      const visible = candidatos.find((elemento) => {
        const r = elemento.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });

      if (!visible) {
        setRectObjetivo(null);
        return;
      }

      visible.scrollIntoView({ block: "nearest", inline: "nearest" });
      const r = visible.getBoundingClientRect();
      setRectObjetivo({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };

    const frame = window.requestAnimationFrame(actualizar);
    window.addEventListener("resize", actualizar);
    window.addEventListener("scroll", actualizar, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", actualizar);
      window.removeEventListener("scroll", actualizar, true);
    };
  }, [fase, indice]);

  if (!usuario || esRutaPublica) {
    return null;
  }

  const posicionTarjeta = (() => {
    if (!rectObjetivo) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    // El menú lateral está a la izquierda: mostramos la tarjeta a su derecha.
    if (rectObjetivo.left < 120) {
      return {
        top: Math.max(
          16,
          Math.min(rectObjetivo.top - 12, window.innerHeight - 300),
        ),
        left: rectObjetivo.left + rectObjetivo.width + 16,
      };
    }
    // En móvil el menú está abajo: mostramos la tarjeta encima.
    return {
      bottom: 96,
      left: "50%",
      transform: "translateX(-50%)",
    };
  })();

  return (
    <>
      {fase === "cerrado" && (
        <button
          type="button"
          onClick={abrirAyuda}
          className="group fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[60] flex items-center gap-2 rounded-full border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-3 py-3 text-white shadow-xl shadow-black/40 transition hover:border-[var(--color-neon)] hover:bg-[rgba(59,130,246,0.15)]"
          aria-label="¿Cómo funciona UniTrade? Abrir guía"
          title="¿Cómo funciona? Ver guía"
        >
          <HelpCircle className="w-5 h-5 text-[var(--color-neon)]" />
          <span className="hidden lg:block max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap transition-all group-hover:max-w-[140px] group-focus-visible:max-w-[140px]">
            ¿Cómo funciona?
          </span>
        </button>
      )}

      {fase !== "cerrado" && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Guía de bienvenida de UniTrade"
        >
          <div
            className={`absolute inset-0 transition-colors ${
              fase === "bienvenida"
                ? "bg-black/80 backdrop-blur-sm"
                : rectObjetivo
                  ? "bg-transparent"
                  : "bg-black/70"
            }`}
            onClick={fase === "bienvenida" ? cerrar : undefined}
            aria-hidden="true"
          />

          {fase === "tour" && rectObjetivo && (
            <div
              className="pointer-events-none fixed rounded-xl border-2 border-[var(--color-neon)] shadow-[0_0_0_9999px_rgba(0,0,0,0.78)] transition-all duration-200"
              style={{
                top: rectObjetivo.top - 6,
                left: rectObjetivo.left - 6,
                width: rectObjetivo.width + 12,
                height: rectObjetivo.height + 12,
              }}
              aria-hidden="true"
            />
          )}

          {fase === "bienvenida" ? (
            <div className="relative z-10 glass-panel w-full max-w-2xl overflow-hidden animate-slide-up">
              <button
                type="button"
                onClick={cerrar}
                className="absolute right-4 top-4 z-20 rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar guía"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-[var(--color-border)] bg-gradient-to-br from-[var(--color-accent-500)]/25 to-[var(--color-neon)]/10 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <IconoDiapositiva icono={DIAPOSITIVAS[indice].icono} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-neon)]">
                      {DIAPOSITIVAS[indice].etiqueta} ·{" "}
                      {indice + 1}/{DIAPOSITIVAS.length}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-white">
                      {DIAPOSITIVAS[indice].titulo}
                    </h2>
                    <p className="mt-2 text-sm text-gray-300">
                      {DIAPOSITIVAS[indice].descripcion}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <ul className="space-y-3">
                  {DIAPOSITIVAS[indice].puntos.map((punto) => (
                    <li
                      key={punto}
                      className="flex items-start gap-3 text-sm text-gray-200"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                      <span>{punto}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <PuntosProgreso
                    total={DIAPOSITIVAS.length}
                    actual={indice}
                  />
                  <div className="flex items-center gap-2">
                    {indice > 0 && (
                      <button
                        type="button"
                        onClick={retroceder}
                        className="btn-secondary inline-flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Anterior
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={avanzar}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      {indice === DIAPOSITIVAS.length - 1
                        ? "Hacer el tour"
                        : "Siguiente"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cerrar}
                  className="mt-4 text-sm text-gray-500 transition hover:text-gray-300"
                >
                  Explorar por mi cuenta
                </button>
              </div>
            </div>
          ) : (
            <div
              className="fixed z-10 w-[min(360px,calc(100vw-2rem))]"
              style={posicionTarjeta}
            >
              <div className="glass-panel overflow-hidden border-[var(--color-border-hover)] animate-slide-up">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-accent-500)]/20 to-[var(--color-neon)]/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-neon)]">
                    Tour · {indice + 1}/{PASOS_TOUR.length}
                  </p>
                  <button
                    type="button"
                    onClick={cerrar}
                    className="rounded-md p-1 text-gray-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Saltar tour"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-white">
                    {PASOS_TOUR[indice].titulo}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-300">
                    {PASOS_TOUR[indice].texto}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <PuntosProgreso
                      total={PASOS_TOUR.length}
                      actual={indice}
                    />
                    <div className="flex items-center gap-2">
                      {indice > 0 && (
                        <button
                          type="button"
                          onClick={retroceder}
                          className="btn-secondary !px-3 !py-2"
                          aria-label="Paso anterior"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={avanzar}
                        className="btn-primary !px-3 !py-2"
                      >
                        {indice === PASOS_TOUR.length - 1 ? (
                          <>
                            Explorar
                            <ArrowRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Siguiente
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OnboardingEstudiante;
