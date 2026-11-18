/**
 * @file PaginaMisArticulos.jsx
 * PÃ¡gina completa "Mis ArtÃ­culos en Alquiler" con glassmorphism.
 * - Header con tÃ­tulo, resumen y botÃ³n publicar
 * - Buscador y filtro por categorÃ­as
 * - Grid de tarjetas responsive con foto, tÃ­tulo, categorÃ­a, precio, estado
 * - Acciones: Cambiar estado (Pausar/Activar) y Eliminar
 * - Modal FormularioArticuloModal para crear/editar
 * - Persistencia en la tabla `articulo` del backend (PostgreSQL)
 * - MigraciÃ³n automÃ¡tica de los artÃ­culos que estaban en localStorage
 */

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexto/ContextoAutenticacion";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import { FormularioArticuloModal } from "../componentes/comunes/FormularioArticuloModal";
import {
  actualizarArticulo,
  crearArticulo,
  eliminarArticulo,
  importarArticulos,
  listarMisArticulos,
  mensajeErrorArticulos,
} from "../servicios/servicioArticulos";
import {
  Plus,
  Search,
  Filter,
  Compass,
  Package,
  Trash2,
  Pause,
  Play,
  Edit,
  Loader2,
  Image as ImageIcon,
  Clock,
  MapPin,
  AlertCircle,
  X,
  CheckCircle2,
  KeyRound,
  Camera,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PinInput from "../componentes/comunes/PinInput";
import {
  confirmarEntrega,
  confirmarDevolucion,
  mensajeErrorReservas,
} from "../servicios/servicioReservas";
import {
  resumenDisponibilidad,
  hayDisponibilidad,
  formatearSede,
} from "../utils/perfil";

const QRScanner = React.lazy(() =>
  import("../componentes/comunes/QRScanner")
);

const CATEGORIAS = ["Todas", "Libros", "Laboratorio", "Calculadoras", "TecnologÃ­a", "Deportes", "Otros"];
const STORAGE_KEY = "unitrade_mis_articulos";

const ESTADOS_CONFIG = {
  disponible: { label: "Disponible", color: "bg-emerald-500", text: "text-emerald-400", icon: Play },
  en_alquiler: { label: "En Alquiler", color: "bg-blue-500", text: "text-blue-400", icon: Pause },
  pausado: { label: "Pausado", color: "bg-amber-500", text: "text-amber-400", icon: Play },
};

/** Lee los artÃ­culos que quedaron guardados en el navegador (formato antiguo). */
const leerArticulosLocales = () => {
  try {
    const guardados = localStorage.getItem(STORAGE_KEY);
    if (!guardados) return [];
    const datos = JSON.parse(guardados);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error("No se pudieron leer los artÃ­culos locales:", error);
    return [];
  }
};

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

export const PaginaMisArticulos = () => {
  const { usuario } = useAuth();
  const [articulos, setArticulos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoriaFiltro, setCategoriaFiltro] = React.useState("Todas");
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [editandoArticulo, setEditandoArticulo] = React.useState(null);
  const [eliminandoId, setEliminandoId] = React.useState(null);
  const [cambiandoEstadoId, setCambiandoEstadoId] = React.useState(null);
  const [articuloDevolucion, setArticuloDevolucion] = React.useState(null);
  const [codigoDevolucion, setCodigoDevolucion] = React.useState("");
  const [errorDevolucion, setErrorDevolucion] = React.useState("");
  const [confirmandoDevolucion, setConfirmandoDevolucion] = React.useState(false);
  const [tipoConfirmacion, setTipoConfirmacion] = React.useState("devolucion");
  const [escanerAbierto, setEscanerAbierto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [aviso, setAviso] = React.useState(null);
  const carrilRef = React.useRef(null);

  // Desplaza el carrusel de tarjetas una tarjeta a la izquierda o derecha.
  const desplazarCarril = (direccion) => {
    const carril = carrilRef.current;
    if (!carril) return;
    const tarjeta = carril.querySelector("article");
    const paso = tarjeta
      ? tarjeta.offsetWidth + 16
      : Math.round(carril.clientWidth * 0.8);
    carril.scrollBy({ left: paso * direccion, behavior: "smooth" });
  };

  // Cargar desde la tabla `articulo` y migrar una sola vez los datos locales.
  React.useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      if (!usuario?.id) {
        if (!cancelado) {
          setAviso({
            tipo: "error",
            mensaje: "Inicia sesiÃ³n para ver y administrar tus artÃ­culos.",
          });
          setLoading(false);
        }
        return;
      }

      try {
        const articulosLocales = leerArticulosLocales();
        let datos = null;
        let migrados = 0;
        let pendientes = 0;

        if (articulosLocales.length > 0) {
          const resultado = await importarArticulos(usuario.id, articulosLocales);
          datos = resultado.articulos;
          migrados = resultado.creados + resultado.actualizados;
          pendientes = resultado.omitidos;
        }

        if (!datos) {
          datos = await listarMisArticulos(usuario.id);
        }

        if (cancelado) return;

        setArticulos(datos);

        if (migrados > 0) {
          setAviso({
            tipo: "Ã©xito",
            mensaje: `Se sincronizaron ${migrados} artÃ­culo(s) con la base de datos.`,
          });
        }

        if (pendientes > 0) {
          setAviso({
            tipo: "error",
            mensaje:
              `${pendientes} artÃ­culo(s) guardados en este navegador no se pudieron migrar. ` +
              "Revisa que tengan descripciÃ³n y una tarifa de al menos $1.000.",
          });
        } else if (articulosLocales.length > 0) {
          // Todo quedÃ³ en PostgreSQL: ya no hace falta duplicarlo en el navegador.
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        if (cancelado) return;
        const locales = leerArticulosLocales();
        setArticulos(locales);
        setAviso({
          tipo: "error",
          mensaje: mensajeErrorArticulos(
            error,
            "No se pudieron cargar los artÃ­culos desde la base de datos. " +
              "Se muestran los guardados en este navegador."
          ),
        });
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);

  const articulosFiltrados = articulos.filter((art) => {
    const matchSearch =
      art.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaFiltro === "Todas" || art.categoria === categoriaFiltro;
    return matchSearch && matchCategoria;
  });

  const resumen = {
    total: articulos.length,
    disponibles: articulos.filter((a) => a.estado === "disponible").length,
    enAlquiler: articulos.filter((a) => a.estado === "en_alquiler").length,
    pausados: articulos.filter((a) => a.estado === "pausado").length,
  };

  const tieneDisponibilidad = hayDisponibilidad(usuario?.disponibilidad);
  const resumenHorario = resumenDisponibilidad(usuario?.disponibilidad, { corto: true });
  const sedeEntrega = formatearSede(usuario);

  const handleSubmit = async (data) => {
    if (!usuario?.id || guardando) return;

    const editando = Boolean(editandoArticulo);
    setGuardando(true);
    setAviso(null);

    try {
      const cambios = {
        nombre: data.nombre,
        categoria: data.categoria,
        precioPorDia: Number(data.precioPorDia),
        estado: data.estado,
        descripcion: data.descripcion,
        fotoUrl: data.fotoUrl || undefined,
      };

      if (editando) {
        await actualizarArticulo(usuario.id, editandoArticulo.id, cambios);
      } else {
        await crearArticulo(usuario.id, cambios);
      }

      const datos = await listarMisArticulos(usuario.id);
      setArticulos(datos);
      setEditandoArticulo(null);
      setModalAbierto(false);
      setAviso({
        tipo: "Ã©xito",
        mensaje: editando
          ? "ArtÃ­culo actualizado en la base de datos."
          : "ArtÃ­culo publicado en la base de datos.",
      });
    } catch (error) {
      setAviso({
        tipo: "error",
        mensaje: mensajeErrorArticulos(error, "No se pudo guardar el artÃ­culo."),
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (art) => {
    setEditandoArticulo(art);
    setModalAbierto(true);
  };

  const handleEliminar = (id) => {
    setEliminandoId(id);
  };

  const confirmarEliminar = async (id) => {
    if (!usuario?.id || guardando) return;

    setGuardando(true);
    setAviso(null);

    try {
      const resultado = await eliminarArticulo(usuario.id, id);
      setArticulos((prev) => prev.filter((a) => a.id !== id));
      setEliminandoId(null);
      setAviso({
        tipo: "Ã©xito",
        mensaje: resultado.mensaje || "ArtÃ­culo eliminado de la base de datos.",
      });
    } catch (error) {
      setAviso({
        tipo: "error",
        mensaje: mensajeErrorArticulos(error, "No se pudo eliminar el artÃ­culo."),
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (art) => {
    if (!usuario?.id || guardando) return;

    if (art.estado === "en_alquiler") {
      setTipoConfirmacion(
        art.estadoAlquiler === "PENDIENTE_ENTREGA" ? "entrega" : "devolucion"
      );
      setArticuloDevolucion(art);
      setCodigoDevolucion("");
      setErrorDevolucion("");
      setEscanerAbierto(false);
      return;
    }

    const nuevoEstado = art.estado === "disponible" ? "pausado" : "disponible";
    setCambiandoEstadoId(art.id);
    setAviso(null);

    try {
      const actualizado = await actualizarArticulo(usuario.id, art.id, {
        estado: nuevoEstado,
      });
      setArticulos((prev) =>
        prev.map((a) => (a.id === art.id ? actualizado : a))
      );
      setAviso({
        tipo: "Ã©xito",
        mensaje:
          nuevoEstado === "pausado"
            ? "El artÃ­culo se pausÃ³ en la base de datos."
            : "El artÃ­culo se activÃ³ en la base de datos.",
      });
    } catch (error) {
      setAviso({
        tipo: "error",
        mensaje: mensajeErrorArticulos(
          error,
          "No se pudo cambiar el estado del artÃ­culo."
        ),
      });
    } finally {
      setCambiandoEstadoId(null);
    }
  };

  const handleConfirmarDevolucion = async (event, codigoEscaneado) => {
    event?.preventDefault();
    if (!usuario?.id || !articuloDevolucion || confirmandoDevolucion) return;
    const codigo = codigoEscaneado || codigoDevolucion;
    if (!codigo) return;

    setConfirmandoDevolucion(true);
    setErrorDevolucion("");

    try {
      const confirmar =
        tipoConfirmacion === "entrega" ? confirmarEntrega : confirmarDevolucion;
      const resultado = await confirmar(
        usuario.id,
        articuloDevolucion.id,
        codigo
      );
      const datos = await listarMisArticulos(usuario.id);
      setArticulos(datos);
      setArticuloDevolucion(null);
      setCodigoDevolucion("");
      setEscanerAbierto(false);
      setAviso({
        tipo: "Ã©xito",
        mensaje: resultado.mensaje || "DevoluciÃ³n confirmada. El artÃ­culo estÃ¡ disponible.",
      });
    } catch (error) {
      setErrorDevolucion(
        mensajeErrorReservas(error, "No se pudo confirmar la devoluciÃ³n.")
      );
    } finally {
      setConfirmandoDevolucion(false);
    }
  };

  const abrirModalNuevo = () => {
    setEditandoArticulo(null);
    setModalAbierto(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 pb-20">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[var(--color-neon)] mx-auto mb-4" />
          <p className="text-gray-400">Cargando tus artÃ­culos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-100">
      <NavegacionLateral />

      <main className="transition-all duration-300 content-sidebar min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
        <div className="page-container">
          {/* Header */}
          <div className="mb-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Mis ArtÃ­culos en Alquiler</h1>
                <p className="text-gray-400 mt-1">
                  Gestiona tus publicaciones y controla el estado de cada artÃ­culo
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link
                  to="/catalogo"
                  className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Compass className="w-5 h-5" />
                  Explorar catÃ¡logo
                </Link>
                <button onClick={abrirModalNuevo} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Publicar Nuevo
                </button>
              </div>
            </div>

            {/* Resumen badges */}
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--color-neon)]" />
                <span className="text-sm text-gray-300">Total: <span className="font-bold text-white">{resumen.total}</span></span>
              </div>
              <div className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-300">Disponibles: <span className="font-bold text-emerald-400">{resumen.disponibles}</span></span>
              </div>
              <div className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-300">En Alquiler: <span className="font-bold text-blue-400">{resumen.enAlquiler}</span></span>
              </div>
              <div className="glass-panel px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-gray-300">Pausados: <span className="font-bold text-amber-400">{resumen.pausados}</span></span>
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

          {/* Buscador y Filtros */}
          <div className="glass-panel p-4 mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o descripciÃ³n..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10"
                  aria-label="Buscar artÃ­culos"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="glass-input pl-10 pr-10 bg-[var(--color-surface)] cursor-pointer appearance-none"
                  aria-label="Filtrar por categorÃ­a"
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

          {/* Carrusel de ArtÃ­culos */}
          {articulosFiltrados.length === 0 ? (
            <div className="glass-panel p-12 text-center animate-fade-in">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {articulos.length === 0 ? "No tienes artÃ­culos publicados" : "No hay resultados"}
              </h3>
              <p className="text-gray-400 mb-6">
                {articulos.length === 0
                  ? "Comienza publicando tu primer artÃ­culo para alquilar"
                  : "Intenta cambiar los filtros o la bÃºsqueda"}
              </p>
              {articulos.length === 0 && (
                <button onClick={abrirModalNuevo} className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Publicar mi primer artÃ­culo
                </button>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Encabezado del carrusel */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm text-gray-400">
                  {articulosFiltrados.length}{" "}
                  {articulosFiltrados.length === 1 ? "publicaciÃ³n" : "publicaciones"}
                  <span className="hidden sm:inline"> Â· desliza o usa las flechas</span>
                </p>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => desplazarCarril(-1)}
                    className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 text-gray-300 hover:text-white hover:border-[var(--color-border-hover)] transition-colors"
                    aria-label="Ver artÃ­culos anteriores"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => desplazarCarril(1)}
                    className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/60 text-gray-300 hover:text-white hover:border-[var(--color-border-hover)] transition-colors"
                    aria-label="Ver mÃ¡s artÃ­culos"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div
                ref={carrilRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-thin pb-4 -mx-1 px-1"
                role="list"
                aria-label="Lista de artÃ­culos"
              >
                {articulosFiltrados.map((art) => {
                  const estadoConfig = ESTADOS_CONFIG[art.estado];
                  const EstadoIcon = estadoConfig.icon;
                  const etiquetaEstado =
                    art.estado === "disponible"
                      ? "Pausar"
                      : art.estado === "en_alquiler" &&
                          art.estadoAlquiler === "PENDIENTE_ENTREGA"
                        ? "Entregar"
                        : art.estado === "en_alquiler"
                          ? "Devolver"
                          : "Activar";
                  const tituloEstado =
                    art.estado === "en_alquiler" &&
                    art.estadoAlquiler === "PENDIENTE_ENTREGA"
                      ? "Confirmar entrega con QR/PIN"
                      : art.estado === "en_alquiler"
                        ? "Confirmar devoluciÃ³n con QR/PIN"
                        : etiquetaEstado;
                  return (
                    <article
                      key={art.id}
                      className="glass-card-hover p-0 overflow-hidden flex flex-col relative snap-start shrink-0 w-[85vw] max-w-[320px]"
                      role="listitem"
                    >
                      {/* Foto */}
                      <div className="relative h-40 bg-[var(--color-canvas)] overflow-hidden">
                        {art.fotoUrl ? (
                          <img
                            src={art.fotoUrl}
                            alt={art.nombre}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                        {/* Badge Estado */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${estadoConfig.color} text-white shadow-lg`}
                          >
                            <EstadoIcon className="w-3 h-3" />
                            {estadoConfig.label}
                          </span>
                        </div>
                        {/* Loading overlay al cambiar estado */}
                        {cambiandoEstadoId === art.id && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
  
                      {/* Contenido */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-white truncate mb-1">{art.nombre}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <span className="px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                            {art.categoria}
                          </span>
                          <span>â€¢</span>
                          <span>{formatCOP(Number(art.precioPorDia))}/dÃ­a</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-3">
                          {art.descripcion}
                        </p>
  
                        {/* Contacto y disponibilidad del dueÃ±o (HU-03) */}
                        {(tieneDisponibilidad || sedeEntrega) && (
                          <div className="space-y-1 text-xs text-gray-400 mb-3">
                            {tieneDisponibilidad && (
                              <p className="flex items-start gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[var(--color-neon)] flex-shrink-0 mt-0.5" />
                                <span>{resumenHorario}</span>
                              </p>
                            )}
                            {sedeEntrega && (
                              <p className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>{sedeEntrega}</span>
                              </p>
                            )}
                          </div>
                        )}
  
                        {/* Acciones */}
                        <div className="flex items-center gap-1.5 pt-3 border-t border-[var(--color-border)]">
                          <button
                            onClick={() => handleEditar(art)}
                            className="flex-1 min-w-0 btn-secondary px-2 text-xs py-2 flex items-center justify-center gap-1"
                            disabled={eliminandoId === art.id || cambiandoEstadoId === art.id}
                          >
                            <Edit className="w-4 h-4 shrink-0" />
                            <span className="truncate">Editar</span>
                          </button>
                          <button
                            onClick={() => handleCambiarEstado(art)}
                            title={tituloEstado}
                            className={`flex-1 min-w-0 btn-secondary px-2 text-xs py-2 flex items-center justify-center gap-1 transition-colors ${
                              art.estado === "disponible"
                                ? "hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400"
                                : "hover:bg-emerald-500/20 hover:border-emerald-500/50 text-emerald-400"
                            }`}
                            disabled={eliminandoId === art.id || cambiandoEstadoId === art.id}
                          >
                            {art.estado === "disponible" ? (
                              <Pause className="w-4 h-4 shrink-0" />
                            ) : (
                              <Play className="w-4 h-4 shrink-0" />
                            )}
                            <span className="truncate">{etiquetaEstado}</span>
                          </button>
                          <button
                            onClick={() => handleEliminar(art.id)}
                            className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50"
                            disabled={eliminandoId === art.id || cambiandoEstadoId === art.id}
                            aria-label="Eliminar artÃ­culo"
                            title="Eliminar artÃ­culo"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
  
                      {/* Confirmar eliminar overlay */}
                      {eliminandoId === art.id && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-10 animate-fade-in">
                          <div className="glass-panel p-6 rounded-xl max-w-sm w-full text-center">
                            <p className="text-white mb-4">
                              &#191;Eliminar &ldquo;<span className="font-medium">{art.nombre}</span>&rdquo;?
                            </p>
                            <p className="text-gray-400 text-sm mb-6">Esta acci&#243;n no se puede deshacer.</p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setEliminandoId(null)}
                                className="flex-1 btn-secondary"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => confirmarEliminar(art.id)}
                                disabled={guardando}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {guardando ? "Eliminando..." : "Eliminar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Formulario */}
          <FormularioArticuloModal
            isOpen={modalAbierto}
            onClose={() => {
              setModalAbierto(false);
              setEditandoArticulo(null);
            }}
            onSubmit={handleSubmit}
            initialData={editandoArticulo}
            loading={guardando}
          />
          {articuloDevolucion && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="validacion-reserva-titulo"
            >
              <form
                onSubmit={handleConfirmarDevolucion}
                className="glass-panel w-full max-w-md rounded-2xl p-6"
              >
                <div className="flex items-start gap-3 mb-5">
                  <KeyRound className="w-6 h-6 text-[var(--color-neon)] flex-shrink-0" />
                  <div>
                    <h2 id="validacion-reserva-titulo" className="text-xl font-bold text-white">
                      {tipoConfirmacion === "entrega"
                        ? "Confirmar entrega presencial"
                        : "Confirmar devoluciÃ³n presencial"}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      El arrendatario debe presentar su QR o PIN de 4 dÃ­gitos
                      en persona para{" "}
                      <span className="text-white">{articuloDevolucion.nombre}</span>.
                      {tipoConfirmacion === "devolucion" &&
                        " Al confirmar se calcula el recargo por mora, si aplica."}
                    </p>
                  </div>
                </div>
                {escanerAbierto ? (
                  <React.Suspense
                    fallback={<p className="text-sm text-gray-400">Cargando escÃ¡ner...</p>}
                  >
                    <QRScanner
                      onScan={(codigo) => handleConfirmarDevolucion(undefined, codigo)}
                      onClose={() => setEscanerAbierto(false)}
                      onError={(error) => setErrorDevolucion(
                        mensajeErrorReservas(error, "No se pudo abrir la cÃ¡mara.")
                      )}
                      className="mb-4"
                    />
                  </React.Suspense>
                ) : (
                  <div className="flex flex-col items-center gap-3 mb-4">
                    <PinInput
                      value={codigoDevolucion}
                      onChange={setCodigoDevolucion}
                      disabled={confirmandoDevolucion}
                      error={errorDevolucion}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setErrorDevolucion("");
                        setEscanerAbierto(true);
                      }}
                      disabled={confirmandoDevolucion}
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Escanear QR con cÃ¡mara
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setArticuloDevolucion(null);
                      setErrorDevolucion("");
                      setEscanerAbierto(false);
                    }}
                    disabled={confirmandoDevolucion}
                    className="flex-1 btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      codigoDevolucion.length !== 4 ||
                      confirmandoDevolucion ||
                      escanerAbierto
                    }
                    className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {confirmandoDevolucion && <Loader2 className="w-4 h-4 animate-spin" />}
                    {confirmandoDevolucion
                      ? "Validando..."
                      : tipoConfirmacion === "entrega"
                        ? "Validar entrega"
                        : "Validar devoluciÃ³n"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaginaMisArticulos;
