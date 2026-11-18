import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmarDevolucionDto {
  @ApiProperty({
    example: '4821',
    description: 'Código de devolución de 4 dígitos',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(120)
  codigo: string;
}
