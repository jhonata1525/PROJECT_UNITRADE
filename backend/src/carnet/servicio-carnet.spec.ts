import { NotFoundException } from '@nestjs/common';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioCarnet } from './servicio-carnet.js';

describe('ServicioCarnet', () => {
  const buscarUsuario = vi.fn();
  const actualizarUsuario = vi.fn();
  const prisma = {
    usuario: {
      findUnique: buscarUsuario,
      update: actualizarUsuario,
    },
  } as unknown as ServicioPrisma;
  const servicio = new ServicioCarnet(prisma);

  beforeEach(() => {
    buscarUsuario.mockReset();
    actualizarUsuario.mockReset();
  });

  it('emite token y código cuando el usuario todavía no tiene carnet', async () => {
    buscarUsuario.mockResolvedValue({
      tokenCarnet: null,
      codigoEstudiantil: null,
      carnetVigenteHasta: null,
    });
    actualizarUsuario.mockImplementation(({ data }) => ({
      tokenCarnet: data.tokenCarnet,
      codigoEstudiantil: data.codigoEstudiantil,
      carnetVigenteHasta: data.carnetVigenteHasta,
    }));

    const carnet = await servicio.obtenerMiCarnet('usuario-1');

    expect(carnet.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(carnet.codigo).toMatch(/^USB-\d{4}-[0-9A-F]{8}$/);
    expect(carnet.vigenteHasta).toBeInstanceOf(Date);
    expect(actualizarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usuario-1' },
        data: expect.objectContaining({
          tokenCarnet: carnet.token,
          codigoEstudiantil: carnet.codigo,
        }),
      }),
    );
  });

  it('reutiliza el carnet mientras siga vigente', async () => {
    const vigenteHasta = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    buscarUsuario.mockResolvedValue({
      tokenCarnet: 'token-vigente',
      codigoEstudiantil: 'USB-2026-ABC12345',
      carnetVigenteHasta: vigenteHasta,
    });

    const carnet = await servicio.obtenerMiCarnet('usuario-1');

    expect(carnet).toEqual({
      token: 'token-vigente',
      codigo: 'USB-2026-ABC12345',
      vigenteHasta,
    });
    expect(actualizarUsuario).not.toHaveBeenCalled();
  });

  it('renueva el token de un carnet vencido sin cambiar el código', async () => {
    buscarUsuario.mockResolvedValue({
      tokenCarnet: 'token-viejo',
      codigoEstudiantil: 'USB-2026-ABC12345',
      carnetVigenteHasta: new Date(Date.now() - 1000),
    });
    actualizarUsuario.mockImplementation(({ data }) => ({
      tokenCarnet: data.tokenCarnet,
      codigoEstudiantil: data.codigoEstudiantil,
      carnetVigenteHasta: data.carnetVigenteHasta,
    }));

    const carnet = await servicio.obtenerMiCarnet('usuario-1');

    expect(carnet.token).not.toBe('token-viejo');
    expect(carnet.codigo).toBe('USB-2026-ABC12345');
  });

  it('verifica un carnet vigente y solo devuelve datos públicos', async () => {
    buscarUsuario.mockResolvedValue({
      nombre: 'Ana Martínez',
      codigoEstudiantil: 'USB-2026-ABC12345',
      fotoPerfil: 'data:image/jpeg;base64,abc',
      sede: 'Sede Cúcuta',
      correoVerificado: true,
      suspendidoPorMora: false,
      carnetVigenteHasta: new Date(Date.now() + 60_000),
    });

    const resultado = await servicio.verificar(' token-vigente ');

    expect(resultado.valido).toBe(true);
    expect(resultado.motivos).toEqual([]);
    expect(resultado.carnet).toMatchObject({
      nombre: 'Ana Martínez',
      cuentaUniTrade: 'ACTIVA',
      universidad: {
        correoInstitucionalVerificado: true,
        inscripcion: 'NO_VERIFICADA',
      },
    });
    expect(resultado.carnet).not.toHaveProperty('correo');
    expect(resultado.carnet).not.toHaveProperty('telefono');
    expect(buscarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenCarnet: 'token-vigente' } }),
    );
  });

  it('marca como inválido un carnet vencido y una cuenta suspendida', async () => {
    buscarUsuario.mockResolvedValue({
      nombre: 'Ana Martínez',
      codigoEstudiantil: 'USB-2026-ABC12345',
      fotoPerfil: null,
      sede: null,
      correoVerificado: false,
      suspendidoPorMora: true,
      carnetVigenteHasta: new Date(Date.now() - 60_000),
    });

    const resultado = await servicio.verificar('token-viejo');

    expect(resultado.valido).toBe(false);
    expect(resultado.motivos).toEqual([
      'CARNET_VENCIDO',
      'CUENTA_SUSPENDIDA',
    ]);
    expect(resultado.carnet.cuentaUniTrade).toBe('SUSPENDIDA');
    expect(resultado.carnet.universidad).toEqual({
      correoInstitucionalVerificado: false,
      inscripcion: 'NO_VERIFICADA',
    });
  });

  it('responde 404 cuando el token no existe', async () => {
    buscarUsuario.mockResolvedValue(null);

    await expect(
      servicio.verificar('token-inexistente'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
