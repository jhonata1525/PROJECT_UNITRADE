import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ControladorApp } from './app.controlador.js';
import { ServicioApp } from './app.servicio.js';
import { ModuloPrisma } from './prisma/modulo-prisma.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ModuloPrisma,
  ],
  controllers: [ControladorApp],
  providers: [ServicioApp],
})
export class ModuloApp {}
