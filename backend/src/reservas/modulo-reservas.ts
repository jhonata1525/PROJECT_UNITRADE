import { Module } from '@nestjs/common';
import { ModuloPasarela } from '../pasarela/modulo-pasarela.js';
import { ControladorReservas } from './controlador-reservas.js';
import { ServicioReservas } from './servicio-reservas.js';

@Module({
  imports: [ModuloPasarela],
  controllers: [ControladorReservas],
  providers: [ServicioReservas],
})
export class ModuloReservas {}
