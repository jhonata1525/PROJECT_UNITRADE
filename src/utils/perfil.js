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

export const hayDisponibilidad = (disponibilidad) =>
  obtenerFranjasDisponibles(disponibilidad).length > 0;

export const esHorarioValido = (inicio, fin) =>
  minutos(inicio) < minutos(fin);
