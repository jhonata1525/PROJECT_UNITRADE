import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ControladorApp } from './app.controlador.js';
import { ServicioApp } from './app.servicio.js';
import { ControladorAuth } from './auth/auth.controlador.js';
import { ServicioAuth } from './auth/auth.servicio.js';
import { GuardiaJwt } from './auth/guardia-jwt.js';
import { ModuloBilletera } from './billetera/modulo-billetera.js';
import { ModuloPagos } from './pagos/modulo-pagos.js';
import { ModuloPasarela } from './pasarela/modulo-pasarela.js';
import { ModuloArticulos } from './articulos/modulo-articulos.js';
import { ModuloPrisma } from './prisma/modulo-prisma.js';
import { ModuloReservas } from './reservas/modulo-reservas.js';
import { ModuloCalificaciones } from './calificaciones/modulo-calificaciones.js';
import { ModuloCarnet } from './carnet/modulo-carnet.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN') ?? '7d',
        },
      }),
    }),
    ModuloPrisma,
    ModuloPasarela,
    ModuloPagos,
    ModuloBilletera,
    ModuloReservas,
    ModuloCalificaciones,
    ModuloCarnet,
    ModuloArticulos,
  ],
  controllers: [ControladorApp, ControladorAuth],
  providers: [
    ServicioApp,
    ServicioAuth,
    GuardiaJwt,
    { provide: APP_GUARD, useClass: GuardiaJwt },
  ],
})
export class ModuloApp {}
