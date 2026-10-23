import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
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
  mensajeErrorReservas,
} from "../servicios/servicioReservas";

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
        const datos = await listarMisAlquileres(usuarioId);
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
  }, [usuarioId, revision]);

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

                  {reserva.codigoDevolucion ? (
                    <div className="mt-5 rounded-xl border border-[var(--color-border-hover)] bg-[var(--color-canvas)] p-4">
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[var(--color-neon)]" />
                        Código para confirmar la devolución
                      </p>
                      <p
                        className="mt-2 font-mono text-3xl tracking-[0.4em] text-white"
                        aria-label={`Código de devolución ${reserva.codigoDevolucion}`}
                      >
                        {reserva.codigoDevolucion}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Muéstraselo al propietario cuando devuelvas el artículo.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      {reserva.pago?.estado === "COMPLETADO"
                        ? "Esta reserva no tiene un código de devolución guardado."
                        : "El código estará disponible cuando el pago quede confirmado."}
                    </p>
                  )}
                  {reserva.estado === "COMPLETADO" && (
                    <p className="mt-3 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Devolución confirmada
                    </p>
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
