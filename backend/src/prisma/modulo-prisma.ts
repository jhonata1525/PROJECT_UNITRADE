import { Global, Module } from '@nestjs/common';
import { ServicioPrisma } from './servicio-prisma.js';

@Global()
@Module({
  providers: [ServicioPrisma],
  exports: [ServicioPrisma],
})
export class ModuloPrisma {}
