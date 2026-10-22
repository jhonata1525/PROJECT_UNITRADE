import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class HistorialPagosDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;

  @ApiPropertyOptional({
    enum: ['ARRENDATARIO', 'PROPIETARIO'],
    default: 'ARRENDATARIO',
    description: 'Pagos realizados o pagos recibidos por el usuario',
  })
  @IsOptional()
  @IsIn(['ARRENDATARIO', 'PROPIETARIO'])
  rol?: 'ARRENDATARIO' | 'PROPIETARIO';
}
