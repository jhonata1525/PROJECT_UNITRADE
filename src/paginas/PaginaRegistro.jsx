import { Link } from "react-router-dom";
import FormularioRegistro from "../componentes/auth/FormularioRegistro";

export default function PaginaRegistro() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[var(--color-canvas)] text-gray-100">
      <div className="max-w-md w-full space-y-6 p-8 rounded-2xl shadow-2xl card-glass">
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            UniTrade · Universidad Simón Bolívar
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold text-white">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Regístrate con tu correo institucional y datos de contacto.
          </p>
        </div>
        <FormularioRegistro />
      </div>
    </div>
  );
}
