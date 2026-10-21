import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto.js';
import { ServicioAuth } from './auth.servicio.js';

@ApiTags('Autenticación')
@Controller('auth')
export class ControladorAuth {
  constructor(private readonly servicioAuth: ServicioAuth) {}

  @Post('login')
  iniciarSesion(@Body() credenciales: LoginDto) {
    return this.servicioAuth.iniciarSesion(credenciales);
  }
}
