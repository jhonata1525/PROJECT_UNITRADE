import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import FormularioRegistro from "../componentes/auth/FormularioRegistro";

export default function PaginaRegistro() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Marca */}
        <div className="mb-8 text-center animate-slide-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-neon)] to-[var(--color-accent-500)] shadow-lg shadow-blue-500/30">
            <Sparkles className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Crea tu <span className="text-gradient">cuenta</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Únete a la comunidad UniTrade de la Universidad Simón Bolívar
          </p>
        </div>

        <div className="glass-card overflow-hidden shadow-2xl shadow-black/50 animate-scale-in">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-gradient-to-br from-[var(--color-accent-500)]/20 to-[var(--color-neon)]/10 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Registro de estudiante
              </h2>
              <p className="mt-0.5 text-sm text-gray-400">
                Solo correos @unisimon.edu.co
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            <FormularioRegistro />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Tus datos se usan solo dentro de la comunidad universitaria.
        </p>
      </div>
    </div>
  );
}
