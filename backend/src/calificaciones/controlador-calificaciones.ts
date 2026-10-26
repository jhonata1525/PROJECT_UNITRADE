import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto.js';
import { ServicioCalificaciones } from './servicio-calificaciones.js';

@ApiTags('Calificaciones')
@ApiHeader({
  name: 'x-usuario-id',
  required: false,
  description: 'Id del usuario (temporal, hasta implementar JWT)',
})
@Controller('calificaciones')
export class ControladorCalificaciones {
  constructor(
    private readonly servicioCalificaciones: ServicioCalificaciones,
  ) {}

  @Post(':alquilerId')
  @ApiOperation({
    summary: 'Califica al otro participante de un alquiler finalizado',
  })
  crear(
    @Param('alquilerId') alquilerId: string,
    @Body() dto: CrearCalificacionDto,
    @UsuarioId() usuarioId: string,
  ) {
    return this.servicioCalificaciones.crear(alquilerId, usuarioId, dto);
  }
}
