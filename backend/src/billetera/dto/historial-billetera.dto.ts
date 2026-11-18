import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TipoTransaccion } from '../../generated/prisma/enums.js';

export class HistorialBilleteraDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @ApiPropertyOptional({ enum: TipoTransaccion })
  @IsOptional()
  @IsEnum(TipoTransaccion)
  tipo?: TipoTransaccion;
}
