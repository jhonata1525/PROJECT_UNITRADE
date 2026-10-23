import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import type { Prisma } from '../../generated/prisma/client.js';

export class ActualizarPerfilDto {
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
