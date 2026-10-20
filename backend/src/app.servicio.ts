import { Injectable } from '@nestjs/common';

@Injectable()
export class ServicioApp {
  obtenerSaludo(): string {
    return 'UniTrade API funcionando';
  }
}
