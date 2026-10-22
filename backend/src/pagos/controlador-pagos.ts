import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import { CheckoutDto } from './dto/checkout.dto.js';
import { HistorialPagosDto } from './dto/historial-pagos.dto.js';
import { ServicioPagos } from './servicio-pagos.js';

@ApiTags('Pagos (HU-06)')
@Controller('payments')
export class ControladorPagos {
  constructor(private readonly servicioPagos: ServicioPagos) {}

  @Post('checkout')
  @ApiHeader({
    name: 'x-usuario-id',
    required: false,
    description: 'Id del usuario que paga (temporal, hasta implementar JWT)',
  })
  @ApiHeader({
    name: 'idempotency-key',
    required: false,
    description: 'Evita cobrar dos veces la misma intención de pago',
  })
  @ApiOperation({
    summary: 'Procesa el pago de una reserva y reparte la comisión',
    description:
      'Calcula el 12% de comisión, simula el cobro en sandbox y abona al propietario el subtotal menos la comisión.',
  })
  checkout(
    @Body() dto: CheckoutDto,
    @UsuarioId() usuarioId: string,
    @Headers('idempotency-key') claveIdempotencia?: string,
  ) {
    return this.servicioPagos.checkout(dto, usuarioId, claveIdempotencia);
  }

  @Get('status/:transactionId')
  @ApiOperation({ summary: 'Consulta el estado de una transacción por id de pago o de pasarela' })
  consultarEstado(@Param('transactionId') transactionId: string) {
    return this.servicioPagos.consultarEstado(transactionId);
  }

  @Get('history')
  @ApiHeader({
    name: 'x-usuario-id',
    required: false,
    description: 'Id del usuario (temporal, hasta implementar JWT)',
  })
  @ApiOperation({ summary: 'Historial de pagos realizados o recibidos' })
  historial(@UsuarioId() usuarioId: string, @Query() dto: HistorialPagosDto) {
    return this.servicioPagos.historial(usuarioId, dto);
  }
}
