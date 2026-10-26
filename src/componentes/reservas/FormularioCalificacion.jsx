import React from "react";
import { Star } from "lucide-react";

const Estrellas = ({ valor, onChange, disabled = false, etiqueta }) => (
  <div
    className="flex items-center gap-1"
    role={onChange ? "group" : undefined}
    aria-label={etiqueta}
  >
    {[1, 2, 3, 4, 5].map((estrella) =>
      onChange ? (
        <button
          key={estrella}
          type="button"
          onClick={() => onChange(estrella)}
          disabled={disabled}
          aria-label={`${estrella} ${estrella === 1 ? "estrella" : "estrellas"}`}
          aria-pressed={valor === estrella}
          className="rounded p-1 text-amber-300 transition hover:scale-110 disabled:cursor-not-allowed"
        >
          <Star
            className={`h-5 w-5 ${estrella <= valor ? "fill-current" : ""}`}
          />
        </button>
      ) : (
        <Star
          key={estrella}
          aria-hidden="true"
          className={`h-4 w-4 ${
            estrella <= valor
              ? "fill-amber-300 text-amber-300"
              : "text-gray-600"
          }`}
        />
      ),
    )}
  </div>
);

export const FormularioCalificacion = ({
  calificacion,
  nombreUsuario,
  promedio,
  totalResenas,
  onSubmit,
}) => {
  const [estrellas, setEstrellas] = React.useState(0);
  const [comentario, setComentario] = React.useState("");
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState("");

  const enviar = async (event) => {
    event.preventDefault();
    if (estrellas < 1 || estrellas > 5) {
      setError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      await onSubmit({ estrellas, comentario: comentario.trim() || undefined });
    } catch (err) {
      setError(err?.message || "No se pudo guardar la calificación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="mt-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-canvas)] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white">
            {calificacion
              ? `Tu calificación para ${nombreUsuario}`
              : `Califica a ${nombreUsuario}`}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            Reputación: {Number(promedio || 0).toFixed(1)}/5 ·{" "}
            {totalResenas || 0} reseñas
          </p>
        </div>
        {calificacion && (
          <span className="text-xs text-emerald-300">Enviada</span>
        )}
      </div>

      {calificacion ? (
        <div>
          <Estrellas
            valor={calificacion.estrellas}
            etiqueta={`${calificacion.estrellas} de 5 estrellas`}
          />
          {calificacion.comentario && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
              {calificacion.comentario}
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          <Estrellas
            valor={estrellas}
            onChange={setEstrellas}
            disabled={guardando}
            etiqueta="Selecciona una calificación de 1 a 5 estrellas"
          />
          <label className="block text-sm text-gray-300">
            Comentario <span className="text-gray-500">(opcional)</span>
            <textarea
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              maxLength={1000}
              rows={3}
              disabled={guardando}
              placeholder="Comparte cómo fue tu experiencia..."
              className="glass-input mt-1 block w-full resize-y"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              {comentario.length}/1000 caracteres
            </span>
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary disabled:opacity-50"
            >
              {guardando ? "Enviando..." : "Enviar calificación"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
};
