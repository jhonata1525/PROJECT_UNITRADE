import { describe, expect, it } from 'vitest';
import { CondicionArticulo } from '../generated/prisma/enums.js';
import {
  mapearArticulo,
  normalizarArticulo,
  TARIFA_MINIMA,
  type ArticuloPersistido,
} from './mapeo-articulos.js';

const ahora = new Date('2026-10-21T12:00:00.000Z');

describe('normalizarArticulo', () => {
  it('acepta el formato antiguo de localStorage y lo adapta al modelo', () => {
    const resultado = normalizarArticulo(
      {
        id: 'art_123',
        nombre: 'Calculadora Casio',
        categoria: 'Calculadoras',
        precioPorDia: '5000',
        estado: 'pausado',
        descripcion: 'Calculadora científica',
        fotoUrl: 'https://ejemplo.com/foto.jpg',
      },
      { ahora, ubicacionPorDefecto: 'Sede 1 · Bloque B' },
    );

    expect(resultado.error).toBeUndefined();
    expect(resultado.datos).toMatchObject({
      titulo: 'Calculadora Casio',
      tarifaHora: 5000,
      categoria: 'Calculadoras',
      condicion: CondicionArticulo.BUENO,
      ubicacion: 'Sede 1 · Bloque B',
      imagenes: ['https://ejemplo.com/foto.jpg'],
      activo: false,
      claveExterna: 'art_123',
    });
    expect(resultado.datos?.disponibleDesde).toEqual(ahora);
  });

  it('rechaza una tarifa inferior al mínimo de RN-04', () => {
    const resultado = normalizarArticulo({
      nombre: 'Artículo',
      descripcion: 'Descripción',
      precioPorDia: TARIFA_MINIMA - 1,
    });

    expect(resultado.datos).toBeUndefined();
    expect(resultado.error).toContain(String(TARIFA_MINIMA));
  });

  it('exige título y descripción', () => {
    expect(normalizarArticulo({ descripcion: 'Solo descripción' }).error).toContain(
      'título',
    );
    expect(
      normalizarArticulo({ nombre: 'Solo nombre', precioPorDia: 5000 }).error,
    ).toContain('descripción');
  });
});

describe('mapearArticulo', () => {
  const articulo: ArticuloPersistido = {
    id: 'art-1',
    titulo: 'Mesa plegable',
    descripcion: 'Mesa de estudio',
    categoria: 'Mobiliario',
    condicion: CondicionArticulo.BUENO,
    tarifaHora: 8000,
    ubicacion: 'Campus',
    imagenes: ['https://ejemplo.com/mesa.jpg'],
    disponibleDesde: ahora,
    disponibleHasta: new Date('2027-01-19T12:00:00.000Z'),
    activo: true,
    propietarioId: 'usr-1',
    claveExterna: 'art_123',
    creadoEn: ahora,
  };

  it('expone los nombres que espera el frontend', () => {
    const resultado = mapearArticulo(articulo);

    expect(resultado).toMatchObject({
      id: 'art-1',
      nombre: 'Mesa plegable',
      precioPorDia: 8000,
      fotoUrl: 'https://ejemplo.com/mesa.jpg',
      estado: 'disponible',
      activo: true,
    });
  });

  it('marca en_alquiler y pausado según el estado real', () => {
    expect(mapearArticulo(articulo, true).estado).toBe('en_alquiler');
    expect(mapearArticulo({ ...articulo, activo: false }, true).estado).toBe(
      'pausado',
    );
  });
});
