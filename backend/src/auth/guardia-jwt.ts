import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { CLAVE_RUTA_PUBLICA } from './decorador-publico.js';

export interface UsuarioAutenticado {
  id: string;
  rol: string;
}

interface PeticionConUsuario extends Request {
  user?: UsuarioAutenticado;
}

@Injectable()
export class GuardiaJwt implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(
      CLAVE_RUTA_PUBLICA,
      [contexto.getHandler(), contexto.getClass()],
    );

    if (esPublica) {
      return true;
    }

    const peticion = contexto.switchToHttp().getRequest<PeticionConUsuario>();
    const token = this.extraerToken(peticion);

    if (!token) {
      throw new UnauthorizedException(
        'Falta el token de autenticación en el header Authorization.',
      );
    }

    try {
      const carga = await this.jwt.verifyAsync<{ sub: string; rol: string }>(
        token,
      );

      peticion.user = { id: carga.sub, rol: carga.rol };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  private extraerToken(peticion: Request): string | null {
    const cabecera = peticion.header('authorization');
    if (!cabecera) {
      return null;
    }

    const [tipo, token] = cabecera.split(' ');
    if (tipo?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}
