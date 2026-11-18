import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CondicionArticulo } from '../../generated/prisma/enums.js';

/**
 * Acepta los nombres actuales del frontend (`nombre`, `precioPorDia`,
 * `fotoUrl`) y los del modelo (`titulo`, `tarifaHora`, `imagenes`).
 * La validación de negocio se hace en `normalizarArticulo`.
 */
export class CrearArticuloDto {
  @ApiPropertyOptional({ description: 'Nombre del artículo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Alias de nombre' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoria?: string;

  @ApiPropertyOptional({ minimum: 1000, description: 'Tarifa por hora en COP' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  precioPorDia?: number;

  @ApiPropertyOptional({ minimum: 1000, description: 'Alias de precioPorDia' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  tarifaHora?: number;

  @ApiPropertyOptional({ enum: CondicionArticulo })
  @IsOptional()
  @IsEnum(CondicionArticulo)
  condicion?: CondicionArticulo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ubicacion?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  @ApiPropertyOptional({ description: 'Primera imagen (compatibilidad con el frontend)' })
  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  disponibleDesde?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  disponibleHasta?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ enum: ['disponible', 'en_alquiler', 'pausado'] })
  @IsOptional()
  @IsIn(['disponible', 'en_alquiler', 'pausado'])
  estado?: 'disponible' | 'en_alquiler' | 'pausado';

  @ApiPropertyOptional({
    description: 'Id del artículo en localStorage, para importaciones idempotentes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  claveExterna?: string;

  @ApiPropertyOptional({
    description: 'Alternativa al header x-usuario-id (solo desarrollo sin JWT)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  usuarioId?: string;
}
