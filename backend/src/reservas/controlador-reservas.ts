import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import { ListarReservasDto } from './dto/listar-reservas.dto.js';
import { ServicioReservas } from './servicio-reservas.js';

@ApiTags('Reservas')
@ApiHeader({
  name: 'x-usuario-id',
  required: false,
  description: 'Id del usuario (temporal, hasta implementar JWT)',
})
@Controller('reservas')
export class ControladorReservas {
  constructor(private readonly servicioReservas: ServicioReservas) {}

  @Get()
  @ApiOperation({ summary: 'Lista las reservas del usuario con su desglose' })
  listar(@UsuarioId() usuarioId: string, @Query() dto: ListarReservasDto) {
    return this.servicioReservas.listar(usuarioId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una reserva con comisión y estado del pago' })
  obtener(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    return this.servicioReservas.obtener(id, usuarioId);
  }
}
