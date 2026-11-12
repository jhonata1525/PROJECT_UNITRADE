/**
 * @file perfil.js
 * Utilidades para dar formato a la información de contacto, sede y
 * disponibilidad horaria del usuario (HU-03).
 */

import { DIAS_SEMANA } from "./constants";

const minutos = (hora) => {
  const [h, m] = String(hora).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const obtenerDiaConfig = (dia) => {
  const info = DIAS_SEMANA.find((d) => d.id === dia);
  return {
    activo: false,
    inicio: "08:00",
    fin: "12:00",
    ...(info ? { label: info.label, short: info.short } : {}),
  };
};

export const normalizarDisponibilidad = (disponibilidad = {}) => {
  return DIAS_SEMANA.reduce((acc, dia) => {
    const valor = disponibilidad?.[dia.id];
    acc[dia.id] = {
      activo: Boolean(valor?.activo),
      inicio: valor?.inicio || "08:00",
      fin: valor?.fin || "12:00",
    };
    return acc;
  }, {});
};

export const formatearSede = (usuario) => {
  const partes = [usuario?.sede, usuario?.puntoEntrega].filter(Boolean);
  return partes.join(" · ");
};

export const obtenerFranjasDisponibles = (disponibilidad) => {
  const normalizada = normalizarDisponibilidad(disponibilidad);
  return DIAS_SEMANA.filter((dia) => normalizada[dia.id].activo).map((dia) => ({
    ...dia,
    ...normalizada[dia.id],
  }));
};

export const agruparDisponibilidad = (disponibilidad, { corto = false } = {}) => {
  const normalizada = normalizarDisponibilidad(disponibilidad);
  const grupos = [];

  DIAS_SEMANA.forEach((dia, index) => {
    const config = normalizada[dia.id];
    if (!config.activo) return;

    const anterior = grupos[grupos.length - 1];
    const diaAnteriorIndex = anterior
      ? DIAS_SEMANA.findIndex((d) => d.id === anterior.finDia)
      : -1;
    const esConsecutivo = Boolean(anterior) && diaAnteriorIndex === index - 1;

    if (
      esConsecutivo &&
      anterior.inicio === config.inicio &&
      anterior.fin === config.fin
    ) {
      anterior.finDia = dia.id;
      anterior.finLabel = corto ? dia.short : dia.label;
      return;
    }

    grupos.push({
      inicioDia: dia.id,
      finDia: dia.id,
      inicioLabel: corto ? dia.short : dia.label,
      finLabel: corto ? dia.short : dia.label,
      inicio: config.inicio,
      fin: config.fin,
    });
  });

  return grupos.map((grupo) => {
    const rangoDias =
      grupo.inicioDia === grupo.finDia
        ? grupo.inicioLabel
        : `${grupo.inicioLabel} a ${grupo.finLabel}`;
    return `${rangoDias} ${grupo.inicio}–${grupo.fin}`;
  });
};

export const resumenDisponibilidad = (disponibilidad, opciones = {}) => {
  const grupos = agruparDisponibilidad(disponibilidad, opciones);
  return grupos.length > 0
    ? grupos.join(" · ")
    : "Sin disponibilidad configurada";
};

const DIAS_POR_INDICE = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

/**
 * Calcula la próxima franja reservable del propietario dentro de los
 * próximos días, saltando días inactivos y horas que ya pasaron hoy.
 * Devuelve null si no hay ninguna franja disponible.
 */
export const obtenerProximoHorario = (disponibilidad, { dias = 14 } = {}) => {
  const normalizada = normalizarDisponibilidad(disponibilidad);
  const ahora = new Date();

  for (let desplazamiento = 0; desplazamiento < dias; desplazamiento += 1) {
    const fecha = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate() + desplazamiento
    );
    const diaId = DIAS_POR_INDICE[fecha.getDay()];
    const config = normalizada[diaId];
    if (!config.activo) continue;

    const inicioMin = minutos(config.inicio);
    const finMin = minutos(config.fin);
    if (inicioMin >= finMin) continue;

    let inicioHora = Math.ceil(inicioMin / 60);
    const finHora = Math.floor(finMin / 60);

    // Hoy solo se muestran horas que todavía no han empezado.
    if (desplazamiento === 0) {
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      while (inicioHora < finHora && inicioHora * 60 <= minutosActuales) {
        inicioHora += 1;
      }
    }

    if (inicioHora >= finHora) continue;

    const fechaTexto = new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(fecha);
    const horaTexto = `${String(inicioHora).padStart(2, "0")}:00–${String(
      finHora
    ).padStart(2, "0")}:00`;

    return {
      fecha,
      esHoy: desplazamiento === 0,
      horaInicio: inicioHora,
      horaFin: finHora,
      texto: `${desplazamiento === 0 ? "Hoy" : fechaTexto} · ${horaTexto}`,
    };
  }

  return null;
};

export const hayDisponibilidad = (disponibilidad) =>
  obtenerFranjasDisponibles(disponibilidad).length > 0;

export const esHorarioValido = (inicio, fin) =>
  minutos(inicio) < minutos(fin);
