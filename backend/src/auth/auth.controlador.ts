import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ServicioAuth } from './auth.servicio.js';

@ApiTags('Autenticación')
@ApiHeader({
  name: 'x-usuario-id',
  required: false,
  description: 'Id del usuario (temporal, hasta implementar JWT)',
})
@Controller('auth')
export class ControladorAuth {
  constructor(private readonly servicioAuth: ServicioAuth) {}

  @Post('login')
  iniciarSesion(@Body() credenciales: LoginDto) {
    return this.servicioAuth.iniciarSesion(credenciales);
  }

  @Patch('perfil')
  @ApiOperation({ summary: 'Guarda la sede y disponibilidad del usuario' })
  actualizarPerfil(
    @Body() dto: ActualizarPerfilDto,
    @UsuarioId() usuarioId: string,
  ) {
    return this.servicioAuth.actualizarPerfil(usuarioId, dto);
  }
}
