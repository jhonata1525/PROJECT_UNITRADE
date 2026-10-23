import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { ModuloApp } from './app.modulo.js';

async function iniciar() {
  const app = await NestFactory.create<NestExpressApplication>(ModuloApp, {
    // Se desactiva el parser por defecto (100 kb) porque las fotos de los
    // artículos viajan como data URL dentro del JSON.
    bodyParser: false,
  });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Todas las rutas quedan bajo http://localhost:8081/api
  app.setGlobalPrefix('api');

  // Permite que Vite (5173) consuma la API
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? 'http://localhost:5173',
    credentials: true,
  });

  // Valida los DTOs y elimina propiedades que no estén declaradas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentación interactiva en http://localhost:8081/api/docs
  const configuracion = new DocumentBuilder()
    .setTitle('UniTrade API')
    .setDescription(
      'API de alquiler universitario: usuarios, artículos, alquileres, billetera y pagos',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, configuracion);
  SwaggerModule.setup('api/docs', app, documento);

  const puerto = process.env.PORT ?? 8081;
  await app.listen(puerto);
  console.log(`UniTrade API escuchando en http://localhost:${puerto}/api`);
  console.log(`Swagger: http://localhost:${puerto}/api/docs`);
}
await iniciar();
