import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { EstadoAlquiler } from '../generated/prisma/enums.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ActualizarArticuloDto, ListarArticulosDto } from './dto/actualizar-articulo.dto.js';
import { CrearArticuloDto } from './dto/crear-articulo.dto.js';
import { ImportarArticulosDto } from './dto/importar-articulos.dto.js';
import {
  mapearArticulo,
  normalizarArticulo,
  type EntradaArticulo,
} from './mapeo-articulos.js';

const ESTADOS_CON_ALQUILER_ACTIVO: EstadoAlquiler[] = [
  EstadoAlquiler.PENDIENTE_ENTREGA,
  EstadoAlquiler.ACTIVO,
  EstadoAlquiler.PENDIENTE_DEVOLUCION,
  EstadoAlquiler.EN_MORA,
];

/**
 * CRUD de artículos publicado en la tabla `articulo`.
 *
 * Reemplaza la persistencia en localStorage de "Mis Artículos": todos los
 * usuarios (incluido el compañero) leen y escriben la misma tabla. La
 * importación acepta el formato antiguo del navegador y es idempotente por
 * `claveExterna` (el `id` que generaba localStorage).
 */
@Injectable()
export class ServicioArticulos {
  constructor(private readonly prisma: ServicioPrisma) {}

  async listarMios(usuarioId: string) {
    await this.obtenerUsuario(usuarioId);

    const articulos = await this.prisma.articulo.findMany({
      where: { propietarioId: usuarioId },
      orderBy: { creadoEn: 'desc' },
      include: {
        alquileres: {
          where: { estado: { in: ESTADOS_CON_ALQUILER_ACTIVO } },
          select: { id: true },
          take: 1,
        },
      },
    });

    return articulos.map((articulo) =>
      mapearArticulo(articulo, articulo.alquileres.length > 0),
    );
  }

