import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class ConfirmarDevolucionDto {
  @ApiProperty({
    example: '4821',
    description: 'Código de devolución de 4 dígitos',
  })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  codigo: string;
}
