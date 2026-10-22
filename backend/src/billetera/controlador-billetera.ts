import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import { DepositoDto } from './dto/deposito.dto.js';
import { HistorialBilleteraDto } from './dto/historial-billetera.dto.js';
import { SolicitarRetiroDto } from './dto/solicitar-retiro.dto.js';
import { ServicioBilletera } from './servicio-billetera.js';

@ApiTags('Billetera (HU-10)')
@ApiHeader({
  name: 'x-usuario-id',
  required: false,
  description: 'Id del usuario (temporal, hasta implementar JWT)',
})
@Controller('wallet')
export class ControladorBilletera {
  constructor(private readonly servicioBilletera: ServicioBilletera) {}

  @Get('balance')
  @ApiOperation({ summary: 'Saldo disponible, pendiente y total ganado' })
  obtenerBalance(@UsuarioId() usuarioId: string) {
    return this.servicioBilletera.obtenerBalance(usuarioId);
  }

  @Get('historial')
  @ApiOperation({ summary: 'Historial de transacciones de la billetera' })
  obtenerHistorial(
    @UsuarioId() usuarioId: string,
    @Query() dto: HistorialBilleteraDto,
  ) {
    return this.servicioBilletera.obtenerHistorial(usuarioId, dto);
  }

  @Post('withdraw')
  @ApiOperation({
    summary: 'Solicita un retiro y simula la dispersión (payout) en sandbox',
    description:
      'Valida el saldo, retiene el monto, ejecuta el payout sandbox y registra la transacción.',
  })
  solicitarRetiro(@Body() dto: SolicitarRetiroDto, @UsuarioId() usuarioId: string) {
    return this.servicioBilletera.solicitarRetiro(dto, usuarioId);
  }

  @Post('deposit')
  @ApiOperation({
    summary: 'Recarga saldo de prueba (solo sandbox)',
    description:
      'Acredita saldo simulado en la billetera para demostrar el flujo de retiro. No cobra dinero real.',
  })
  recargarSandbox(@Body() dto: DepositoDto, @UsuarioId() usuarioId: string) {
    return this.servicioBilletera.recargarSandbox(dto, usuarioId);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Lista las solicitudes de retiro del usuario' })
  obtenerRetiros(
    @UsuarioId() usuarioId: string,
    @Query('limite') limite?: string,
  ) {
    const cantidad = Number(limite ?? '20');
    return this.servicioBilletera.obtenerRetiros(
      usuarioId,
      Number.isFinite(cantidad) ? cantidad : 20,
    );
  }

  @Get('entidades')
  @ApiOperation({ summary: 'Métodos de retiro disponibles' })
  listarEntidades() {
    return this.servicioBilletera.listarEntidades();
  }
}