  async listarCatalogo(dto: ListarArticulosDto) {
    const where: Prisma.ArticuloWhereInput = {
      activo: true,
      ...(dto.categoria ? { categoria: dto.categoria } : {}),
      ...(dto.buscar
        ? {
            OR: [
              { titulo: { contains: dto.buscar, mode: 'insensitive' } },
              { descripcion: { contains: dto.buscar, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const articulos = await this.prisma.articulo.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: dto.limite ?? 30,
      include: {
        propietario: { select: { id: true, nombre: true, sede: true } },
        alquileres: {
          where: { estado: { in: ESTADOS_CON_ALQUILER_ACTIVO } },
          select: { id: true },
          take: 1,
        },
      },
    });

    return articulos.map((articulo) => ({
      ...mapearArticulo(articulo, articulo.alquileres.length > 0),
      propietario: articulo.propietario,
    }));
  }

  async obtenerDetalle(id: string) {
    const articulo = await this.prisma.articulo.findUnique({
      where: { id },
      include: {
        propietario: { select: { id: true, nombre: true, sede: true } },
      },
    });

    if (!articulo) {
      throw new NotFoundException('El artículo no existe.');
    }

    return {
      ...mapearArticulo(articulo, await this.tieneAlquilerActivo(id)),
      propietario: articulo.propietario,
    };
  }

  async crear(dto: CrearArticuloDto, usuarioId: string) {
    const usuario = await this.obtenerUsuario(usuarioId);
    const { datos, error } = normalizarArticulo(dto, {
      ubicacionPorDefecto: this.ubicacionPorDefecto(usuario),
    });

    if (error || !datos) {
      throw new BadRequestException(error ?? 'Datos del artículo inválidos.');
    }

    if (datos.claveExterna) {
      const existente = await this.prisma.articulo.findFirst({
        where: { propietarioId: usuarioId, claveExterna: datos.claveExterna },
      });

      if (existente) {
        const actualizado = await this.prisma.articulo.update({
          where: { id: existente.id },
          data: datos,
        });
        return mapearArticulo(
          actualizado,
          await this.tieneAlquilerActivo(actualizado.id),
        );
      }
    }

    const articulo = await this.prisma.articulo.create({
      data: { ...datos, propietarioId: usuarioId },
    });

    return mapearArticulo(articulo);
  }

  async actualizar(id: string, dto: ActualizarArticuloDto, usuarioId: string) {
    const actual = await this.obtenerPropio(id, usuarioId);

    const fusion: EntradaArticulo = {
      titulo: dto.titulo ?? dto.nombre ?? actual.titulo,
      descripcion: dto.descripcion ?? actual.descripcion,
      categoria: dto.categoria ?? actual.categoria,
      condicion: dto.condicion ?? actual.condicion,
      tarifaHora: dto.tarifaHora ?? dto.precioPorDia ?? actual.tarifaHora,
      ubicacion: dto.ubicacion ?? actual.ubicacion,
      imagenes:
        dto.imagenes ??
        (dto.fotoUrl !== undefined
          ? dto.fotoUrl
            ? [dto.fotoUrl]
            : []
          : actual.imagenes),
      disponibleDesde: dto.disponibleDesde ?? actual.disponibleDesde,
      disponibleHasta: dto.disponibleHasta ?? actual.disponibleHasta,
      activo:
        dto.activo ??
        (dto.estado ? dto.estado !== 'pausado' : actual.activo),
    };

    const { datos, error } = normalizarArticulo(fusion, {
      ubicacionPorDefecto: actual.ubicacion,
      ahora: actual.disponibleDesde,
    });

    if (error || !datos) {
      throw new BadRequestException(error ?? 'Datos del artículo inválidos.');
    }

    const articulo = await this.prisma.articulo.update({
      where: { id },
      data: datos,
    });

    return mapearArticulo(
      articulo,
      await this.tieneAlquilerActivo(articulo.id),
    );
  }

  async eliminar(id: string, usuarioId: string) {
    await this.obtenerPropio(id, usuarioId);

    try {
      await this.prisma.articulo.delete({ where: { id } });
      return {
        eliminado: true,
        desactivado: false,
        mensaje: 'Artículo eliminado de la tabla.',
      };
    } catch (error) {
      // Si tiene reservas, la FK Restrict impide borrarlo: se pausa.
      if ((error as { code?: string }).code === 'P2003') {
        await this.prisma.articulo.update({
          where: { id },
          data: { activo: false },
        });
        return {
          eliminado: true,
          desactivado: true,
          mensaje:
            'El artículo tiene reservas asociadas, así que se pausó en lugar de borrarse.',
        };
      }
      throw error;
    }
  }

  /**
   * Importa los artículos que el usuario tenía en localStorage.
   * Es idempotente: si ya existen (misma claveExterna o mismo título) se
   * actualizan en lugar de duplicarse.
   */
  async importar(dto: ImportarArticulosDto, usuarioId: string) {
    const usuario = await this.obtenerUsuario(usuarioId);
    const ubicacionPorDefecto = this.ubicacionPorDefecto(usuario);

    const entradas = dto.articulos.slice(0, 200);
    let creados = 0;
    let actualizados = 0;
    let omitidos = 0;
    const errores: Array<{ indice: number; referencia: string; motivo: string }> = [];

    for (const [indice, entrada] of entradas.entries()) {
      if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) {
        omitidos += 1;
        errores.push({
          indice,
          referencia: '',
          motivo: 'El elemento no es un objeto de artículo.',
        });
        continue;
      }

      const { datos, error } = normalizarArticulo(entrada as EntradaArticulo, {
        ubicacionPorDefecto,
      });

      if (error || !datos) {
        omitidos += 1;
        errores.push({
          indice,
          referencia: String(
            entrada.claveExterna ?? entrada.id ?? entrada.nombre ?? '',
          ),
          motivo: error ?? 'Artículo inválido.',
        });
        continue;
      }

      const existente = datos.claveExterna
        ? await this.prisma.articulo.findFirst({
            where: {
              propietarioId: usuarioId,
              claveExterna: datos.claveExterna,
            },
          })
        : await this.prisma.articulo.findFirst({
            where: { propietarioId: usuarioId, titulo: datos.titulo },
          });

      if (existente) {
        await this.prisma.articulo.update({
          where: { id: existente.id },
          data: datos,
        });
        actualizados += 1;
      } else {
        await this.prisma.articulo.create({
          data: { ...datos, propietarioId: usuarioId },
        });
        creados += 1;
      }
    }

    return {
      total: dto.articulos.length,
      creados,
      actualizados,
      omitidos,
      errores,
      articulos: await this.listarMios(usuarioId),
    };
  }

  private async obtenerPropio(id: string, usuarioId: string) {
    const articulo = await this.prisma.articulo.findUnique({ where: { id } });

    if (!articulo) {
      throw new NotFoundException('El artículo no existe.');
    }
    if (articulo.propietarioId !== usuarioId) {
      throw new ForbiddenException('El artículo pertenece a otro usuario.');
    }

    return articulo;
  }

  private async obtenerUsuario(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        sede: true,
        puntoEntrega: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario indicado no existe.');
    }

    return usuario;
  }

  private ubicacionPorDefecto(usuario: {
    sede: string | null;
    puntoEntrega: string | null;
  }): string {
    const partes = [usuario.sede, usuario.puntoEntrega].filter(Boolean);
    return partes.length > 0 ? partes.join(' · ') : 'Campus universitario';
  }

  private async tieneAlquilerActivo(articuloId: string): Promise<boolean> {
    const cantidad = await this.prisma.alquiler.count({
      where: {
        articuloId,
        estado: { in: ESTADOS_CON_ALQUILER_ACTIVO },
      },
    });

    return cantidad > 0;
  }
}
