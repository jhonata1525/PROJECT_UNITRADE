import { Module } from '@nestjs/common';
import { ControladorBilletera } from './controlador-billetera.js';
import { ServicioBilletera } from './servicio-billetera.js';

@Module({
  controllers: [ControladorBilletera],
  providers: [ServicioBilletera],
})
export class ModuloBilletera {}
