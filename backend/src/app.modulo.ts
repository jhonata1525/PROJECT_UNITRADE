import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ControladorApp } from './app.controlador.js';
import { ServicioApp } from './app.servicio.js';
import { ControladorAuth } from './auth/auth.controlador.js';
import { ServicioAuth } from './auth/auth.servicio.js';
import { ModuloPrisma } from './prisma/modulo-prisma.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ModuloPrisma,
  ],
  controllers: [ControladorApp, ControladorAuth],
  providers: [ServicioApp, ServicioAuth],
})
export class ModuloApp {}
