import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MetodoRetiro } from '../../generated/prisma/enums.js';

export class SolicitarRetiroDto {
  @ApiProperty({ enum: MetodoRetiro, example: MetodoRetiro.NEQUI })
  @IsEnum(MetodoRetiro)
  metodo!: MetodoRetiro;

  @ApiProperty({
    description: 'Celular (Nequi/Daviplata) o número de cuenta bancaria',
    example: '3001234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6,20}$/, {
    message: 'La cuenta debe contener entre 6 y 20 dígitos, sin espacios ni guiones.',
  })
  cuenta!: string;

  @ApiProperty({ minimum: 10000, maximum: 5000000, example: 50000 })
  @Type(() => Number)
  @IsInt()
  @Min(10000, { message: 'El retiro mínimo es de 10.000 COP.' })
  @Max(5000000, { message: 'El retiro máximo por operación es de 5.000.000 COP.' })
  monto!: number;

  @ApiPropertyOptional({
    description: 'Alternativa al header x-usuario-id (solo desarrollo sin JWT)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  usuarioId?: string;

  @ApiPropertyOptional({
    description: 'Solo sandbox: fuerza el rechazo de la dispersión para probar el error',
  })
  @IsOptional()
  @IsBoolean()
  forzarFallo?: boolean;
}
