import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Clock,
  KeyRound,
  Loader2,
  Package,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexto/ContextoAutenticacion";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import {
  listarMisAlquileres,
  crearCalificacion,
  mensajeErrorReservas,
  pagarMora,
} from "../servicios/servicioReservas";
import {
  generarClaveIdempotencia,
  mensajeErrorPagos,
  procesarCheckout,
} from "../servicios/servicioPagos";
import { QRCodeSVG } from "qrcode.react";
import { formatCurrency } from "../utils/formatters";
import { FormularioCalificacion } from "../componentes/reservas/FormularioCalificacion";

const ESTADOS_RESERVA = {
  PENDIENTE_ENTREGA: "Pendiente de entrega",
  ACTIVO: "En curso",
  PENDIENTE_DEVOLUCION: "Pendiente de devolución",
  EN_MORA: "En mora",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
};

const formatoFecha = (fecha) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));

export const PaginaMisAlquileres = () => {
  const { usuario } = useAuth();
  const usuarioId = usuario?.id;
  const [reservas, setReservas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [revision, setRevision] = React.useState(0);
  const [pagandoMoraId, setPagandoMoraId] = React.useState(null);
  const [pagandoReservaId, setPagandoReservaId] = React.useState(null);
  const [reservaSinSaldoId, setReservaSinSaldoId] = React.useState(null);
  const [aviso, setAviso] = React.useState("");
  const [rol, setRol] = React.useState("ARRENDATARIO");

  const handlePagarMora = async (alquilerId) => {
    if (!usuarioId || pagandoMoraId) return;
    setPagandoMoraId(alquilerId);
    setAviso("");
    setError("");
    try {
      const resultado = await pagarMora(usuarioId, alquilerId);
      setAviso(resultado.mensaje);
      setRevision((anterior) => anterior + 1);
    } catch (err) {
      setError(
        mensajeErrorReservas(err, "No se pudo pagar el recargo por mora."),
      );
    } finally {
      setPagandoMoraId(null);
    }
  };

  const handleCompletarPago = async (alquilerId) => {
    if (!usuarioId || pagandoReservaId) return;
    setPagandoReservaId(alquilerId);
    setReservaSinSaldoId(null);
    setAviso("");
    setError("");
    try {
      const resultado = await procesarCheckout(
        usuarioId,
        { alquilerId },
        generarClaveIdempotencia(),
      );
      if (!resultado?.exito) {
        throw new Error(resultado?.mensaje || "No se pudo completar el pago.");
      }
      setAviso(
        "Pago completado. Ya puedes consultar los códigos de entrega y devolución.",
      );
      setRevision((anterior) => anterior + 1);
    } catch (err) {
      setError(mensajeErrorPagos(err, "No se pudo completar el pago."));
      if (err?.response?.data?.codigo === "SALDO_INSUFICIENTE") {
        setReservaSinSaldoId(alquilerId);
      }
    } finally {
      setPagandoReservaId(null);
    }
  };

  const handleCalificar = async (alquilerId, calificacion) => {
    if (!usuarioId) return;
    try {
      await crearCalificacion(usuarioId, alquilerId, calificacion);
      setAviso(
        "Tu calificación fue guardada. Gracias por compartir tu experiencia.",
      );
      setRevision((anterior) => anterior + 1);
    } catch (err) {
      throw new Error(
        mensajeErrorReservas(err, "No se pudo guardar la calificación."),
        { cause: err },
      );
    }
  };

  React.useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      if (!usuarioId) {
        setError("Inicia sesión para ver tus alquileres.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const datos = await listarMisAlquileres(usuarioId, rol);
        if (!cancelado) setReservas(Array.isArray(datos) ? datos : []);
      } catch (err) {
        if (!cancelado) {
          setError(
            mensajeErrorReservas(err, "No se pudieron cargar tus alquileres."),
          );
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, [usuarioId, revision, rol]);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-gray-100">
      <NavegacionLateral />
      <main className="transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
        <div className="page-container">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Mis Alquileres</h1>
              <p className="text-gray-400 mt-1">
                Consulta tus reservas y vuelve a ver el código para devolver
                cada artículo.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Explorar artículos
            </Link>
          </div>

          <div
            className="mb-6 inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
            aria-label="Filtrar alquileres por participación"
          >
            {[
              { valor: "ARRENDATARIO", etiqueta: "Como arrendatario" },
              { valor: "PROPIETARIO", etiqueta: "Como propietario" },
            ].map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setRol(opcion.valor)}
                aria-pressed={rol === opcion.valor}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  rol === opcion.valor
                    ? "bg-[var(--color-neon)] text-slate-950"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setRevision((anterior) => anterior + 1)}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          )}
          {aviso && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
            >
              {aviso}
            </div>
          )}

          {loading ? (
            <div className="glass-panel p-12 text-center">
              <Loader2 className="w-10 h-10 text-[var(--color-neon)] mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Cargando tus alquileres...</p>
            </div>
          ) : reservas.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <Package className="w-14 h-14 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Aún no tienes alquileres
              </h2>
              <p className="text-gray-400 mb-6">
                Cuando reserves un artículo, podrás consultar aquí su código de
                devolución.
              </p>
              <Link
                to="/catalogo"
                className="btn-primary inline-flex items-center gap-2"
              >
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reservas.map((reserva) => (
                <article key={reserva.id} className="glass-card p-5">
                  <div className="flex gap-4">
                    {reserva.articulo?.imagenes?.[0] ? (
                      <img
                        src={reserva.articulo.imagenes[0]}
                        alt={reserva.articulo.titulo}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-[var(--color-canvas)] flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-semibold text-white truncate">
                          {reserva.articulo?.titulo || "Artículo"}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            reserva.estado === "COMPLETADO"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {ESTADOS_RESERVA[reserva.estado] || reserva.estado}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--color-neon)]" />
                        {formatoFecha(reserva.inicio)} –{" "}
                        {formatoFecha(reserva.fin)}
                      </p>
                    </div>
                  </div>

                  {reserva.pago?.estado === "COMPLETADO" && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          label: "Entrega",
                          pin: reserva.codigoEntrega,
                          qr: reserva.codigoQrEntrega,
                          confirmado: reserva.estado !== "PENDIENTE_ENTREGA",
                        },
                        {
                          label: "Devolución",
                          pin: reserva.codigoDevolucion,
                          qr: reserva.codigoQrDevolucion,
                          confirmado: reserva.estado === "COMPLETADO",
                        },
                      ].map((codigo) => (
                        <div
                          key={codigo.label}
                          className="rounded-xl border border-[var(--color-border-hover)] bg-[var(--color-canvas)] p-4"
                        >
                          <p className="text-xs text-gray-400 flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-[var(--color-neon)]" />
                            Código PIN de {codigo.label.toLowerCase()}
                            {codigo.confirmado && " · Validado"}
                          </p>
                          <p className="mt-2 font-mono text-3xl tracking-[0.4em] text-white">
                            {codigo.pin || "----"}
                          </p>
                          {codigo.qr && (
                            <div className="mt-3 inline-block rounded-lg bg-white p-2">
                              <QRCodeSVG
                                value={codigo.qr}
                                size={120}
                                level="M"
                              />
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {codigo.confirmado
                              ? "Este paso ya se certificó presencialmente."
                              : "Muéstrale el QR o PIN al propietario en persona."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {reserva.estado !== "CANCELADO" &&
                    reserva.pago?.estado !== "COMPLETADO" && (
                      <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                        <p className="text-sm text-amber-200">
                          El pago de esta reserva no se ha completado. Los
                          códigos aparecerán cuando el pago sea aprobado.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleCompletarPago(reserva.id)}
                          disabled={Boolean(pagandoReservaId)}
                          className="btn-primary mt-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {pagandoReservaId === reserva.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          {pagandoReservaId === reserva.id
                            ? "Procesando pago..."
                            : "Completar pago y ver códigos"}
                        </button>
                        {reservaSinSaldoId === reserva.id && (
                          <Link
                            to="/billetera"
                            className="ml-3 inline-block text-sm text-[var(--color-neon)] hover:underline"
                          >
                            Recargar billetera
                          </Link>
                        )}
                      </div>
                    )}
                  {reserva.moraMonto > 0 && (
                    <div
                      className={`mt-4 rounded-xl border p-4 ${
                        reserva.moraPendiente > 0
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-emerald-500/40 bg-emerald-500/10"
                      }`}
                    >
                      <p className="font-semibold text-white">
                        Recargo por mora: {formatCurrency(reserva.moraMonto)}
                      </p>
                      <p className="text-sm text-gray-300 mt-1">
                        Pendiente: {formatCurrency(reserva.moraPendiente)}
                      </p>
                      {reserva.moraPendiente > 0 &&
                        reserva.estado === "COMPLETADO" && (
                          <button
                            type="button"
                            onClick={() => handlePagarMora(reserva.id)}
                            disabled={Boolean(pagandoMoraId)}
                            className="btn-primary mt-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {pagandoMoraId === reserva.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                            {pagandoMoraId === reserva.id
                              ? "Procesando..."
                              : "Pagar recargo"}
                          </button>
                        )}
                    </div>
                  )}
                  {reserva.estado === "COMPLETADO" && (
                    <p className="mt-3 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Devolución confirmada
                    </p>
                  )}
                  {reserva.estado === "COMPLETADO" &&
                    reserva.usuarioCalificado && (
                      <FormularioCalificacion
                        calificacion={reserva.calificacionPropia}
                        nombreUsuario={reserva.usuarioCalificado.nombre}
                        promedio={reserva.usuarioCalificado.calificacion}
                        totalResenas={reserva.usuarioCalificado.totalResenas}
                        onSubmit={(calificacion) =>
                          handleCalificar(reserva.id, calificacion)
                        }
                      />
                    )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaginaMisAlquileres;
