import { CondicionArticulo } from '../generated/prisma/enums.js';

/** Tarifa mínima por hora permitida (RN-04). */
export const TARIFA_MINIMA = 1_000;
export const DURACION_PUBLICACION_DIAS = 90;

/**
 * Entrada flexible: acepta los nombres que ya usa el frontend (`nombre`,
 * `precioPorDia`, `fotoUrl`) y los del modelo (`titulo`, `tarifaHora`,
 * `imagenes`). Así la migración desde localStorage no requiere transformar
 * los datos en el navegador.
 */
export interface EntradaArticulo {
  id?: unknown;
  titulo?: unknown;
  nombre?: unknown;
  descripcion?: unknown;
  categoria?: unknown;
  tarifaHora?: unknown;
  precioPorDia?: unknown;
  condicion?: unknown;
  ubicacion?: unknown;
  imagenes?: unknown;
  fotoUrl?: unknown;
  disponibleDesde?: unknown;
  disponibleHasta?: unknown;
  activo?: unknown;
  estado?: unknown;
  claveExterna?: unknown;
}

export interface DatosArticulo {
  titulo: string;
  descripcion: string;
  categoria: string;
  condicion: CondicionArticulo;
  tarifaHora: number;
  ubicacion: string;
  imagenes: string[];
  disponibleDesde: Date;
  disponibleHasta: Date;
  activo: boolean;
  claveExterna?: string;
}

export interface ResultadoNormalizacion {
  datos?: DatosArticulo;
  error?: string;
}

export interface ArticuloPersistido {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  condicion: CondicionArticulo;
  tarifaHora: number;
  ubicacion: string;
  imagenes: string[];
  disponibleDesde: Date;
  disponibleHasta: Date;
  activo: boolean;
  propietarioId: string;
  claveExterna: string | null;
  creadoEn: Date;
}

export interface ArticuloFrontend {
  id: string;
  nombre: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  precioPorDia: number;
  tarifaHora: number;
  condicion: CondicionArticulo;
  estado: 'disponible' | 'en_alquiler' | 'pausado';
  activo: boolean;
  fotoUrl: string | null;
  imagenes: string[];
  ubicacion: string;
  disponibleDesde: string;
  disponibleHasta: string;
  propietarioId: string;
  claveExterna: string | null;
  creadoEn: string;
}

const texto = (valor: unknown): string =>
  typeof valor === 'string' ? valor.trim() : '';

const numero = (valor: unknown): number => {
  if (typeof valor === 'string' && valor.trim() === '') return Number.NaN;
  return Number(valor);
};

const fecha = (valor: unknown): Date | null => {
  if (valor === null || valor === undefined || valor === '') return null;
  const resultado = valor instanceof Date ? valor : new Date(String(valor));
  return Number.isNaN(resultado.getTime()) ? null : resultado;
};

/**
 * Valida y normaliza un artículo. Devuelve `error` con un mensaje en español
 * cuando falta un dato obligatorio o una tarifa no cumple RN-04.
 */
export function normalizarArticulo(
  entrada: EntradaArticulo,
  opciones: { ubicacionPorDefecto?: string; ahora?: Date } = {},
): ResultadoNormalizacion {
  const titulo = texto(entrada.titulo) || texto(entrada.nombre);
  if (!titulo) {
    return { error: 'El título (nombre) del artículo es obligatorio.' };
  }

  const descripcion = texto(entrada.descripcion);
  if (!descripcion) {
    return { error: 'La descripción del artículo es obligatoria.' };
  }

  const categoria = texto(entrada.categoria) || 'Otros';
  const tarifaHora = numero(entrada.tarifaHora ?? entrada.precioPorDia);

  if (!Number.isInteger(tarifaHora) || tarifaHora < TARIFA_MINIMA) {
    return {
      error: `La tarifa por hora debe ser un entero mayor o igual a ${TARIFA_MINIMA} COP.`,
    };
  }

  const condiciones = Object.values(CondicionArticulo) as string[];
  const condicion = condiciones.includes(texto(entrada.condicion))
    ? (texto(entrada.condicion) as CondicionArticulo)
    : CondicionArticulo.BUENO;

  const imagenes = Array.isArray(entrada.imagenes)
    ? entrada.imagenes
        .filter((imagen): imagen is string => typeof imagen === 'string')
        .map((imagen) => imagen.trim())
        .filter(Boolean)
    : [];
  const fotoUrl = texto(entrada.fotoUrl);
  if (imagenes.length === 0 && fotoUrl) imagenes.push(fotoUrl);

  const ahora = opciones.ahora ?? new Date();
  const disponibleDesde = fecha(entrada.disponibleDesde) ?? ahora;
  const disponibleHasta =
    fecha(entrada.disponibleHasta) ??
    new Date(disponibleDesde.getTime() + DURACION_PUBLICACION_DIAS * 86_400_000);

  if (disponibleHasta <= disponibleDesde) {
    return { error: 'La fecha de fin de disponibilidad debe ser posterior al inicio.' };
  }

  const estado = texto(entrada.estado);
  const activo =
    typeof entrada.activo === 'boolean'
      ? entrada.activo
      : estado
        ? estado !== 'pausado'
        : true;

  const claveExterna =
    texto(entrada.claveExterna) || texto(entrada.id) || undefined;

  return {
    datos: {
      titulo,
      descripcion,
      categoria,
      condicion,
      tarifaHora,
      ubicacion:
        texto(entrada.ubicacion) ||
        opciones.ubicacionPorDefecto ||
        'Campus universitario',
      imagenes,
      disponibleDesde,
      disponibleHasta,
      activo,
      ...(claveExterna ? { claveExterna: claveExterna.slice(0, 120) } : {}),
    },
  };
}

/** Convierte una fila de Prisma al formato que consume "Mis Artículos". */
export function mapearArticulo(
  articulo: ArticuloPersistido,
  tieneAlquilerActivo = false,
): ArticuloFrontend {
  const estado = !articulo.activo
    ? 'pausado'
    : tieneAlquilerActivo
      ? 'en_alquiler'
      : 'disponible';

  return {
    id: articulo.id,
    nombre: articulo.titulo,
    titulo: articulo.titulo,
    descripcion: articulo.descripcion,
    categoria: articulo.categoria,
    precioPorDia: articulo.tarifaHora,
    tarifaHora: articulo.tarifaHora,
    condicion: articulo.condicion,
    estado,
    activo: articulo.activo,
    fotoUrl: articulo.imagenes[0] ?? null,
    imagenes: articulo.imagenes,
    ubicacion: articulo.ubicacion,
    disponibleDesde: articulo.disponibleDesde.toISOString(),
    disponibleHasta: articulo.disponibleHasta.toISOString(),
    propietarioId: articulo.propietarioId,
    claveExterna: articulo.claveExterna,
    creadoEn: articulo.creadoEn.toISOString(),
  };
}
