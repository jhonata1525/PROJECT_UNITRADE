import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare } from 'bcryptjs';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class ServicioAuth {
  constructor(private readonly prisma: ServicioPrisma) {}

  async iniciarSesion({ email, password }: LoginDto) {
    const correo = email.trim().toLowerCase();

    if (!correo.endsWith('@unisimon.edu.co')) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: { correo: { equals: correo, mode: 'insensitive' } },
      select: {
        id: true,
        nombre: true,
        correo: true,
        hashContrasena: true,
        telefono: true,
        telefonoVerificado: true,
        fechaVerificacionTelefono: true,
        rol: true,
        sede: true,
        puntoEntrega: true,
        disponibilidad: true,
        fotoPerfil: true,
      },
    });

    if (!usuario || !(await compare(password, usuario.hashContrasena))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        telefonoVerificado: usuario.telefonoVerificado,
        fechaVerificacionTelefono: usuario.fechaVerificacionTelefono,
        rol: usuario.rol,
        sede: usuario.sede,
        puntoEntrega: usuario.puntoEntrega,
        disponibilidad: usuario.disponibilidad,
        fotoPerfil: usuario.fotoPerfil,
      },
    };
  }

  async actualizarPerfil(usuarioId: string, dto: ActualizarPerfilDto) {
    const usuarioExiste = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuarioExiste) {
      throw new NotFoundException('El usuario indicado no existe.');
    }

    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        sede: dto.sede,
        puntoEntrega: dto.puntoEntrega,
        disponibilidad: dto.disponibilidad,
      },
      select: {
        id: true,
        sede: true,
        puntoEntrega: true,
        disponibilidad: true,
      },
    });
  }
}
