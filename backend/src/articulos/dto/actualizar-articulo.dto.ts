import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CrearArticuloDto } from './crear-articulo.dto.js';

export class ActualizarArticuloDto extends PartialType(CrearArticuloDto) {}

export class ListarArticulosDto {
  @ApiPropertyOptional({ description: 'Filtra por categoría exacta' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Busca en título y descripción' })
  @IsOptional()
  @IsString()
  buscar?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
