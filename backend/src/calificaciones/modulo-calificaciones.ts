import { Module } from '@nestjs/common';
import { ControladorCalificaciones } from './controlador-calificaciones.js';
import { ServicioCalificaciones } from './servicio-calificaciones.js';

@Module({
  controllers: [ControladorCalificaciones],
  providers: [ServicioCalificaciones],
})
export class ModuloCalificaciones {}
