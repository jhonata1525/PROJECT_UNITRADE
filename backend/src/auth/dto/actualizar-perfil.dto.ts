import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { Prisma } from '../../generated/prisma/client.js';

export class ActualizarPerfilDto {
  @ApiProperty({ required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    maxLength: 250_000,
    description:
      'Foto de perfil comprimida en formato data URL o null para quitarla',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250_000)
  fotoPerfil?: string | null;

  @ApiProperty({ required: false, example: '+573001234567' })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?57)?3\d{9}$/)
  telefono?: string;

  @ApiProperty()
  @IsString()
  sede!: string;

  @ApiProperty()
  @IsString()
  puntoEntrega!: string;

  @ApiProperty({
    description: 'Franjas de disponibilidad por día de la semana',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  disponibilidad!: Prisma.InputJsonValue;
}
