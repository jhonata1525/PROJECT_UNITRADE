/**
 * @file ModalEdicionPerfil.jsx
 * Modal de edición de perfil y disponibilidad horaria (HU-03).
 * - Foto de perfil (subida desde archivo, comprimida a data URL).
 * - Datos de contacto: nombre, email (solo lectura) y teléfono.
 * - Sede y punto de entrega en el campus.
 * - Disponibilidad por día con franja horaria de atención.
 */

import React from "react";
import {
  X,
  Camera,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import {
  DIAS_SEMANA,
  HORAS_ATENCION,
  SEDES_UNISIMON,
  PUNTOS_ENTREGA,
  OTRO_PUNTO_ENTREGA,
} from "../../utils/constants";
import {
  normalizarDisponibilidad,
  esHorarioValido,
  resumenDisponibilidad,
} from "../../utils/perfil";

const MAX_FOTO_MB = 15;
const TAMANO_MAXIMO_FOTO = 320;
const HORAS_INICIO = HORAS_ATENCION.slice(0, -1);
const HORAS_FIN = HORAS_ATENCION.slice(1);

const construirFormulario = (usuario) => {
  const puntoGuardado = usuario?.puntoEntrega || "";
  const esPuntoPersonalizado =
    Boolean(puntoGuardado) && !PUNTOS_ENTREGA.includes(puntoGuardado);

  return {
    nombre: usuario?.nombre || "",
    email: usuario?.email || "",
    telefono: usuario?.telefono || "",
    fotoPerfil: usuario?.fotoPerfil || "",
    sede: usuario?.sede || "",
    puntoEntrega: esPuntoPersonalizado ? OTRO_PUNTO_ENTREGA : puntoGuardado,
    puntoEntregaDetalle: esPuntoPersonalizado ? puntoGuardado : "",
    disponibilidad: normalizarDisponibilidad(usuario?.disponibilidad),
  };
};

const leerArchivoComoDataUrl = (archivo) =>
  new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(archivo);
  });

const comprimirImagen = (dataUrl) =>
  new Promise((resolve, reject) => {
    const imagen = new window.Image();
    imagen.onload = () => {
      const escala = Math.min(
        1,
        TAMANO_MAXIMO_FOTO / Math.max(imagen.width, imagen.height)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imagen.width * escala));
      canvas.height = Math.max(1, Math.round(imagen.height * escala));
      const contexto = canvas.getContext("2d");
      if (!contexto) {
        reject(new Error("No se pudo procesar la imagen"));
        return;
      }
      contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    imagen.onerror = () => reject(new Error("El archivo no es una imagen válida"));
    imagen.src = dataUrl;
  });

const esTelefonoValido = (telefono) => {
  const digitos = String(telefono || "").replace(/\D/g, "");
  return digitos.length === 10 || (digitos.length === 12 && digitos.startsWith("57"));
};

