/**
 * @file ArticuloCard.jsx
 * Tarjeta de artículo del catálogo, memoizada para evitar re-renderizados
 * innecesarios durante el scroll en móvil (60 FPS).
 * - Imágenes con loading="lazy" y decoding="async"
 * - Fondo sólido semitransparente (menos blur en GPU móvil)
 * - Todas las propiedades protegidas con optional chaining y valores por defecto
 *   para que nunca lance TypeError aunque el dato llegue incompleto.
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  MapPin,
  Package,
  Phone,
  User,
} from "lucide-react";

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

const EstadoConfig =
  art => {
    if (art === "disponible") {
      return { label: "Disponible", color: "bg-emerald-500", text: "text-emerald-400", icon: CheckCircle2 };
    }
    return { label: "En alquiler", color: "bg-amber-500", text: "text-amber-400", icon: Clock };
  };

const ArticuloCard = React.memo(({
  art = {},
  usuario,
  esMio = false,
  onReserva,
  onDetalle,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) => {
  const nombre = art.nombre || "Sin título";
  const categoria = art.categoria || "Sin categoría";
  const precioPorHora = Number(art.precioPorDia ?? art.precioPorHora ?? 0) || 0;
  const descripcion = art.descripcion || "";
  const estado = art.estado || "disponible";
  const estadoAlquiler = art.estadoAlquiler || "";
  const fotoUrl = art.fotoUrl || "";
  const propietario = art.propietario || {};
  const propietarioNombre = propietario.nombre || "Estudiante UniTrade";
  const propietarioFoto = propietario.fotoPerfil || "";
  const ubicacion = art.ubicacion || "";
  const sede = propietario.sede || "";
  const telefono = propietario.telefono || "Teléfono no registrado";

  const esPropio = esMio || (usuario && propietario.id === usuario.id);

  const etiquetaEstado =
    estado === "disponible"
      ? "Pausar"
      : estado === "en_alquiler" && estadoAlquiler === "PENDIENTE_ENTREGA"
        ? "Entregar"
        : estado === "en_alquiler"
          ? "Devolver"
          : "Activar";

  const { label, color, text, icon: EstadoIcon } = EstadoConfig(estado);

  return (
    <article
      className="glass-card-hover p-0 overflow-hidden flex flex-col snap-start shrink-0 w-[85vw] max-w-[320px]"
      role="listitem"
    >
      <div className="relative h-40 bg-[var(--color-canvas)] overflow-hidden">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={nombre}
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
        {esPropio && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-neon)] px-2.5 py-1 text-xs font-semibold text-black shadow-lg">
              Tu publicación
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${estado === "en_alquiler" ? "bg-amber-500" : "bg-emerald-500"}`}
          >
            {estado === "en_alquiler" ? (
              <Clock className="w-3 h-3" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {estado === "en_alquiler" ? "En alquiler" : "Disponible"}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-white truncate mb-1" title={nombre}>
          {nombre}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span className="px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
            {categoria}
          </span>
          <span>•</span>
          <span className="font-medium text-[var(--color-neon)]">
            {formatCOP(precioPorHora)}/hora
          </span>
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-3">
          {descripcion}
        </p>

        <div className="space-y-1 text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-canvas)]">
              {propietarioFoto ? (
                <img
                  src={propietarioFoto}
                  alt={`Foto de ${propietarioNombre}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-xs font-semibold text-[var(--color-neon)]">
                  {propietarioNombre.charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="truncate font-medium">
              {propietarioNombre}
            </span>
          </div>
          {(ubicacion || sede) && (
            <p className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="truncate">
                {ubicacion || sede}
              </span>
            </p>
          )}
          <p className="flex items-start gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[var(--color-neon)] flex-shrink-0 mt-0.5" />
            <span className="truncate">
              {telefono}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDetalle?.(art)}
          className="w-full btn-secondary text-sm py-2 mb-2 flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4" />
          Ver artículo y propietario
        </button>

        {esPropio ? (
          <Link
            to="/mis-articulos"
            className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            Gestionar publicación
          </Link>
        ) : estado === "en_alquiler" ? (
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
            onClick={() => onReserva?.(art)}
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
