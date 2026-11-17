import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Publico } from './auth/decorador-publico.js';
import { ServicioApp } from './app.servicio.js';

@ApiTags('Salud')
@Publico()
@Controller()
export class ControladorApp {
  constructor(private readonly servicioApp: ServicioApp) {}

  @Get()
  obtenerSaludo(): string {
    return this.servicioApp.obtenerSaludo();
  }

  @Get('salud')
  obtenerEstadoSalud() {
    return {
      estado: 'ok',
      servicio: 'UniTrade API',
      fecha: new Date().toISOString(),
    };
  }
}
