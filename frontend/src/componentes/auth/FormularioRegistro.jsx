import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "../../contexto/ContextoAutenticacion";

export default function FormularioRegistro() {
  const navigate = useNavigate();
  const { registrar } = useAuth();
  const [nombre, setNombre] = React.useState("");
  const [codigoEstudiantil, setCodigoEstudiantil] = React.useState("");
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
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{2,49}$/.test(codigoEstudiantil.trim())) {
      setError(
        "Ingresa un código estudiantil válido (3 a 50 letras, números o guiones).",
      );
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
        codigoEstudiantil,
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
    <form onSubmit={enviar} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
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
          className="glass-input mt-1"
        />
      </label>

      <label className="block text-sm font-medium text-gray-300">
        Código estudiantil
        <input
          type="text"
          required
          minLength={3}
          maxLength={50}
          autoComplete="off"
          placeholder="Ej. 2026-USB-10293"
          value={codigoEstudiantil}
          onChange={(event) => setCodigoEstudiantil(event.target.value)}
          className="glass-input mt-1"
        />
        <span className="mt-1 block text-xs text-gray-400">
          Se guardará en tu cuenta y aparecerá en tu carnet digital.
        </span>
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
          className="glass-input mt-1"
        />
        <span className="mt-1 block text-xs text-gray-400">
          Solo se aceptan direcciones @unisimon.edu.co.
        </span>
      </label>

      <label className="block text-sm font-medium text-gray-300">
        Celular / WhatsApp
        <div className="mt-1 flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-[var(--color-border)] bg-[var(--color-canvas)] px-3 text-sm text-gray-300">
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
            className="glass-input rounded-l-none"
          />
        </div>
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
          className="glass-input mt-1"
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
          className="glass-input mt-1"
        />
      </label>

      <button
        type="submit"
        disabled={guardando}
        className="btn-primary w-full gap-2"
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
          className="font-medium text-[var(--color-neon)] underline underline-offset-4 transition-colors hover:text-white"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
