/**
 * @file PaginaPerfil.jsx
 * Página de Perfil de Usuario con Carnet Digital USB y Verificación WhatsApp OTP (HU-02).
 * - Sección 1: Carnet Digital Estudiantil USB (Glassmorphism)
 * - Sección 2: Verificación WhatsApp OTP (HU-02)
 */

import React from "react";
import { useAuth } from "../contexto/ContextoAutenticacion";
import { NavegacionLateral } from "../componentes/comunes/NavegacionLateral";
import { ModalVerificacionWhatsApp } from "../componentes/auth/ModalVerificacionWhatsApp";
import { ModalEdicionPerfil } from "../componentes/perfil/ModalEdicionPerfil";
import {
  User,
  GraduationCap,
  BadgeCheck,
  Shield,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Pencil,
  MapPin,
  Clock,
  Phone,
  Mail,
  CalendarDays,
} from "lucide-react";
import { obtenerFranjasDisponibles, formatearSede } from "../utils/perfil";

const formatPhone = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("57")) {
    const num = cleaned.slice(2);
    return `+57 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
  }
  return phone;
};

export const PaginaPerfil = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const [verificandoWhatsApp, setVerificandoWhatsApp] = React.useState(false);
  const [editandoPerfil, setEditandoPerfil] = React.useState(false);

  const handleVerificarWhatsApp = () => {
    setVerificandoWhatsApp(true);
  };

  const handleVerificacionExitosa = async (usuarioActualizado) => {
    try {
      await actualizarUsuario({
        telefono: usuarioActualizado.telefono,
        telefonoVerificado: true,
        fechaVerificacionTelefono: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error actualizando perfil:", err);
    }
  };

  const handleGuardarPerfil = async (datosActualizados) => {
    await actualizarUsuario(datosActualizados);
  };

  const nombreCompleto = usuario?.nombre || "Estudiante UniTrade";
  const email = usuario?.email || "";
  const telefono = usuario?.telefono;
  const telefonoVerificado = usuario?.telefonoVerificado;
  const franjasDisponibles = obtenerFranjasDisponibles(usuario?.disponibilidad);
  const sedeCompleta = formatearSede(usuario);
  const programa = "Ingeniería de Sistemas / Administración";
  const codigoEstudiantil = "2026-USB-10293";

  const iniciales = nombreCompleto
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-gray-100">
      <NavegacionLateral
        onLogout={() => {}}
        onProfileClick={() => {}}
      />

      <main className="transition-all duration-300 ml-0 lg:ml-64 min-h-screen pt-16 pb-20 lg:pt-6 lg:pb-6">
        <div className="page-container">
          {/* Header */}
          <div className="mb-8 animate-slide-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
              <p className="text-gray-400 mt-1">Configura tu cuenta, contacto y disponibilidad</p>
            </div>
            <button
              onClick={() => setEditandoPerfil(true)}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Pencil className="w-5 h-5" />
              Editar perfil
            </button>
          </div>

          {/* ========================================
             SECCIÓN 1: CARNET DIGITAL ESTUDIANTIL USB
             ======================================== */}
          <section className="mb-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-[var(--color-neon)]" />
              Carnet Digital Estudiantil USB
            </h2>

            <div className="glass-card p-6 max-w-sm mx-auto">
              {/* Header USB */}
              <div className="relative overflow-hidden rounded-xl mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-800 to-blue-900 opacity-90" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath d%3D%22M30 0L60 30L30 60L0 30Z%22 fill%3D%22white%22 fill-opacity%3D%220.03%22/%3E%3C/svg%3E')] opacity-10" />
                <div className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Universidad Simón Bolívar</p>
                      <p className="text-white/80 text-sm">Carnet Digital Estudiantil</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foto y datos */}
              <div className="flex flex-col items-center text-center space-y-3">
                {usuario?.fotoPerfil ? (
                  <img
                    src={usuario.fotoPerfil}
                    alt={`Foto de perfil de ${nombreCompleto}`}
                    className="w-28 h-28 rounded-full object-cover shadow-lg border-2 border-[var(--color-neon)]/40"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                    {iniciales}
                  </div>
                )}

                <div>
                  <p className="text-xl font-bold text-white">{nombreCompleto}</p>
                  <p className="text-sm text-gray-400">Estudiante UniTrade</p>
                </div>

                <div className="w-full pt-2 border-t border-[var(--color-border)] space-y-2 text-left">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <BadgeCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Programa</p>
                      <p className="font-medium text-white">{programa}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Código Estudiantil</p>
                      <p className="font-mono font-medium text-white">{codigoEstudiantil}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <BadgeCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Estado</p>
                      <p className="font-medium text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Estudiante Activo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Código QR del carnet */}
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center">
                <p className="text-xs text-gray-500 mb-2">Código de verificación del carnet</p>
                <div className="w-24 h-24 mx-auto bg-white rounded p-1">
                  <div className="w-full h-full bg-[var(--color-canvas)] rounded relative flex items-center justify-center">
                    <div className="w-16 h-16 bg-white" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-mono">USB-{codigoEstudiantil}</p>
              </div>
            </div>
          </section>

          {/* ========================================
             SECCIÓN 2: CONTACTO, SEDE Y DISPONIBILIDAD (HU-03)
             ======================================== */}
          <section className="mb-8 animate-slide-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-6 h-6 text-[var(--color-neon)]" />
                Contacto y Disponibilidad
              </h2>
              <button
                onClick={() => setEditandoPerfil(true)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Datos de contacto */}
              <div className="glass-card p-5">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  Datos de contacto
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Nombre</dt>
                    <dd className="text-gray-200 font-medium">{nombreCompleto}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Correo institucional</dt>
                    <dd className="text-gray-200 flex items-center gap-2 break-all">
                      <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      {email || "Sin registrar"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Teléfono / WhatsApp</dt>
                    <dd className="text-gray-200 flex flex-wrap items-center gap-2">
                      <span className="font-mono">
                        {telefono ? formatPhone(telefono) : "Sin registrar"}
                      </span>
                      {telefonoVerificado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <BadgeCheck className="w-3 h-3" />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" />
                          Sin verificar
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Sede y punto de entrega */}
              <div className="glass-card p-5">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--color-neon)]" />
                  Sede y punto de entrega
                </h3>
                {sedeCompleta ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Sede</p>
                      <p className="text-gray-200 font-medium">{usuario.sede}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Punto de entrega</p>
                      <p className="text-gray-200 font-medium">{usuario.puntoEntrega}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    <p>Aún no has definido dónde entregarás tus artículos.</p>
                    <button
                      onClick={() => setEditandoPerfil(true)}
                      className="mt-3 text-[var(--color-neon)] hover:underline text-sm font-medium"
                    >
                      Configurar sede y punto de entrega
                    </button>
                  </div>
                )}
              </div>

              {/* Disponibilidad horaria */}
              <div className="glass-card p-5 md:col-span-2">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                  Franjas de disponibilidad
                </h3>
                {franjasDisponibles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {franjasDisponibles.map((franja) => (
                      <span
                        key={franja.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-[var(--color-canvas)] border border-[var(--color-border)] text-gray-200"
                      >
                        <Clock className="w-4 h-4 text-[var(--color-neon)]" />
                        <span className="font-medium">{franja.label}</span>
                        <span className="font-mono text-xs text-gray-400">
                          {franja.inicio}–{franja.fin}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    <p>No tienes horarios de atención configurados.</p>
                    <button
                      onClick={() => setEditandoPerfil(true)}
                      className="mt-3 text-[var(--color-neon)] hover:underline text-sm font-medium"
                    >
                      Agregar disponibilidad horaria
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ========================================
             SECCIÓN 3: VERIFICACIÓN WHATSAPP OTP (HU-02)
             ======================================== */}
          <section className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-green-500" />
              Verificación WhatsApp OTP
            </h2>

            {!telefonoVerificado ? (
              /* Banner de verificación requerida */
              <div className="glass-card p-6 border-l-4 border-amber-500 bg-amber-500/10 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Verificación de Seguridad Requerida
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Para garantizar la seguridad de tu cuenta y habilitar todas las funciones de UniTrade,
                      debes verificar tu número de teléfono mediante WhatsApp OTP.
                    </p>
                    <button
                      onClick={handleVerificarWhatsApp}
                      className="btn-primary flex items-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Verificar Teléfono vía WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Teléfono verificado */
              <div className="glass-card p-6 border-l-4 border-emerald-500 bg-emerald-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Teléfono Verificado
                    </h3>
                    <p className="text-gray-300 mb-2">
                      Tu número de teléfono ha sido verificado exitosamente.
                    </p>
                    <p className="font-mono text-lg font-medium text-emerald-400 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      {formatPhone(telefono)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <BadgeCheck className="w-4 h-4" />
                      Verificado
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="mt-6 glass-panel p-4">
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--color-neon)]" />
                ¿Por qué verificar tu teléfono?
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Seguridad: Autenticación de dos factores para proteger tu cuenta
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Recuperación: Recupera tu acceso si olvidas tu contraseña
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Notificaciones: Recibe alertas de reservas y pagos por WhatsApp
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Confianza: Verificación obligatoria para arrendar y publicar artículos
                </li>
              </ul>
            </div>
          </section>

          {/* Modal Edición de Perfil (HU-03) */}
          <ModalEdicionPerfil
            isOpen={editandoPerfil}
            onClose={() => setEditandoPerfil(false)}
            usuario={usuario}
            onSave={handleGuardarPerfil}
          />

          {/* Modal Verificación WhatsApp */}
          <ModalVerificacionWhatsApp
            isOpen={verificandoWhatsApp}
            onClose={() => setVerificandoWhatsApp(false)}
            usuario={usuario}
            onVerificado={handleVerificacionExitosa}
          />
        </div>
      </main>
    </div>
  );
};

export default PaginaPerfil;