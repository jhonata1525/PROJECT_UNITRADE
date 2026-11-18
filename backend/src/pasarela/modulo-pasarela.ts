import { Global, Module } from '@nestjs/common';
import { ServicioPasarelaSandbox } from './servicio-pasarela-sandbox.js';

/** Pasarela simulada compartida por los módulos de pagos y billetera. */
@Global()
@Module({
  providers: [ServicioPasarelaSandbox],
  exports: [ServicioPasarelaSandbox],
})
export class ModuloPasarela {}
