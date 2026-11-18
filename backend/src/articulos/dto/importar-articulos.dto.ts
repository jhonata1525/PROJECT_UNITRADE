import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class ImportarArticulosDto {
  @ApiProperty({
    type: [Object],
    description:
      'Artículos exportados de localStorage (clave unitrade_mis_articulos). Se aceptan los nombres del frontend.',
  })
  @IsArray()
  @ArrayMaxSize(200)
  @IsObject({ each: true })
  articulos!: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: 'Alternativa al header x-usuario-id (solo desarrollo sin JWT)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  usuarioId?: string;
}
