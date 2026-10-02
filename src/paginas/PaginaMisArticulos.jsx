/**
 * @file PaginaMisArticulos.jsx
 * Página completa "Mis Artículos en Alquiler" con glassmorphism.
 * - Header con título, resumen y botón publicar
 * - Buscador y filtro por categorías
 * - Grid de tarjetas responsive con foto, título, categoría, precio, estado
 * - Acciones: Cambiar estado (Pausar/Activar) y Eliminar
 * - Modal FormularioArticuloModal para crear/editar
 * - Persistencia en localStorage (clave: unitrade_mis_articulos)
 */

import React from "react";
import { useAuth } from "../contexto/ContextoAutenticacion";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import { FormularioArticuloModal } from "../componentes/comunes/FormularioArticuloModal";
import { ModalReservaHoras } from "../componentes/articulos/ModalReservaHoras";
import {
  Plus,
  Search,
  Filter,
  Package,
  Trash2,
  Pause,
  Play,
  Edit,
  Loader2,
  Image as ImageIcon,
  Calendar,
  Clock,
} from "lucide-react";

const CATEGORIAS = ["Todas", "Libros", "Laboratorio", "Calculadoras", "Tecnología", "Deportes", "Otros"];
const STORAGE_KEY = "unitrade_mis_articulos";

const ESTADOS_CONFIG = {
  disponible: { label: "Disponible", color: "bg-emerald-500", text: "text-emerald-400", icon: Play },
  en_alquiler: { label: "En Alquiler", color: "bg-blue-500", text: "text-blue-400", icon: Pause },
  pausado: { label: "Pausado", color: "bg-amber-500", text: "text-amber-400", icon: Play },
};

