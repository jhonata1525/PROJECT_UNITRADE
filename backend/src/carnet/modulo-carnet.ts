import { Module } from '@nestjs/common';
import { ControladorCarnet } from './controlador-carnet.js';
import { GuardiaLimiteCarnet } from './guardia-limite-carnet.js';
import { ServicioCarnet } from './servicio-carnet.js';

@Module({
  controllers: [ControladorCarnet],
  providers: [ServicioCarnet, GuardiaLimiteCarnet],
})
export class ModuloCarnet {}
