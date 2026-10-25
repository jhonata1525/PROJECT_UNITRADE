import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { RegistroDto } from './dto/registro.dto.js';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class ServicioAuth {
  constructor(private readonly prisma: ServicioPrisma) {}

  async registrar(dto: RegistroDto) {
    const correo = dto.correo.trim().toLowerCase();
    if (!/^[^@\s]+@unisimon\.edu\.co$/.test(correo)) {
      throw new BadRequestException(
        'El registro solo está permitido con correo @unisimon.edu.co.',
      );
    }

    const existente = await this.prisma.usuario.findFirst({
      where: { correo: { equals: correo, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existente) {
      throw new ConflictException(
        'Ya existe una cuenta con ese correo institucional.',
      );
    }

    const digitosTelefono = dto.telefono.replace(/\D/g, '');
    const telefono = digitosTelefono.startsWith('57')
      ? `+${digitosTelefono}`
      : `+57${digitosTelefono}`;
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre.trim(),
        correo,
        telefono,
        hashContrasena: await hash(dto.contrasena, 10),
        correoVerificado: false,
        telefonoVerificado: false,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        telefono: true,
        correoVerificado: true,
        telefonoVerificado: true,
        rol: true,
      },
    });

    return {
      usuario,
      mensaje:
        'Cuenta creada. El correo y WhatsApp figuran sin verificar; verifica ambos datos antes de publicar o alquilar artículos.',
    };
  }

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
        correoVerificado: true,
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
        correoVerificado: usuario.correoVerificado,
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
      select: { id: true, telefono: true },
    });

    if (!usuarioExiste) {
      throw new NotFoundException('El usuario indicado no existe.');
    }

    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.fotoPerfil !== undefined ? { fotoPerfil: dto.fotoPerfil } : {}),
        ...(dto.telefono
          ? {
              telefono: this.normalizarTelefono(dto.telefono),
              ...(this.normalizarTelefono(dto.telefono) !==
              usuarioExiste.telefono
                ? {
                    telefonoVerificado: false,
                    fechaVerificacionTelefono: null,
                  }
                : {}),
            }
          : {}),
        sede: dto.sede,
        puntoEntrega: dto.puntoEntrega,
        disponibilidad: dto.disponibilidad,
      },
      select: {
        id: true,
        nombre: true,
        fotoPerfil: true,
        telefono: true,
        telefonoVerificado: true,
        sede: true,
        puntoEntrega: true,
        disponibilidad: true,
      },
    });
  }

  private normalizarTelefono(telefono: string): string {
    const digitos = telefono.replace(/\D/g, '');
    return digitos.startsWith('57') ? `+${digitos}` : `+57${digitos}`;
  }
}
