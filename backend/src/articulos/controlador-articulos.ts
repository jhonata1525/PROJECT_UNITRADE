import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuarioId } from '../comun/usuario-id.decorator.js';
import {
  ActualizarArticuloDto,
  ListarArticulosDto,
} from './dto/actualizar-articulo.dto.js';
import { CrearArticuloDto } from './dto/crear-articulo.dto.js';
import { ImportarArticulosDto } from './dto/importar-articulos.dto.js';
import { ServicioArticulos } from './servicio-articulos.js';

@ApiTags('Artículos')
@ApiHeader({
  name: 'x-usuario-id',
  required: false,
  description: 'Id del usuario (temporal, hasta implementar JWT)',
})
@Controller('articulos')
export class ControladorArticulos {
  constructor(private readonly servicioArticulos: ServicioArticulos) {}

  @Get()
  @ApiOperation({ summary: 'Catálogo de artículos activos' })
  listarCatalogo(@Query() dto: ListarArticulosDto) {
    return this.servicioArticulos.listarCatalogo(dto);
  }

  @Get('mios')
  @ApiOperation({ summary: 'Artículos publicados por el usuario' })
  listarMios(@UsuarioId() usuarioId: string) {
    return this.servicioArticulos.listarMios(usuarioId);
  }

  @Post('importar')
  @ApiOperation({
    summary: 'Importa artículos desde localStorage a la tabla articulo',
    description:
      'Idempotente: usa el id del navegador como claveExterna para no duplicar.',
  })
  importar(
    @Body() dto: ImportarArticulosDto,
    @UsuarioId() usuarioId: string,
  ) {
    return this.servicioArticulos.importar(dto, usuarioId);
  }

  @Post()
  @ApiOperation({ summary: 'Publica un artículo en la tabla articulo' })
  crear(@Body() dto: CrearArticuloDto, @UsuarioId() usuarioId: string) {
    return this.servicioArticulos.crear(dto, usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un artículo' })
  obtener(@Param('id') id: string) {
    return this.servicioArticulos.obtenerDetalle(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un artículo propio' })
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarArticuloDto,
    @UsuarioId() usuarioId: string,
  ) {
    return this.servicioArticulos.actualizar(id, dto, usuarioId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina o pausa un artículo propio' })
  eliminar(@Param('id') id: string, @UsuarioId() usuarioId: string) {
    return this.servicioArticulos.eliminar(id, usuarioId);
  }
}
