import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAutenticacion";

export default function FormularioRegistro() {
  const navigate = useNavigate();
  const { registrar } = useAuth();
  const [nombre, setNombre] = React.useState("");
  const [correo, setCorreo] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [contrasena, setContrasena] = React.useState("");
  const [confirmarContrasena, setConfirmarContrasena] = React.useState("");
  const [error, setError] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);

  const enviar = async (event) => {
    event.preventDefault();
    setError("");

    if (!correo.trim().toLowerCase().endsWith("@unisimon.edu.co")) {
      setError("El registro solo está permitido con correo @unisimon.edu.co.");
      return;
    }
    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!/^3\d{9}$/.test(telefono)) {
      setError("Ingresa un celular colombiano válido de 10 dígitos.");
      return;
    }

    setGuardando(true);
    try {
      const resultado = await registrar({
        nombre,
        correo,
        telefono,
        contrasena,
      });
      navigate("/login", {
        replace: true,
        state: { mensaje: resultado.mensaje },
      });
    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="mt-8 space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <label className="block text-sm font-medium text-gray-300">
        Nombre completo
        <input
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block text-sm font-medium text-gray-300">
        Correo institucional
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="usuario@unisimon.edu.co"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="mt-1 block text-xs text-gray-400">
          Solo se aceptan direcciones @unisimon.edu.co. Quedará como Sin
          verificar.
        </span>
      </label>

      <label className="block text-sm font-medium text-gray-300">
        Celular / WhatsApp
        <div className="mt-1 flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-600/50 bg-slate-700/70 text-gray-300">
            +57
          </span>
          <input
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="3001234567"
            value={telefono}
            onChange={(event) =>
              setTelefono(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className="block w-full min-w-0 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-r-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="mt-1 block text-xs text-gray-400">
          WhatsApp aparecerá como Sin verificar mientras no configuremos el
          envío de códigos.
        </span>
      </label>

      <label className="block text-sm font-medium text-gray-300">
        Contraseña
        <input
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block text-sm font-medium text-gray-300">
        Confirmar contraseña
        <input
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          value={confirmarContrasena}
          onChange={(event) => setConfirmarContrasena(event.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
        Podrás crear la cuenta y usar las funciones de UniTrade sin verificar el
        correo ni WhatsApp por el momento. Los estados aparecerán como Sin
        verificar hasta que configuremos la confirmación.
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="w-full flex justify-center items-center gap-2 py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {guardando ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {guardando ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-gray-400">
        ¿Ya tienes una cuenta?{" "}
        <Link
          to="/login"
          className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
