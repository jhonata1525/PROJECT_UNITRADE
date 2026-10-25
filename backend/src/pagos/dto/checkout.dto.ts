import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Datos para iniciar el pago de una reserva (HU-06).
 *
 * Se puede pagar una reserva existente con `alquilerId`, o crear la reserva
 * en el mismo paso con `articuloId` + `horas`. Los montos nunca se toman del
 * cliente: el backend calcula subtotal, comisión y total.
 */
export class CheckoutDto {
  @ApiPropertyOptional({ description: 'Reserva existente que se va a pagar' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  alquilerId?: string;

  @ApiPropertyOptional({ description: 'Artículo a reservar cuando no existe alquilerId' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  articuloId?: string;

  @ApiPropertyOptional({
    description: 'Alias de articuloId para compatibilidad con el frontend',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  itemId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 168, description: 'Horas de alquiler' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  horas?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  inicio?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fin?: Date;

  @ApiPropertyOptional({
    description: 'Alternativa al header x-usuario-id (solo desarrollo sin JWT)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  usuarioId?: string;

  @ApiPropertyOptional({ default: 'billetera', example: 'billetera' })
  @IsOptional()
  @IsIn(['billetera'])
  @MaxLength(40)
  metodo?: string;

  @ApiPropertyOptional({ enum: ['COP'], default: 'COP' })
  @IsOptional()
  @IsIn(['COP'])
  moneda?: 'COP';
}
