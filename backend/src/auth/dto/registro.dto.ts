import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegistroDto {
  @ApiProperty({ example: 'Ana Martínez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre!: string;

  @ApiProperty({ example: 'ana@unisimon.edu.co' })
  @IsEmail()
  @Matches(/^[^@\s]+@unisimon\.edu\.co$/i, {
    message: 'El correo debe pertenecer al dominio @unisimon.edu.co.',
  })
  correo!: string;

  @ApiProperty({
    example: '3001234567',
    description: 'Celular colombiano de 10 dígitos',
  })
  @IsString()
  @Matches(/^(?:\+?57)?3\d{9}$/, {
    message: 'Ingresa un celular colombiano válido de 10 dígitos.',
  })
  telefono!: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena!: string;
}