const obtenerIniciales = (nombre) =>
  String(nombre || "Estudiante UniTrade")
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const ModalEdicionPerfil = ({ isOpen, onClose, usuario, onSave }) => {
  const [formData, setFormData] = React.useState(() => construirFormulario(usuario));
  const [errors, setErrors] = React.useState({});
  const [fotoError, setFotoError] = React.useState("");
  const [procesandoFoto, setProcesandoFoto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [errorGuardado, setErrorGuardado] = React.useState("");
  const inputFotoRef = React.useRef(null);
  const contenidoRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setFormData(construirFormulario(usuario));
      setErrors({});
      setFotoError("");
      setErrorGuardado("");
      setProcesandoFoto(false);
      setGuardando(false);
    }
  }, [isOpen, usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "puntoEntrega" && value !== OTRO_PUNTO_ENTREGA
        ? { puntoEntregaDetalle: "" }
        : {}),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "puntoEntrega") {
      setErrors((prev) => ({ ...prev, puntoEntregaDetalle: "" }));
    }
  };

  const handleFoto = async (e) => {
    const input = e.target;
    const archivo = input.files?.[0];
    if (!archivo) return;

    setFotoError("");
    setProcesandoFoto(true);
    try {
      if (!archivo.type.startsWith("image/")) {
        throw new Error("Selecciona un archivo de imagen (JPG, PNG o WEBP)");
      }
      if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
        throw new Error(`La imagen no puede superar los ${MAX_FOTO_MB} MB`);
      }
      const dataUrl = await leerArchivoComoDataUrl(archivo);
      const comprimida = await comprimirImagen(dataUrl);
      setFormData((prev) => ({ ...prev, fotoPerfil: comprimida }));
    } catch (err) {
      setFotoError(err.message || "No se pudo cargar la imagen");
    } finally {
      setProcesandoFoto(false);
      input.value = "";
    }
  };

  const eliminarFoto = () => {
    setFormData((prev) => ({ ...prev, fotoPerfil: "" }));
    setFotoError("");
  };

  const toggleDia = (diaId) => {
    setFormData((prev) => ({
      ...prev,
      disponibilidad: {
        ...prev.disponibilidad,
        [diaId]: {
          ...prev.disponibilidad[diaId],
          activo: !prev.disponibilidad[diaId].activo,
        },
      },
    }));
    setErrors((prev) => ({ ...prev, disponibilidad: "" }));
  };

  const cambiarHorario = (diaId, campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      disponibilidad: {
        ...prev.disponibilidad,
        [diaId]: {
          ...prev.disponibilidad[diaId],
          [campo]: valor,
        },
      },
    }));
    setErrors((prev) => ({ ...prev, [`disponibilidad_${diaId}`]: "" }));
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    }
    if (!esTelefonoValido(formData.telefono)) {
      nuevosErrores.telefono = "Ingresa un teléfono válido de 10 dígitos (ej: 3001234567)";
    }
    if (!formData.sede) {
      nuevosErrores.sede = "Selecciona tu sede";
    }
    if (!formData.puntoEntrega) {
      nuevosErrores.puntoEntrega = "Selecciona el punto de entrega";
    } else if (
      formData.puntoEntrega === OTRO_PUNTO_ENTREGA &&
      !formData.puntoEntregaDetalle.trim()
    ) {
      nuevosErrores.puntoEntregaDetalle = "Escribe el lugar exacto de entrega";
    }

    const diasActivos = DIAS_SEMANA.filter(
      (dia) => formData.disponibilidad[dia.id].activo
    );
    if (diasActivos.length === 0) {
      nuevosErrores.disponibilidad = "Selecciona al menos un día de disponibilidad";
    }
    diasActivos.forEach((dia) => {
      const franja = formData.disponibilidad[dia.id];
      if (!esHorarioValido(franja.inicio, franja.fin)) {
        nuevosErrores[`disponibilidad_${dia.id}`] =
          `La hora de fin del ${dia.label.toLowerCase()} debe ser mayor a la de inicio`;
      }
    });

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) {
      contenidoRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const telefonoCambio =
      String(formData.telefono).replace(/\D/g, "") !==
      String(usuario?.telefono || "").replace(/\D/g, "");

    setGuardando(true);
    setErrorGuardado("");
    try {
      await onSave({
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        telefonoVerificado: telefonoCambio
          ? false
          : Boolean(usuario?.telefonoVerificado),
        fechaVerificacionTelefono: telefonoCambio
          ? null
          : usuario?.fechaVerificacionTelefono || null,
        fotoPerfil: formData.fotoPerfil || null,
        sede: formData.sede,
        puntoEntrega:
          formData.puntoEntrega === OTRO_PUNTO_ENTREGA
            ? formData.puntoEntregaDetalle.trim()
            : formData.puntoEntrega,
        disponibilidad: formData.disponibilidad,
        perfilActualizadoEn: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      setErrorGuardado(err?.message || "No se pudieron guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  const telefonoCambio =
    String(formData.telefono).replace(/\D/g, "") !==
    String(usuario?.telefono || "").replace(/\D/g, "");
  const resumen = resumenDisponibilidad(formData.disponibilidad, { corto: true });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-editar-perfil-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !guardando && onClose()}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div ref={contenidoRef} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
            <div>
              <h2 id="modal-editar-perfil-title" className="text-xl font-bold text-white">
                Editar Perfil
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Actualiza tu foto, contacto y disponibilidad en el campus
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={guardando}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-6">
            {Object.values(errors).some(Boolean) && (
              <div
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  No se pudo guardar. Corrige lo siguiente:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    {Object.values(errors)
                      .filter(Boolean)
                      .map((mensaje, index) => (
                        <li key={index}>{mensaje}</li>
                      ))}
                  </ul>
                </span>
              </div>
            )}

            {/* Foto de perfil */}
            <section>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[var(--color-neon)]" />
                Foto de perfil
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0">
                  {formData.fotoPerfil ? (
                    <img
                      src={formData.fotoPerfil}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-neon)]/40 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {obtenerIniciales(formData.nombre)}
                    </div>
                  )}
                  {procesandoFoto && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={inputFotoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFoto}
                    className="hidden"
                    id="foto-perfil-input"
                    disabled={procesandoFoto || guardando}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => inputFotoRef.current?.click()}
                      disabled={procesandoFoto || guardando}
                      className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {formData.fotoPerfil ? "Cambiar foto" : "Subir foto"}
                    </button>
                    {formData.fotoPerfil && (
                      <button
                        type="button"
                        onClick={eliminarFoto}
                        disabled={procesandoFoto || guardando}
                        className="btn-secondary text-red-400 hover:text-red-300 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    JPG, PNG o WEBP · máximo {MAX_FOTO_MB} MB
                  </p>
                  {fotoError && (
                    <p className="text-xs text-red-400 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-3 h-3" />
                      {fotoError}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Datos de contacto */}
            <section className="pt-5 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-neon)]" />
                Datos de contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="perfil-nombre" className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="perfil-nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="glass-input"
                    aria-invalid={!!errors.nombre}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-400 mt-1" role="alert">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="perfil-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Correo institucional
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      id="perfil-email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="glass-input pl-9 opacity-70 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    El correo institucional no se puede modificar
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="perfil-telefono" className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono / WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="tel"
                      id="perfil-telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="3001234567"
                      className="glass-input pl-9"
                      aria-invalid={!!errors.telefono}
                    />
                  </div>
                  {errors.telefono && (
                    <p className="text-xs text-red-400 mt-1" role="alert">{errors.telefono}</p>
                  )}
                  {telefonoCambio && usuario?.telefonoVerificado && (
                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Al cambiar el número deberás verificarlo nuevamente por WhatsApp
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Sede y punto de entrega */}
            <section className="pt-5 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-neon)]" />
                Sede y punto de entrega
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="perfil-sede" className="block text-sm font-medium text-gray-300 mb-2">
                    Sede <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="perfil-sede"
                    name="sede"
                    value={formData.sede}
                    onChange={handleChange}
                    className="glass-input bg-[var(--color-surface)] cursor-pointer"
                    aria-invalid={!!errors.sede}
                  >
                    <option value="">Selecciona tu sede</option>
                    {SEDES_UNISIMON.map((sede) => (
                      <option key={sede} value={sede}>{sede}</option>
                    ))}
                  </select>
                  {errors.sede && (
                    <p className="text-xs text-red-400 mt-1" role="alert">{errors.sede}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="perfil-punto" className="block text-sm font-medium text-gray-300 mb-2">
                    Punto de entrega <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="perfil-punto"
                    name="puntoEntrega"
                    value={formData.puntoEntrega}
                    onChange={handleChange}
                    className="glass-input bg-[var(--color-surface)] cursor-pointer"
                    aria-invalid={!!errors.puntoEntrega}
                  >
                    <option value="">Selecciona el punto</option>
                    {PUNTOS_ENTREGA.map((punto) => (
                      <option key={punto} value={punto}>{punto}</option>
                    ))}
                    <option value={OTRO_PUNTO_ENTREGA}>{OTRO_PUNTO_ENTREGA}</option>
                  </select>
                  {errors.puntoEntrega && (
                    <p className="text-xs text-red-400 mt-1" role="alert">{errors.puntoEntrega}</p>
                  )}
                </div>

                {formData.puntoEntrega === OTRO_PUNTO_ENTREGA && (
                  <div className="md:col-span-2">
                    <label htmlFor="perfil-punto-detalle" className="block text-sm font-medium text-gray-300 mb-2">
                      Especifica el punto de entrega <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        id="perfil-punto-detalle"
                        name="puntoEntregaDetalle"
                        value={formData.puntoEntregaDetalle}
                        onChange={handleChange}
                        placeholder="Ej: Bloque C - Salón 204"
                        maxLength={80}
                        className="glass-input pl-9"
                        aria-invalid={!!errors.puntoEntregaDetalle}
                        aria-describedby="perfil-punto-detalle-ayuda"
                      />
                    </div>
                    <p id="perfil-punto-detalle-ayuda" className="text-xs text-gray-500 mt-1">
                      Escribe el lugar exacto dentro o cerca del campus (máximo 80 caracteres).
                    </p>
                    {errors.puntoEntregaDetalle && (
                      <p className="text-xs text-red-400 mt-1" role="alert">{errors.puntoEntregaDetalle}</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Disponibilidad horaria */}
            <section className="pt-5 border-t border-[var(--color-border)]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[var(--color-neon)]" />
                  Disponibilidad para entregas
                </h3>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  08:00 a 18:00
                </span>
              </div>

              <div className="space-y-2">
                {DIAS_SEMANA.map((dia) => {
                  const franja = formData.disponibilidad[dia.id];
                  const errorDia = errors[`disponibilidad_${dia.id}`];
                  return (
                    <div
                      key={dia.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border transition-colors ${
                        franja.activo
                          ? "border-[var(--color-neon)]/30 bg-[var(--color-neon)]/5"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={franja.activo}
                          onChange={() => toggleDia(dia.id)}
                          disabled={guardando}
                          className="w-4 h-4 accent-[var(--color-neon)] cursor-pointer"
                        />
                        <span className={`text-sm font-medium ${franja.activo ? "text-white" : "text-gray-400"}`}>
                          {dia.label}
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <select
                          value={franja.inicio}
                          onChange={(e) => cambiarHorario(dia.id, "inicio", e.target.value)}
                          disabled={!franja.activo || guardando}
                          className="glass-input py-2 text-sm bg-[var(--color-surface)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Hora de inicio del ${dia.label}`}
                        >
                          {HORAS_INICIO.map((hora) => (
                            <option key={hora} value={hora}>{hora}</option>
                          ))}
                        </select>
                        <span className="text-gray-500 text-sm">a</span>
                        <select
                          value={franja.fin}
                          onChange={(e) => cambiarHorario(dia.id, "fin", e.target.value)}
                          disabled={!franja.activo || guardando}
                          className="glass-input py-2 text-sm bg-[var(--color-surface)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Hora de fin del ${dia.label}`}
                        >
                          {HORAS_FIN.map((hora) => (
                            <option key={hora} value={hora}>{hora}</option>
                          ))}
                        </select>
                      </div>

                      {errorDia && (
                        <p className="text-xs text-red-400 w-full sm:w-auto" role="alert">
                          {errorDia}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {errors.disponibilidad && (
                <p className="text-xs text-red-400 mt-2" role="alert">{errors.disponibilidad}</p>
              )}

              <div className="mt-3 p-3 rounded-xl bg-[var(--color-canvas)] border border-[var(--color-border)]">
                <p className="text-xs text-gray-500 mb-1">Resumen de disponibilidad</p>
                <p className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[var(--color-neon)] flex-shrink-0" />
                  {resumen}
                </p>
              </div>
            </section>

            {errorGuardado && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorGuardado}
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || procesandoFoto}
                className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalEdicionPerfil;
