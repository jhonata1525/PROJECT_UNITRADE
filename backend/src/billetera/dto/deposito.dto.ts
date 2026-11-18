import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Recarga de saldo de prueba (solo sandbox).
 *
 * No existe una pasarela real detrás: sirve para demostrar la billetera y el
 * flujo de retiro en el entorno académico. En producción este endpoint se
 * reemplazaría por la confirmación de un pago real.
 */
export class DepositoDto {
  @ApiProperty({ minimum: 10000, maximum: 5000000, example: 100000 })
  @Type(() => Number)
  @IsInt()
  @Min(10000, { message: 'La recarga mínima es de 10.000 COP.' })
  @Max(5000000, { message: 'La recarga máxima es de 5.000.000 COP.' })
  monto!: number;

  @ApiPropertyOptional({
    example: 'Nequi',
    description: 'Medio de pago simulado que origina la recarga',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  metodo?: string;

  @ApiPropertyOptional({
    description: 'Alternativa al header x-usuario-id (solo desarrollo sin JWT)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  usuarioId?: string;
}
