import { Module } from '@nestjs/common';
import { ControladorReservas } from './controlador-reservas.js';
import { ServicioReservas } from './servicio-reservas.js';

@Module({
  controllers: [ControladorReservas],
  providers: [ServicioReservas],
})
export class ModuloReservas {}
