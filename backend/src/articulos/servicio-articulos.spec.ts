import { ConflictException } from '@nestjs/common';
import type { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioArticulos } from './servicio-articulos.js';

describe('ServicioArticulos: registro y disponibilidad', () => {
  const prisma = {
    usuario: { findUnique: vi.fn() },
    articulo: { create: vi.fn() },
    alquiler: { count: vi.fn() },
  };
  const servicio = new ServicioArticulos(prisma as unknown as ServicioPrisma);

  const dto = {
    nombre: 'Calculadora',
    descripcion: 'Calculadora científica',
    categoria: 'Tecnología',
    precioPorDia: 5_000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.usuario.findUnique.mockResolvedValue({
      id: 'usr-ana',
      nombre: 'Ana',
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Biblioteca',
      correoVerificado: false,
      telefonoVerificado: false,
      disponibilidad: {
        lunes: { activo: true, inicio: '08:00', fin: '12:00' },
      },
    });
    prisma.articulo.create.mockResolvedValue({
      id: 'art-1',
      titulo: 'Calculadora',
      descripcion: 'Calculadora científica',
      categoria: 'Tecnología',
      condicion: 'BUENO',
      tarifaHora: 5_000,
      ubicacion: 'Sede Barranquilla · Biblioteca',
      imagenes: [],
      disponibleDesde: new Date('2026-10-24T00:00:00.000Z'),
      disponibleHasta: new Date('2027-01-22T00:00:00.000Z'),
      activo: true,
      propietarioId: 'usr-ana',
      claveExterna: null,
      creadoEn: new Date('2026-10-24T00:00:00.000Z'),
    });
  });

  it('permite publicar sin verificar los factores si configuró disponibilidad', async () => {
    const resultado = await servicio.crear(dto, 'usr-ana');
    expect(resultado.nombre).toBe('Calculadora');
    expect(prisma.articulo.create).toHaveBeenCalledOnce();
  });

  it('exige disponibilidad semanal antes de publicar', async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({
      id: 'usr-ana',
      nombre: 'Ana',
      correoVerificado: true,
      telefonoVerificado: true,
      disponibilidad: null,
    });

    await expect(servicio.crear(dto, 'usr-ana')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.articulo.create).not.toHaveBeenCalled();
  });
});
