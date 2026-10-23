import { UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioAuth } from './auth.servicio.js';

describe('ServicioAuth', () => {
  const buscarUsuario = vi.fn();
  const buscarUsuarioPorId = vi.fn();
  const actualizarUsuario = vi.fn();
  const prisma = {
    usuario: {
      findFirst: buscarUsuario,
      findUnique: buscarUsuarioPorId,
      update: actualizarUsuario,
    },
  } as unknown as ServicioPrisma;
  const servicio = new ServicioAuth(prisma);

  beforeEach(() => {
    buscarUsuario.mockReset();
    buscarUsuarioPorId.mockReset();
    actualizarUsuario.mockReset();
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
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad: { lunes: { activo: true, inicio: '08:00', fin: '12:00' } },
      fotoPerfil: null,
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
    expect(resultado.usuario).toMatchObject({
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad: { lunes: { activo: true, inicio: '08:00', fin: '12:00' } },
    });
  });

  it('guarda la sede, el punto de entrega y la disponibilidad en la base de datos', async () => {
    const disponibilidad = {
      lunes: { activo: true, inicio: '08:00', fin: '12:00' },
    };
    buscarUsuarioPorId.mockResolvedValue({ id: 'usuario-1' });
    actualizarUsuario.mockResolvedValue({
      id: 'usuario-1',
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad,
    });

    const resultado = await servicio.actualizarPerfil('usuario-1', {
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad,
    });

    expect(actualizarUsuario).toHaveBeenCalledWith({
      where: { id: 'usuario-1' },
      data: {
        sede: 'Sede Barranquilla',
        puntoEntrega: 'Cafetería sede 1',
        disponibilidad,
      },
      select: {
        id: true,
        sede: true,
        puntoEntrega: true,
        disponibilidad: true,
      },
    });
    expect(resultado.disponibilidad).toEqual(disponibilidad);
  });

  it('rechaza guardar el perfil de un usuario inexistente', async () => {
    buscarUsuarioPorId.mockResolvedValue(null);

    await expect(
      servicio.actualizarPerfil('inexistente', {
        sede: 'Sede Barranquilla',
        puntoEntrega: 'Cafetería sede 1',
        disponibilidad: {},
      }),
    ).rejects.toThrow('El usuario indicado no existe.');
    expect(actualizarUsuario).not.toHaveBeenCalled();
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
