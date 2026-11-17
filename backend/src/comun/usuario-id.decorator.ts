import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

interface PeticionConUsuario extends Request {
  user?: { id?: string };
}

/**
 * Obtiene el id del usuario autenticado que dejó el guard de JWT en
 * `request.user`. No acepta identificadores enviados por el cliente.
 */
export const UsuarioId = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): string => {
    const peticion = contexto
      .switchToHttp()
      .getRequest<PeticionConUsuario>();

    const usuarioId = peticion.user?.id;

    if (!usuarioId) {
      throw new UnauthorizedException(
        'No hay un usuario autenticado en la petición.',
      );
    }

    return usuarioId;
  },
);
