import { UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioAuth } from './auth.servicio.js';

describe('ServicioAuth', () => {
  const buscarUsuario = vi.fn();
  const prisma = {
    usuario: { findFirst: buscarUsuario },
  } as unknown as ServicioPrisma;
  const servicio = new ServicioAuth(prisma);

  beforeEach(() => {
    buscarUsuario.mockReset();
  });

  it('autentica con el registro de la base de datos y no devuelve el hash', async () => {
    const hashContrasena = await hash('ClaveSegura123', 4);
    buscarUsuario.mockResolvedValue({
      id: 'usuario-1',
      nombre: 'Ana',
      correo: 'ana@unisimon.edu.co',
      hashContrasena,
      telefono: null,
      telefonoVerificado: false,
      fechaVerificacionTelefono: null,
      rol: 'ESTUDIANTE',
    });

    const resultado = await servicio.iniciarSesion({
      email: 'ANA@UNISIMON.EDU.CO',
      password: 'ClaveSegura123',
    });

    expect(buscarUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          correo: { equals: 'ana@unisimon.edu.co', mode: 'insensitive' },
        },
      }),
    );
    expect(resultado.usuario).toMatchObject({
      id: 'usuario-1',
      correo: 'ana@unisimon.edu.co',
    });
    expect(resultado.usuario).not.toHaveProperty('hashContrasena');
  });

  it('rechaza las credenciales que no coinciden', async () => {
    buscarUsuario.mockResolvedValue(null);

    await expect(
      servicio.iniciarSesion({
        email: 'ana@unisimon.edu.co',
        password: 'incorrecta',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza correos fuera del dominio institucional', async () => {
    await expect(
      servicio.iniciarSesion({
        email: 'ana@example.com',
        password: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(buscarUsuario).not.toHaveBeenCalled();
  });
});
