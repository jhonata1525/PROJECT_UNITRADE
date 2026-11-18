import { Module } from '@nestjs/common';
import { ControladorArticulos } from './controlador-articulos.js';
import { ServicioArticulos } from './servicio-articulos.js';

@Module({
  controllers: [ControladorArticulos],
  providers: [ServicioArticulos],
})
export class ModuloArticulos {}
