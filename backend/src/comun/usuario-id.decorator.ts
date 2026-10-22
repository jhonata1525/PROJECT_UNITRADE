import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Obtiene el id del usuario autenticado.
 *
 * Mientras el módulo de autenticación no emita JWT, la API acepta el id por:
 *  1. Header `x-usuario-id` (recomendado).
 *  2. Campo `usuarioId` en el cuerpo de la petición.
 *  3. Parámetro `usuarioId` en la URL.
 *
 * Cuando se implemente el guard de JWT, este decorador se reemplaza por el
 * usuario que venga en `request.user` sin tocar los servicios.
 */
export const UsuarioId = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): string => {
    const peticion = contexto.switchToHttp().getRequest<Request>();
    const cuerpo = peticion.body as Record<string, unknown> | undefined;
    const consulta = peticion.query as Record<string, unknown> | undefined;

    const candidatos = [
      peticion.header('x-usuario-id'),
      cuerpo?.usuarioId,
      consulta?.usuarioId,
    ];

    const usuarioId = candidatos.find(
      (valor): valor is string => typeof valor === 'string' && valor.trim().length > 0,
    );

    if (!usuarioId) {
      throw new BadRequestException(
        'Falta identificar al usuario: envía el header x-usuario-id o el campo usuarioId.',
      );
    }

    return usuarioId.trim();
  },
);
