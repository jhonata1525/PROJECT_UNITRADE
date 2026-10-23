/**
 * @file PaginaCatalogo.jsx
 * Catálogo público de artículos disponibles en UniTrade.
 * - Muestra artículos disponibles y en alquiler de otros usuarios.
 * - Buscador y filtro por categoría.
 * - Cada tarjeta muestra foto, título, categoría, tarifa por hora, descripción
 *   y datos del propietario (nombre y sede).
 * - Botón "Reservar" que abre ModalReservaHoras para alquilar por horas.
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../contexto/ContextoAutenticacion";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import { ModalReservaHoras } from "../componentes/articulos/ModalReservaHoras";
import {
  listarCatalogoArticulos,
  mensajeErrorArticulos,
} from "../servicios/servicioArticulos";

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
    cargarCatalogo();
  }, [cargarCatalogo]);

  // Los artículos alquilados se muestran, pero no pueden reservarse otra vez.
  const disponibles = articulos.filter(
    (art) => art.estado === "disponible" && art.propietario?.id !== usuario?.id
  );

  const articulosVisibles = articulos.filter(
    (art) =>
      ["disponible", "en_alquiler"].includes(art.estado) &&
      art.propietario?.id !== usuario?.id
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
    <div className="min-h-screen bg-[var(--color-canvas)] text-gray-100">
      <NavegacionLateral />

      <main className="transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
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
                  Encuentra artículos de otros estudiantes y resérvalos por horas.
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o propietario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10"
                  aria-label="Buscar artículos disponibles"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="glass-input pl-10 pr-10 bg-[var(--color-surface)] cursor-pointer appearance-none"
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
            <div className="glass-panel p-12 text-center">
              <Loader2 className="w-12 h-12 text-[var(--color-neon)] mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Buscando artículos disponibles...</p>
            </div>
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
                <article
                  key={art.id}
                  className="glass-card-hover p-0 overflow-hidden flex flex-col"
                  role="listitem"
                >
                  {/* Foto */}
                  <div className="relative h-40 bg-[var(--color-canvas)] overflow-hidden">
                    {art.fotoUrl ? (
                      <img
                        src={art.fotoUrl}
                        alt={art.nombre}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${
                          art.estado === "en_alquiler"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      >
                        {art.estado === "en_alquiler" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {art.estado === "en_alquiler" ? "En alquiler" : "Disponible"}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-white truncate mb-1" title={art.nombre}>
                      {art.nombre}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span className="px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                        {art.categoria}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-[var(--color-neon)]">
                        {formatCOP(art.precioPorDia)}/hora
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-3">
                      {art.descripcion}
                    </p>

                    {/* Propietario y ubicación */}
                    <div className="space-y-1 text-xs text-gray-400 mb-3">
                      <p className="flex items-start gap-1.5">
                        <User className="w-3.5 h-3.5 text-[var(--color-neon)] flex-shrink-0 mt-0.5" />
                        <span className="truncate">
                          {art.propietario?.nombre || "Estudiante UniTrade"}
                        </span>
                      </p>
                      {(art.ubicacion || art.propietario?.sede) && (
                        <p className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate">
                            {art.ubicacion || art.propietario?.sede}
                          </span>
                        </p>
                      )}
                      <p className="flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>
                          Disponible hasta{" "}
                          {new Date(art.disponibleHasta).toLocaleDateString("es-CO")}
                        </span>
                      </p>
                    </div>

                    {art.estado === "en_alquiler" ? (
                      <button
                        type="button"
                        disabled
                        className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4" />
                        En alquiler
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => abrirReserva(art)}
                        className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" />
                        Reservar por horas
                      </button>
                    )}
                  </div>
                </article>
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
    </div>
  );
};

export default PaginaCatalogo;
