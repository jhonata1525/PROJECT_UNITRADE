/**
 * @file PaginaCatalogo.jsx
 * Catálogo público de artículos disponibles en UniTrade.
 * - Muestra artículos disponibles y en alquiler de la comunidad.
 * - Buscador y filtro por categoría.
 * - Cada tarjeta muestra foto, título, categoría, tarifa por hora, descripción
 *   y datos del propietario (nombre y sede).
 * - Botón "Reservar" que abre ModalReservaHoras para alquilar por horas.
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Image as ImageIcon,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Phone,
  Star,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../contexto/ContextoAutenticacion";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import { ModalReservaHoras } from "../componentes/articulos/ModalReservaHoras";
import { ArticuloCard } from "../componentes/articulos/ArticuloCard";
import {
  listarCatalogoArticulos,
  mensajeErrorArticulos,
} from "../servicios/servicioArticulos";
import {
  obtenerProximoHorario,
  resumenDisponibilidad,
} from "../utils/perfil";

const CATEGORIAS = [
  "Todas",
  "Libros",
  "Laboratorio",
  "Calculadoras",
  "Tecnología",
  "Deportes",
  "Otros",
];

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

export const PaginaCatalogo = () => {
  const { usuario } = useAuth();
  const [articulos, setArticulos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoriaFiltro, setCategoriaFiltro] = React.useState("Todas");
  const [aviso, setAviso] = React.useState(null);
  const [reservaAbierta, setReservaAbierta] = React.useState(false);
  const [articuloParaReserva, setArticuloParaReserva] = React.useState(null);
  const [articuloDetalle, setArticuloDetalle] = React.useState(null);

  const cargarCatalogo = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const datos = await listarCatalogoArticulos({ limite: 100 });
      setArticulos(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(
        mensajeErrorArticulos(
          err,
          "No se pudieron cargar los artículos disponibles. Intenta de nuevo."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let activo = true;

    listarCatalogoArticulos({ limite: 100 })
      .then((datos) => {
        if (activo) setArticulos(Array.isArray(datos) ? datos : []);
      })
      .catch((err) => {
        if (activo) {
          setError(
            mensajeErrorArticulos(
              err,
              "No se pudieron cargar los artículos disponibles. Intenta de nuevo."
            )
          );
        }
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Los artículos alquilados se muestran, pero no pueden reservarse otra vez.
  const disponibles = articulos.filter((art) => art.estado === "disponible");

  const articulosVisibles = articulos.filter((art) =>
    ["disponible", "en_alquiler"].includes(art.estado)
  );

  const articulosFiltrados = articulosVisibles.filter((art) => {
    const termino = searchTerm.trim().toLowerCase();
    const coincideBusqueda =
      !termino ||
      art.nombre?.toLowerCase().includes(termino) ||
      art.descripcion?.toLowerCase().includes(termino) ||
      art.propietario?.nombre?.toLowerCase().includes(termino);

    const coincideCategoria =
      categoriaFiltro === "Todas" || art.categoria === categoriaFiltro;

    return coincideBusqueda && coincideCategoria;
  });

  const abrirReserva = (articulo) => {
    setArticuloParaReserva(articulo);
    setReservaAbierta(true);
  };

  const cerrarReserva = () => {
    setReservaAbierta(false);
    setArticuloParaReserva(null);
  };

  const handleReservaExitosa = (reserva) => {
    setAviso({
      tipo: "exito",
      mensaje: `Pago aprobado en sandbox. Reserva creada con código de devolución ${reserva?.pin || "----"}.`,
    });
    cargarCatalogo();
  };

  return (
    <div className="min-h-screen text-gray-100">
      <NavegacionLateral />

      <main className="transition-all duration-300 content-sidebar min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
        <div className="page-container">
          {/* Header */}
          <div className="mb-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  <Compass className="w-7 h-7 text-[var(--color-neon)]" />
                  Explorar Artículos
                </h1>
                <p className="text-gray-400 mt-1">
                  Encuentra artículos de la comunidad y resérvalos por horas.
                </p>
              </div>
              <div className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2 self-start sm:self-auto">
                <Package className="w-5 h-5 text-[var(--color-neon)]" />
                <span className="text-sm text-gray-300">
                  Disponibles:{" "}
                  <span className="font-bold text-white">{disponibles.length}</span>
                </span>
              </div>
            </div>
          </div>

          {aviso && (
            <div
              role="alert"
              className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in ${
                aviso.tipo === "error"
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {aviso.tipo === "error" ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{aviso.mensaje}</span>
              <button
                type="button"
                onClick={() => setAviso(null)}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Cerrar mensaje"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={cargarCatalogo}
                className="btn-secondary text-xs py-2 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          )}

          {/* Buscador y filtros */}
          <div
            className="glass-panel p-4 mb-6 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o propietario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10"
                  style={{ paddingLeft: "2.75rem" }}
                  aria-label="Buscar artículos disponibles"
                />
              </div>
              <div className="relative">
                <Filter
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                />
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="glass-input pl-10 pr-10 bg-[var(--color-surface)] cursor-pointer appearance-none"
                  style={{ paddingLeft: "2.75rem" }}
                  aria-label="Filtrar por categoría"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Listado */}
          {loading ? (
            <>
              <p className="sr-only" role="status">
                Cargando artículos disponibles…
              </p>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                aria-hidden="true"
              >
                {Array.from({ length: 8 }).map((_, indice) => (
                  <div
                    key={indice}
                    className="glass-card p-0 overflow-hidden flex flex-col"
                  >
                    <div className="skeleton h-40 w-full" />
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-3 w-1/2 rounded" />
                      <div className="skeleton h-3 w-full rounded" />
                      <div className="skeleton h-3 w-5/6 rounded" />
                      <div className="skeleton h-16 w-full rounded-lg" />
                      <div className="skeleton h-8 w-full rounded-lg mt-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : articulosFiltrados.length === 0 ? (
            <div className="glass-panel p-12 text-center animate-fade-in">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {articulosVisibles.length === 0
                  ? "No hay artículos disponibles por ahora"
                  : "No hay resultados"}
              </h3>
              <p className="text-gray-400 mb-6">
                {articulosVisibles.length === 0
                  ? "Cuando otros estudiantes publiquen sus artículos, aparecerán aquí."
                  : "Intenta cambiar el término de búsqueda o la categoría."}
              </p>
              {articulosVisibles.length === 0 && (
                <Link
                  to="/mis-articulos"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Publicar un artículo
                </Link>
              )}
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in"
              role="list"
              aria-label="Artículos disponibles y en alquiler"
            >
              {articulosFiltrados.map((art) => (
                <ArticuloCard
                  key={art.id}
                  art={art}
                  usuario={usuario}
      esMio={art.propietario?.id === usuario?.id}
      onReserva={abrirReserva}
      onDetalle={setArticuloDetalle}
      onEditar={handleEditar}
      onCambiarEstado={handleCambiarEstado}
      onEliminar={handleEliminar}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ModalReservaHoras
        isOpen={reservaAbierta}
        onClose={cerrarReserva}
        articulo={articuloParaReserva}
        onReservaExitosa={handleReservaExitosa}
      />

      {articuloDetalle && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalle-articulo-titulo"
          onClick={() => setArticuloDetalle(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <section
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
              <h2 id="detalle-articulo-titulo" className="text-xl font-bold text-white">
                Detalle del artículo
              </h2>
              <button
                type="button"
                onClick={() => setArticuloDetalle(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
                aria-label="Cerrar detalle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {articuloDetalle.fotoUrl && (
                <img
                  src={articuloDetalle.fotoUrl}
                  alt={articuloDetalle.nombre}
                  className="h-52 w-full rounded-xl bg-[var(--color-canvas)] object-cover"
                />
              )}
              <div>
                <p className="text-sm text-[var(--color-neon)]">
                  {articuloDetalle.categoria} · {formatCOP(articuloDetalle.precioPorDia)}/hora
                </p>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  {articuloDetalle.nombre}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
                  {articuloDetalle.descripcion}
                </p>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
                <h3 className="mb-4 font-semibold text-white">Información del propietario</h3>
                <div className="flex items-center gap-3">
                  {articuloDetalle.propietario?.fotoPerfil ? (
                    <img
                      src={articuloDetalle.propietario.fotoPerfil}
                      alt={`Foto de ${articuloDetalle.propietario.nombre || "propietario"}`}
                      className="h-16 w-16 rounded-full border border-[var(--color-border)] object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] text-xl font-bold text-[var(--color-neon)]">
                      {(articuloDetalle.propietario?.nombre || "U")
                        .trim()
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {articuloDetalle.propietario?.nombre || "Estudiante UniTrade"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm">
                      <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                      <span className="font-medium text-amber-200">
                        {Number(articuloDetalle.propietario?.calificacion || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({articuloDetalle.propietario?.totalResenas || 0}{" "}
                        {(articuloDetalle.propietario?.totalResenas || 0) === 1
                          ? "reseña"
                          : "reseñas"})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  {(articuloDetalle.propietario?.sede ||
                    articuloDetalle.propietario?.puntoEntrega ||
                    articuloDetalle.ubicacion) && (
                    <p className="flex items-start gap-2 text-gray-300">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      <span>
                        {[articuloDetalle.propietario?.sede, articuloDetalle.propietario?.puntoEntrega]
                          .filter(Boolean)
                          .join(" · ") || articuloDetalle.ubicacion}
                      </span>
                    </p>
                  )}
                  <p className="flex items-start gap-2 text-gray-300">
                    <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-neon)]" />
                    <span>
                      {articuloDetalle.propietario?.telefono || "Teléfono no registrado"}
                    </span>
                  </p>
                  <p className="flex items-start gap-2 text-gray-300">
                    <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                    <span>
                      {resumenDisponibilidad(articuloDetalle.propietario?.disponibilidad)}
                    </span>
                  </p>
                </div>
              </div>

              {articuloDetalle.estado === "disponible" ? (
                <button
                  type="button"
                  onClick={() => {
                    abrirReserva(articuloDetalle);
                    setArticuloDetalle(null);
                  }}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Reservar por horas
                </button>
              ) : (
                <p className="rounded-lg bg-amber-500/10 p-3 text-center text-sm text-amber-200">
                  Este artículo está en alquiler y no se puede reservar por ahora.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default PaginaCatalogo;
