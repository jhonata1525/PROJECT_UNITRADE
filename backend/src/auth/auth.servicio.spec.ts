import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { ServicioPrisma } from '../prisma/servicio-prisma.js';
import { ServicioAuth } from './auth.servicio.js';

describe('ServicioAuth', () => {
  const buscarUsuario = vi.fn();
  const buscarUsuarioPorId = vi.fn();
  const actualizarUsuario = vi.fn();
  const crearUsuario = vi.fn();
  const prisma = {
    usuario: {
      findFirst: buscarUsuario,
      findUnique: buscarUsuarioPorId,
      update: actualizarUsuario,
      create: crearUsuario,
    },
  } as unknown as ServicioPrisma;
  const servicio = new ServicioAuth(prisma);

  beforeEach(() => {
    buscarUsuario.mockReset();
    buscarUsuarioPorId.mockReset();
    actualizarUsuario.mockReset();
    crearUsuario.mockReset();
  });

  it('registra cuentas institucionales con ambos factores pendientes', async () => {
    buscarUsuario.mockResolvedValue(null);
    crearUsuario.mockResolvedValue({
      id: 'usuario-1',
      nombre: 'Ana Martínez',
      correo: 'ana@unisimon.edu.co',
      telefono: '+573001234567',
      correoVerificado: false,
      telefonoVerificado: false,
      rol: 'ESTUDIANTE',
    });

    const resultado = await servicio.registrar({
      nombre: ' Ana Martínez ',
      correo: 'ANA@UNISIMON.EDU.CO',
      telefono: '3001234567',
      contrasena: 'ClaveSegura123',
    });

    expect(crearUsuario).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nombre: 'Ana Martínez',
          correo: 'ana@unisimon.edu.co',
          telefono: '+573001234567',
          hashContrasena: expect.any(String),
          correoVerificado: false,
          telefonoVerificado: false,
        }),
        select: expect.any(Object),
      }),
    );
    expect(resultado.usuario).toMatchObject({
      correoVerificado: false,
      telefonoVerificado: false,
    });
  });

  it('rechaza el dominio externo y los correos ya registrados', async () => {
    await expect(
      servicio.registrar({
        nombre: 'Ana',
        correo: 'ana@gmail.com',
        telefono: '3001234567',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(buscarUsuario).not.toHaveBeenCalled();

    buscarUsuario.mockResolvedValueOnce({ id: 'usuario-existente' });
    await expect(
      servicio.registrar({
        nombre: 'Ana',
        correo: 'ana@unisimon.edu.co',
        telefono: '3001234567',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(crearUsuario).not.toHaveBeenCalled();
  });

  it('autentica con el registro de la base de datos y no devuelve el hash', async () => {
    const hashContrasena = await hash('ClaveSegura123', 4);
    buscarUsuario.mockResolvedValue({
      id: 'usuario-1',
      nombre: 'Ana',
      correo: 'ana@unisimon.edu.co',
      correoVerificado: false,
      hashContrasena,
      telefono: null,
      telefonoVerificado: false,
      fechaVerificacionTelefono: null,
      rol: 'ESTUDIANTE',
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad: {
        lunes: { activo: true, inicio: '08:00', fin: '12:00' },
      },
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
      correoVerificado: false,
    });
    expect(resultado.usuario).not.toHaveProperty('hashContrasena');
    expect(resultado.usuario).toMatchObject({
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad: {
        lunes: { activo: true, inicio: '08:00', fin: '12:00' },
      },
    });
  });

  it('guarda la sede, el punto de entrega y la disponibilidad en la base de datos', async () => {
    const disponibilidad = {
      lunes: { activo: true, inicio: '08:00', fin: '12:00' },
    };
    buscarUsuarioPorId.mockResolvedValue({ id: 'usuario-1' });
    actualizarUsuario.mockResolvedValue({
      id: 'usuario-1',
      nombre: 'Ana',
      fotoPerfil: 'data:image/jpeg;base64,abc123',
      telefono: '+573001234567',
      telefonoVerificado: false,
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad,
    });

    const resultado = await servicio.actualizarPerfil('usuario-1', {
      nombre: ' Ana ',
      fotoPerfil: 'data:image/jpeg;base64,abc123',
      sede: 'Sede Barranquilla',
      puntoEntrega: 'Cafetería sede 1',
      disponibilidad,
    });

    expect(actualizarUsuario).toHaveBeenCalledWith({
      where: { id: 'usuario-1' },
      data: {
        nombre: 'Ana',
        fotoPerfil: 'data:image/jpeg;base64,abc123',
        sede: 'Sede Barranquilla',
        puntoEntrega: 'Cafetería sede 1',
        disponibilidad,
      },
      select: {
        id: true,
        nombre: true,
        fotoPerfil: true,
        telefono: true,
        telefonoVerificado: true,
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
