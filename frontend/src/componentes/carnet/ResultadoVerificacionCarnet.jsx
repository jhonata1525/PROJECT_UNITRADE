/**
 * @file ResultadoVerificacionCarnet.jsx
 * Presentación compartida del resultado de verificar un carnet digital.
 * La usan la página pública (/verificar/:token) y el escáner interno.
 */

import React from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

const DESCRIPCION_MOTIVO = {
  CARNET_NO_ENCONTRADO:
    "No existe un carnet con ese código o fue reemplazado por uno nuevo.",
  CARNET_VENCIDO:
    "El carnet está vencido. El estudiante debe renovarlo desde su perfil en UniTrade.",
  CUENTA_SUSPENDIDA:
    "La cuenta del estudiante está suspendida en UniTrade.",
};

export const formatearFechaCarnet = (valor) => {
  if (!valor) return "Sin fecha";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
};

const obtenerIniciales = (nombre = "") =>
  nombre
    .split(" ")
    .filter(Boolean)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "US";

const FilaDato = ({ icono: Icono, etiqueta, children }) => (
  <div className="flex items-start gap-3 text-sm">
    <Icono className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-xs text-gray-500">{etiqueta}</p>
      <div className="text-gray-200 font-medium">{children}</div>
    </div>
  </div>
);

export const EstadoCargandoCarnet = () => (
  <div className="py-10 text-center" role="status" aria-live="polite">
    <svg
      className="animate-spin h-10 w-10 text-[var(--color-neon)] mx-auto mb-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" />
      <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
    </svg>
    <p className="text-gray-400">Consultando el carnet...</p>
  </div>
);

export const EstadoErrorCarnet = ({ mensaje }) => (
  <div className="py-6 text-center">
    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
      <AlertCircle className="w-7 h-7 text-red-400" />
    </div>
    <h2 className="text-lg font-semibold text-white">No se pudo verificar</h2>
    <p className="text-sm text-gray-400 mt-2">{mensaje}</p>
  </div>
);

const ResultadoVerificacionCarnet = ({ resultado }) => {
  const { valido, motivos = [], mensaje, carnet, verificadoEn } = resultado;
  const correoVerificado = Boolean(
    carnet?.universidad?.correoInstitucionalVerificado,
  );

  return (
    <div aria-live="polite">
      <div className="text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
            valido
              ? "bg-emerald-500/10 border-emerald-500/40"
              : "bg-red-500/10 border-red-500/40"
          }`}
        >
          {valido ? (
            <ShieldCheck className="w-9 h-9 text-emerald-400" />
          ) : (
            <ShieldX className="w-9 h-9 text-red-400" />
          )}
        </div>
        <h2
          className={`text-xl font-bold ${
            valido ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {valido ? "Carnet válido" : "Carnet no válido"}
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          {valido
            ? "El carnet existe y la cuenta está activa en UniTrade."
            : "El carnet existe, pero no cumple las condiciones de validez."}
        </p>
      </div>

      {motivos.length > 0 && (
        <ul className="mt-4 space-y-2" aria-label="Motivos de invalidez">
          {motivos.map((motivo) => (
            <li
              key={motivo}
              className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{DESCRIPCION_MOTIVO[motivo] ?? mensaje ?? motivo}</span>
            </li>
          ))}
        </ul>
      )}

      {carnet && (
        <>
          <div className="mt-5 flex flex-col items-center text-center">
            {carnet.fotoPerfil ? (
              <img
                src={carnet.fotoPerfil}
                alt={`Foto de ${carnet.nombre}`}
                className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-neon)]/40"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center text-3xl font-bold text-white">
                {obtenerIniciales(carnet.nombre)}
              </div>
            )}
            <p className="mt-3 text-lg font-bold text-white">{carnet.nombre}</p>
            <p className="text-sm text-gray-400 font-mono">{carnet.codigo}</p>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--color-border)] space-y-3">
            <FilaDato icono={MapPin} etiqueta="Sede">
              {carnet.sede || "No registrada"}
            </FilaDato>
            <FilaDato icono={BadgeCheck} etiqueta="Cuenta UniTrade">
              <span
                className={
                  carnet.cuentaUniTrade === "ACTIVA"
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {carnet.cuentaUniTrade === "ACTIVA"
                  ? "Activa"
                  : "Suspendida"}
              </span>
            </FilaDato>
            <FilaDato icono={CheckCircle2} etiqueta="Correo institucional">
              <span
                className={
                  correoVerificado ? "text-emerald-400" : "text-amber-400"
                }
              >
                {correoVerificado ? "Verificado" : "Sin verificar"}
              </span>
            </FilaDato>
            <FilaDato icono={Shield} etiqueta="Inscripción en la universidad">
              <span className="text-gray-300">
                {carnet.universidad?.inscripcion === "VERIFICADA_POR_UNIVERSIDAD"
                  ? "Certificada por la U"
                  : "Aún no certificada por la U"}
              </span>
            </FilaDato>
            <FilaDato icono={GraduationCap} etiqueta="Carnet vigente hasta">
              {formatearFechaCarnet(carnet.vigenteHasta)}
            </FilaDato>
          </div>
        </>
      )}

      {verificadoEn && (
        <p className="mt-4 text-center text-xs text-gray-500">
          Consultado el {formatearFechaCarnet(verificadoEn)}
        </p>
      )}
    </div>
  );
};

export default ResultadoVerificacionCarnet;
