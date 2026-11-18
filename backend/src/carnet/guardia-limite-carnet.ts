import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Límite simple en memoria para el endpoint público de verificación.
 * Evita que alguien enumere tokens a fuerza bruta. En producción conviene
 * moverlo a Redis o al API gateway.
 */
@Injectable()
export class GuardiaLimiteCarnet implements CanActivate {
  private readonly visitas = new Map<
    string,
    { conteo: number; reiniciaEn: number }
  >();
  private readonly maximo = 30;
  private readonly ventanaMs = 60_000;

  canActivate(contexto: ExecutionContext): boolean {
    const peticion = contexto.switchToHttp().getRequest<Request>();
    const clave = peticion.ip ?? 'desconocida';
    const ahora = Date.now();
    const registro = this.visitas.get(clave);

    if (!registro || registro.reiniciaEn <= ahora) {
      this.visitas.set(clave, { conteo: 1, reiniciaEn: ahora + this.ventanaMs });
      this.limpiarVentanasVencidas(ahora);
      return true;
    }

    if (registro.conteo >= this.maximo) {
      throw new HttpException(
        'Demasiadas verificaciones seguidas. Intenta de nuevo en un minuto.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    registro.conteo += 1;
    return true;
  }

  private limpiarVentanasVencidas(ahora: number) {
    if (this.visitas.size < 1_000) return;

    for (const [clave, registro] of this.visitas) {
      if (registro.reiniciaEn <= ahora) {
        this.visitas.delete(clave);
      }
    }
  }
}
