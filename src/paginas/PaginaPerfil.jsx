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
import {
  User,
  GraduationCap,
  BadgeCheck,
  Shield,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

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

  const nombreCompleto = usuario?.nombre || "Estudiante UniTrade";
  const email = usuario?.email || "";
  const telefono = usuario?.telefono;
  const telefonoVerificado = usuario?.telefonoVerificado;
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
          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
            <p className="text-gray-400 mt-1">Configura tu cuenta y verifica tu información</p>
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
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                  {iniciales}
                </div>

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
             SECCIÓN 2: VERIFICACIÓN WHATSAPP OTP (HU-02)
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