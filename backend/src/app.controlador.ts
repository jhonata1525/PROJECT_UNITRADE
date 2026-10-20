import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServicioApp } from './app.servicio.js';

@ApiTags('Salud')
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
