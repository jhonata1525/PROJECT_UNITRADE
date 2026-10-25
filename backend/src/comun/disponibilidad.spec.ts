import {
  intervaloDentroDisponibilidad,
  tieneDisponibilidadConfigurada,
} from './disponibilidad.js';

describe('disponibilidad del prestador', () => {
  const disponibilidad = {
    lunes: { activo: true, inicio: '08:00', fin: '12:00' },
    martes: { activo: false, inicio: '08:00', fin: '12:00' },
  };

  it('identifica franjas semanales configuradas y válidas', () => {
    expect(tieneDisponibilidadConfigurada(disponibilidad)).toBe(true);
    expect(
      tieneDisponibilidadConfigurada({
        lunes: { activo: true, inicio: '12:00', fin: '08:00' },
      }),
    ).toBe(false);
    expect(tieneDisponibilidadConfigurada(null)).toBe(false);
  });

  it('acepta una reserva dentro de la franja local del campus', () => {
    expect(
      intervaloDentroDisponibilidad(
        disponibilidad,
        new Date('2026-10-26T14:00:00.000Z'),
        new Date('2026-10-26T16:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('rechaza una reserva fuera de la franja o que cruza a un día no disponible', () => {
    expect(
      intervaloDentroDisponibilidad(
        disponibilidad,
        new Date('2026-10-26T17:00:00.000Z'),
        new Date('2026-10-26T18:00:00.000Z'),
      ),
    ).toBe(false);
    expect(
      intervaloDentroDisponibilidad(
        disponibilidad,
        new Date('2026-10-26T16:00:00.000Z'),
        new Date('2026-10-27T14:00:00.000Z'),
      ),
    ).toBe(false);
  });
});
