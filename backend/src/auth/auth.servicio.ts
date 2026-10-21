import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
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
      },
    };
  }
}
