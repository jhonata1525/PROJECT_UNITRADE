import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { Publico } from './decorador-publico.js';
import { ServicioAuth } from './auth.servicio.js';

@ApiTags('Autenticación')
@Controller('auth')
export class ControladorAuth {
  constructor(private readonly servicioAuth: ServicioAuth) {}

  @Publico()
  @Post('login')
  iniciarSesion(@Body() credenciales: LoginDto) {
    return this.servicioAuth.iniciarSesion(credenciales);
  }

  @Publico()
  @Post('register')
  @ApiOperation({ summary: 'Registra una cuenta con correo institucional' })
  registrar(@Body() dto: RegistroDto) {
    return this.servicioAuth.registrar(dto);
  }

  @Publico()
  @Post('registro')
  @ApiOperation({
    summary: 'Ruta heredada para registrar una cuenta con correo institucional',
  })
  registrarCompatibilidad(@Body() dto: RegistroDto) {
    return this.servicioAuth.registrar(dto);
  }

  @Get('perfil')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulta el promedio de calificaciones del usuario' })
  obtenerResumenCalificacion(@UsuarioId() usuarioId: string) {
    return this.servicioAuth.obtenerResumenCalificacion(usuarioId);
  }

  @Patch('perfil')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Actualiza los datos de contacto, foto, sede, punto de entrega y disponibilidad del usuario',
  })
  actualizarPerfil(
    @Body() dto: ActualizarPerfilDto,
    @UsuarioId() usuarioId: string,
  ) {
    return this.servicioAuth.actualizarPerfil(usuarioId, dto);
  }
}
