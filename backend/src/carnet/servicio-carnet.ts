import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';

/** Vigencia del carnet: un año desde su emisión. */
const DURACION_CARNET_MS = 365 * 24 * 60 * 60 * 1000;

export type MotivoCarnetInvalido = 'CARNET_VENCIDO' | 'CUENTA_SUSPENDIDA';

/**
 * Emite y verifica el token público del carnet digital.
 *
 * El QR del carnet solo contiene una URL con un token opaco. Este servicio es
 * la única autoridad que decide si el carnet es válido: nunca se confía en los
 * datos que el estudiante muestre en pantalla.
 */
@Injectable()
export class ServicioCarnet {
  constructor(private readonly prisma: ServicioPrisma) {}

  /** Devuelve (y emite si hace falta) el carnet del usuario autenticado. */
  async obtenerMiCarnet(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        tokenCarnet: true,
        codigoEstudiantil: true,
        carnetVigenteHasta: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('El usuario indicado no existe.');
    }

    const vigente =
      usuario.carnetVigenteHasta !== null &&
      usuario.carnetVigenteHasta.getTime() > Date.now();

    if (usuario.tokenCarnet && usuario.codigoEstudiantil && vigente) {
      return {
        token: usuario.tokenCarnet,
        codigo: usuario.codigoEstudiantil,
        vigenteHasta: usuario.carnetVigenteHasta,
      };
    }

    return this.emitirCarnet(usuarioId, usuario.codigoEstudiantil);
  }

  /**
   * Verifica un token escaneado desde el QR.
   * Lanza 404 cuando el token no existe; para carnets existentes pero no
   * vigentes responde `valido: false` con los motivos.
   */
  async verificar(token: string) {
    const tokenLimpio = token.trim();

    const usuario = await this.prisma.usuario.findUnique({
      where: { tokenCarnet: tokenLimpio },
      select: {
        nombre: true,
        codigoEstudiantil: true,
        fotoPerfil: true,
        sede: true,
        correoVerificado: true,
        suspendidoPorMora: true,
        carnetVigenteHasta: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException({
        valido: false,
        motivo: 'CARNET_NO_ENCONTRADO',
        mensaje:
          'Este carnet no existe o fue reemplazado. Pide al estudiante que abra su carnet actualizado en UniTrade.',
      });
    }

    const ahora = new Date();
    const motivos: MotivoCarnetInvalido[] = [];

    if (
      usuario.carnetVigenteHasta === null ||
      usuario.carnetVigenteHasta.getTime() <= ahora.getTime()
    ) {
      motivos.push('CARNET_VENCIDO');
    }
    if (usuario.suspendidoPorMora) {
      motivos.push('CUENTA_SUSPENDIDA');
    }

    return {
      valido: motivos.length === 0,
      motivos,
      carnet: {
        nombre: usuario.nombre,
        codigo: usuario.codigoEstudiantil,
        fotoPerfil: usuario.fotoPerfil,
        sede: usuario.sede,
        cuentaUniTrade: usuario.suspendidoPorMora ? 'SUSPENDIDA' : 'ACTIVA',
        // UniTrade sí puede certificar que la cuenta existe y que el correo es
        // institucional. La matrícula oficial depende de la universidad, que
        // todavía no expone un listado, así que se informa como no certificada.
        universidad: {
          correoInstitucionalVerificado: usuario.correoVerificado,
          inscripcion: 'NO_VERIFICADA' as const,
        },
        vigenteHasta: usuario.carnetVigenteHasta,
      },
      verificadoEn: ahora.toISOString(),
    };
  }

  private async emitirCarnet(
    usuarioId: string,
    codigoExistente?: string | null,
  ) {
    const emitidoEn = new Date();

    for (let intento = 0; intento < 3; intento += 1) {
      const datos = {
        tokenCarnet: randomUUID(),
        codigoEstudiantil:
          codigoExistente ?? this.generarCodigoEstudiantil(emitidoEn),
        carnetVigenteHasta: new Date(emitidoEn.getTime() + DURACION_CARNET_MS),
      };

      try {
        const carnet = await this.prisma.usuario.update({
          where: { id: usuarioId },
          data: datos,
          select: {
            tokenCarnet: true,
            codigoEstudiantil: true,
            carnetVigenteHasta: true,
          },
        });

        return {
          token: carnet.tokenCarnet,
          codigo: carnet.codigoEstudiantil,
          vigenteHasta: carnet.carnetVigenteHasta,
        };
      } catch (error) {
        // Reintenta solo si chocó el índice único; cualquier otro error sube.
        if ((error as { code?: string }).code !== 'P2002') {
          throw error;
        }
      }
    }

    throw new Error('No se pudo generar un código de carnet único.');
  }

  private generarCodigoEstudiantil(fecha: Date): string {
    const anio = fecha.getFullYear();
    const sufijo = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    return `USB-${anio}-${sufijo}`;
  }
}
