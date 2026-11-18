import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EstadoAlquiler } from '../../generated/prisma/enums.js';

export class ListarReservasDto {
  @ApiPropertyOptional({
    enum: ['ARRENDATARIO', 'PROPIETARIO'],
    default: 'ARRENDATARIO',
  })
  @IsOptional()
  @IsIn(['ARRENDATARIO', 'PROPIETARIO'])
  rol?: 'ARRENDATARIO' | 'PROPIETARIO';

  @ApiPropertyOptional({ enum: EstadoAlquiler })
  @IsOptional()
  @IsEnum(EstadoAlquiler)
  estado?: EstadoAlquiler;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
