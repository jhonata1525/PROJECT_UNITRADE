type Franja = { activo?: unknown; inicio?: unknown; fin?: unknown };

const DIAS_SEMANA: Record<string, string> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miercoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sabado',
  Sunday: 'domingo',
};

const formatoCampus = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
});

const minutosHora = (hora: unknown): number | null => {
  if (typeof hora !== 'string' || !/^\d{2}:\d{2}$/.test(hora)) return null;
  const [horas, minutos] = hora.split(':').map(Number);
  if (horas > 23 || minutos > 59) return null;
  return horas * 60 + minutos;
};

const obtenerPartes = (fecha: Date) => {
  const partes = formatoCampus.formatToParts(fecha);
  const valores = Object.fromEntries(
    partes.map(({ type, value }) => [type, value]),
  );
  return {
    dia: DIAS_SEMANA[valores.weekday],
    hora: Number(valores.hour),
    minuto: Number(valores.minute),
    segundo: Number(valores.second),
    milisegundo: Number(valores.fractionalSecond),
  };
};

export const tieneDisponibilidadConfigurada = (valor: unknown): boolean => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  return Object.values(valor).some((elemento) => {
    if (!elemento || typeof elemento !== 'object' || Array.isArray(elemento)) {
      return false;
    }
    const franja = elemento as Franja;
    if (franja.activo !== true) return false;
    const inicio = minutosHora(franja.inicio);
    const fin = minutosHora(franja.fin);
    return inicio !== null && fin !== null && inicio < fin;
  });
};

export const intervaloDentroDisponibilidad = (
  disponibilidad: unknown,
  inicio: Date,
  fin: Date,
): boolean => {
  if (!tieneDisponibilidadConfigurada(disponibilidad) || fin <= inicio)
    return false;
  const franjas = disponibilidad as Record<string, Franja>;
  let cursor = inicio.getTime();

  while (cursor < fin.getTime()) {
    const fecha = new Date(cursor);
    const partes = obtenerPartes(fecha);
    const franja = partes.dia ? franjas[partes.dia] : undefined;
    const inicioFranja = minutosHora(franja?.inicio);
    const finFranja = minutosHora(franja?.fin);
    const minutoActual = partes.hora * 60 + partes.minuto;

    if (
      franja?.activo !== true ||
      inicioFranja === null ||
      finFranja === null ||
      minutoActual < inicioFranja ||
      minutoActual >= finFranja
    ) {
      return false;
    }

    const milisegundosHastaHora =
      (60 - partes.minuto) * 60_000 -
      partes.segundo * 1000 -
      partes.milisegundo;
    const segmentoMs = Math.min(milisegundosHastaHora, fin.getTime() - cursor);
    const minutosFinSegmento = minutoActual + segmentoMs / 60_000;
    if (minutosFinSegmento > finFranja) return false;
    cursor += segmentoMs;
  }

  return true;
};
