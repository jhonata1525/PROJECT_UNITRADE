import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import { GuardiaLimiteCarnet } from './guardia-limite-carnet.js';
import { ServicioCarnet } from './servicio-carnet.js';

@ApiTags('Carnet digital')
@Controller('carnet')
export class ControladorCarnet {
  constructor(private readonly servicioCarnet: ServicioCarnet) {}

  @Get('mio')
  @ApiHeader({
    name: 'x-usuario-id',
    required: true,
    description: 'Id del usuario dueño del carnet',
  })
  @ApiOperation({
    summary: 'Obtiene (o emite) el token y código del carnet del usuario',
  })
  obtenerMio(@UsuarioId() usuarioId: string) {
    return this.servicioCarnet.obtenerMiCarnet(usuarioId);
  }

  @Get('verificar/:token')
  @UseGuards(GuardiaLimiteCarnet)
  @ApiOperation({
    summary: 'Verifica públicamente un carnet por el token de su QR',
    description:
      'No requiere sesión. Devuelve solo datos públicos y el estado de la cuenta en UniTrade.',
  })
  verificar(@Param('token') token: string) {
    return this.servicioCarnet.verificar(token);
  }
}