const generateId = () => `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

export const PaginaMisArticulos = () => {
  const { usuario } = useAuth();
  const [articulos, setArticulos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoriaFiltro, setCategoriaFiltro] = React.useState("Todas");
  const [modalAbierto, setModalAbierto] = React.useState(false);
  const [reservaModalAbierto, setReservaModalAbierto] = React.useState(false);
  const [articuloParaReserva, setArticuloParaReserva] = React.useState(null);
  const [editandoArticulo, setEditandoArticulo] = React.useState(null);
  const [eliminandoId, setEliminandoId] = React.useState(null);
  const [cambiandoEstadoId, setCambiandoEstadoId] = React.useState(null);

  // Cargar desde localStorage al montar
  React.useEffect(() => {
    const cargar = () => {
      try {
        const guardados = localStorage.getItem(STORAGE_KEY);
        if (guardados) {
          setArticulos(JSON.parse(guardados));
        }
      } catch (e) {
        console.error("Error cargando artículos:", e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Guardar en localStorage cuando cambien
  React.useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articulos));
    }
  }, [articulos, loading]);

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

  const handleSubmit = (data) => {
    if (editandoArticulo) {
      setArticulos((prev) =>
        prev.map((a) => (a.id === editandoArticulo.id ? { ...a, ...data, id: a.id } : a))
      );
      setEditandoArticulo(null);
    } else {
      const nuevo = {
        id: generateId(),
        ...data,
        fechaCreacion: new Date().toISOString(),
        usuarioId: usuario?.id || "demo",
      };
      setArticulos((prev) => [nuevo, ...prev]);
    }
    setModalAbierto(false);
  };

  const handleEditar = (art) => {
    setEditandoArticulo(art);
    setModalAbierto(true);
  };

  const handleEliminar = (id) => {
    setEliminandoId(id);
  };

  const confirmarEliminar = (id) => {
    setArticulos((prev) => prev.filter((a) => a.id !== id));
    setEliminandoId(null);
  };

  const handleCambiarEstado = (art) => {
    setCambiandoEstadoId(art.id);
    const nuevoEstado =
      art.estado === "disponible" ? "pausado" : art.estado === "pausado" ? "disponible" : "disponible";
    setArticulos((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, estado: nuevoEstado } : a))
    );
    setTimeout(() => setCambiandoEstadoId(null), 300);
  };

  const abrirModalNuevo = () => {
    setEditandoArticulo(null);
    setModalAbierto(true);
  };

  const abrirModalReserva = (articulo) => {
    setArticuloParaReserva(articulo);
    setReservaModalAbierto(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-canvas)] flex items-center justify-center pt-16 pb-20">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[var(--color-neon)] mx-auto mb-4" />
          <p className="text-gray-400">Cargando tus artículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-gray-100">
      <NavegacionLateral onLogout={() => {}} onProfileClick={() => {}} />

      <main className="transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
        <div className="page-container">
          {/* Header */}
          <div className="mb-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Mis Artículos en Alquiler</h1>
                <p className="text-gray-400 mt-1">
                  Gestiona tus publicaciones y controla el estado de cada artículo
                </p>
              </div>
              <button onClick={abrirModalNuevo} className="btn-primary w-full sm:w-auto flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Publicar Nuevo
              </button>
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

          {/* Buscador y Filtros */}
          <div className="glass-panel p-4 mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input pl-10"
                  aria-label="Buscar artículos"
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

          {/* Grid de Artículos */}
          {articulosFiltrados.length === 0 ? (
            <div className="glass-panel p-12 text-center animate-fade-in">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {articulos.length === 0 ? "No tienes artículos publicados" : "No hay resultados"}
              </h3>
              <p className="text-gray-400 mb-6">
                {articulos.length === 0
                  ? "Comienza publicando tu primer artículo para alquilar"
                  : "Intenta cambiar los filtros o la búsqueda"}
              </p>
              {articulos.length === 0 && (
                <button onClick={abrirModalNuevo} className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Publicar mi primer artículo
                </button>
              )}
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in"
              role="list"
              aria-label="Lista de artículos"
            >
              {articulosFiltrados.map((art) => {
                const estadoConfig = ESTADOS_CONFIG[art.estado];
                const EstadoIcon = estadoConfig.icon;
                return (
                  <article
                    key={art.id}
                    className="glass-card-hover p-0 overflow-hidden flex flex-col relative"
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
                        <span>•</span>
                        <span>{formatCOP(Number(art.precioPorDia))}/día</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-3">
                        {art.descripcion}
                      </p>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
                        <button
                          onClick={() => handleEditar(art)}
                          className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
                          disabled={eliminandoId === art.id || cambiandoEstadoId === art.id}
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        {art.estado === "disponible" && (
                          <button
                            onClick={() => abrirModalReserva(art)}
                            className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1"
                            disabled={eliminandoId === art.id || cambiandoEstadoId === art.id}
                          >
                            <Clock className="w-4 h-4" />
                            <span className="hidden sm:inline">Reservar</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCambiarEstado(art)}
                          className={`flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1 transition-colors ${
                            art.estado === "disponible"
                              ? "hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400"
                              : "hover:bg-emerald-500/20 hover:border-emerald-500/50 text-emerald-400"
                          }`}
                          disabled={eliminandoId === art.id || cambiandoEstadoId === art.id}
                        >
                          {art.estado === "disponible" ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">
                            {art.estado === "disponible" ? "Pausar" : "Activar"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleEliminar(art.id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50"
                          disabled={eliminandoId === art.id || cambiandoEstadoId === art.id}
                          aria-label="Eliminar artículo"
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
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
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
            loading={eliminandoId !== null || cambiandoEstadoId !== null}
          />

          {/* Modal Reserva por Horas */}
          <ModalReservaHoras
            isOpen={reservaModalAbierto}
            onClose={() => {
              setReservaModalAbierto(false);
              setArticuloParaReserva(null);
            }}
            articulo={articuloParaReserva}
            onReservaExitosa={() => {
              setReservaModalAbierto(false);
              setArticuloParaReserva(null);
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default PaginaMisArticulos;