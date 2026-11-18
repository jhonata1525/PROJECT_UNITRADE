import { Module } from '@nestjs/common';
import { ControladorPagos } from './controlador-pagos.js';
import { ServicioPagos } from './servicio-pagos.js';

@Module({
  controllers: [ControladorPagos],
  providers: [ServicioPagos],
})
export class ModuloPagos {}
