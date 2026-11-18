/**
 * @file ArticuloCard.jsx
 * Tarjeta de artículo del catálogo, memoizada para evitar re-renderizados
 * innecesarios durante el scroll en móvil (60 FPS).
 * - Imágenes con loading="lazy" y decoding="async"
 * - Fondo sólido semitransparente (menos blur en GPU móvil)
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  MapPin,
  Package,
  Phone,
  User,
  AlertCircle,
  Star,
} from "lucide-react";

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

const ArticuloCard = React.memo(({ art, usuario, esMio, onReserva, onDetalle, onEditar, onCambiarEstado, onEliminar }) => {
  const proximo = art.propietario?.disponibilidad
    ? null
    : null;

  const etiquetaEstado =
    art.estado === "disponible"
      ? "Pausar"
      : art.estado === "en_alquiler" && art.estadoAlquiler === "PENDIENTE_ENTREGA"
        ? "Entregar"
        : art.estado === "en_alquiler"
          ? "Devolver"
          : "Activar";

  const estadoConfig =
    art.estado === "disponible"
      ? { label: "Disponible", color: "bg-emerald-500", text: "text-emerald-400", icon: CheckCircle2 }
      : { label: "En alquiler", color: "bg-amber-500", text: "text-amber-400", icon: Clock };

  return (
    <article
      className="glass-card-hover p-0 overflow-hidden flex flex-col snap-start shrink-0 w-[85vw] max-w-[320px] role-listitem"
      role="listitem"
    >
      <div className="relative h-40 bg-[var(--color-canvas)] overflow-hidden">
        {art.fotoUrl ? (
          <img
            src={art.fotoUrl}
            alt={art.nombre}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-canvas)]">
            <ImageIcon className="w-10 h-10 text-gray-600" />
            <span className="text-[11px] uppercase tracking-wider text-gray-500">Sin foto</span>
          </div>
        )}
        {esMio && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-neon)] px-2.5 py-1 text-xs font-semibold text-black shadow-lg">
              Tu publicación
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${art.estado === "en_alquiler" ? "bg-amber-500" : "bg-emerald-500"}`}
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

        <div className="space-y-1 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-canvas)]">
              {art.propietario?.fotoPerfil ? (
                <img
                  src={art.propietario.fotoPerfil}
                  alt={`Foto de ${art.propietario?.nombre || "propietario"}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-xs font-semibold text-[var(--color-neon)]">
                  {(art.propietario?.nombre || "U").charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="truncate font-medium">
              {art.propietario?.nombre || "Estudiante UniTrade"}
            </span>
          </div>
          {(art.ubicacion || art.propietario?.sede) && (
            <p className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="truncate">
                {art.ubicacion || art.propietario?.sede}
              </span>
            </p>
          )}
          <p className="flex items-start gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[var(--color-neon)] flex-shrink-0 mt-0.5" />
            <span className="truncate">
              {art.propietario?.telefono || "Teléfono no registrado"}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDetalle(art)}
          className="w-full btn-secondary text-sm py-2 mb-2 flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4" />
          Ver artículo y propietario
        </button>

        {esMio ? (
          <Link
            to="/mis-articulos"
            className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            Gestionar publicación
          </Link>
        ) : art.estado === "en_alquiler" ? (
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
            onClick={() => onReserva(art)}
            className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Reservar por horas
          </button>
        )}
      </div>
    </article>
  );
});

ArticuloCard.displayName = "ArticuloCard";

export { ArticuloCard };
export default ArticuloCard;
