/**
 * @file FormularioArticuloModal.jsx
 * Modal glassmorphism para crear/editar artículos en "Mis Artículos".
 * - Campos: Nombre, Categoría, Precio por Hora, Estado, Descripción, URL Foto.
 * - Tarifa sugerida automática por categoría (RN-05).
 * - Validación tarifa mínima $1.000 COP/hora (RN-04).
 * - Guarda en localStorage con clave 'unitrade_mis_articulos'.
 */

import React from "react";
import { X, Image, Loader2, Info, AlertCircle, CheckCircle2, Zap } from "lucide-react";

const CATEGORIAS = [
  "Libros",
  "Laboratorio",
  "Calculadoras",
  "Tecnología",
  "Deportes",
  "Otros",
];

// Tarifas sugeridas por categoría (COP por hora)
const TARIFAS_SUGERIDAS = {
  Libros: 2000,
  Laboratorio: 3000,
  Calculadoras: 1500,
  Tecnología: 4000,
  Deportes: 2500,
  Otros: 2500,
};

const TARIFA_MINIMA = 1000; // COP por hora

const ESTADOS = [
  { value: "disponible", label: "Disponible", color: "bg-emerald-500" },
  { value: "en_alquiler", label: "En Alquiler", color: "bg-blue-500" },
  { value: "pausado", label: "Pausado", color: "bg-amber-500" },
];

export const FormularioArticuloModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
}) => {
  const [formData, setFormData] = React.useState({
    nombre: "",
    categoria: "Libros",
    precioPorDia: "",
    estado: "disponible",
    descripcion: "",
    fotoUrl: "",
  });
  const [errors, setErrors] = React.useState({});
  const [previewError, setPreviewError] = React.useState(false);

  // Tarifa sugerida basada en la categoría seleccionada
  const tarifaSugerida = TARIFAS_SUGERIDAS[formData.categoria] || 0;
  const precioNumerico = Number(formData.precioPorDia);
  const precioValido = formData.precioPorDia && !isNaN(precioNumerico) && precioNumerico >= TARIFA_MINIMA;
  const usaTarifaSugerida = precioNumerico === tarifaSugerida && tarifaSugerida > 0;

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          nombre: initialData.nombre || "",
          categoria: initialData.categoria || "Libros",
          precioPorDia: initialData.precioPorDia || "",
          estado: initialData.estado || "disponible",
          descripcion: initialData.descripcion || "",
          fotoUrl: initialData.fotoUrl || "",
        });
      } else {
        setFormData({
          nombre: "",
          categoria: "Libros",
          precioPorDia: "",
          estado: "disponible",
          descripcion: "",
          fotoUrl: "",
        });
      }
      setErrors({});
      setPreviewError(false);
    }
  }, [isOpen, initialData]);

  // Auto-actualizar precio cuando cambia la categoría (si estaba usando la sugerida)
  React.useEffect(() => {
    if (usaTarifaSugerida && tarifaSugerida > 0) {
      setFormData((prev) => ({ ...prev, precioPorDia: String(tarifaSugerida) }));
    }
  }, [formData.categoria, usaTarifaSugerida, tarifaSugerida]);

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.categoria) newErrors.categoria = "Selecciona una categoría";
    if (!formData.precioPorDia || Number(formData.precioPorDia) <= 0) {
      newErrors.precioPorDia = "Precio debe ser mayor a 0";
    } else if (precioNumerico < TARIFA_MINIMA) {
      newErrors.precioPorDia = `La tarifa mínima permitida en UniTrade es de $${TARIFA_MINIMA.toLocaleString()} COP/hora`;
    }
    if (!formData.descripcion.trim()) newErrors.descripcion = "La descripción es obligatoria";
    if (formData.fotoUrl && !isValidUrl(formData.fotoUrl)) {
      newErrors.fotoUrl = "URL de imagen no válida";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const usarTarifaSugerida = () => {
    if (tarifaSugerida > 0) {
      setFormData((prev) => ({ ...prev, precioPorDia: String(tarifaSugerida) }));
    }
  };

  const handleImageError = () => setPreviewError(true);
  const handleImageLoad = () => setPreviewError(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-articulo-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
            <h2 id="modal-articulo-title" className="text-xl font-bold text-white">
              {initialData ? "Editar Artículo" : "Publicar Nuevo Artículo"}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Artículo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Calculadora Científica Casio fx-991"
                className="glass-input"
                aria-invalid={!!errors.nombre}
                aria-describedby={errors.nombre ? "nombre-error" : undefined}
              />
              {errors.nombre && (
                <p id="nombre-error" className="text-xs text-red-400 mt-1" role="alert">
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-300 mb-2">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="glass-input bg-[var(--color-surface)] cursor-pointer"
                aria-invalid={!!errors.categoria}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <p className="text-xs text-red-400 mt-1" role="alert">
                  {errors.categoria}
                </p>
              )}
            </div>

            {/* Precio por Hora con Tarifa Sugerida */}
            <div>
              <label htmlFor="precioPorDia" className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                Precio por Hora (COP) <span className="text-red-400">*</span>
                {tarifaSugerida > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Zap className="w-3 h-3" />
                    Tarifa sugerida: ${tarifaSugerida.toLocaleString()}/h
                  </span>
                )}
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  id="precioPorDia"
                  name="precioPorDia"
                  value={formData.precioPorDia}
                  onChange={handleChange}
                  placeholder={tarifaSugerida > 0 ? tarifaSugerida.toLocaleString() : "5.000"}
                  min={TARIFA_MINIMA}
                  step="100"
                  className={`glass-input pl-7 ${!precioValido && formData.precioPorDia ? "border-red-500/50 focus:ring-red-500" : ""}`}
                  aria-invalid={!!errors.precioPorDia}
                  aria-describedby={errors.precioPorDia ? "precio-error" : "precio-help"}
                />
              </div>

              {/* Botón usar tarifa sugerida */}
              {tarifaSugerida > 0 && !usaTarifaSugerida && (
                <button
                  type="button"
                  onClick={usarTarifaSugerida}
                  className="mt-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Usar tarifa sugerida (${tarifaSugerida.toLocaleString()}/h)
                </button>
              )}

              {/* Indicador de tarifa válida/sugerida */}
              <div className="mt-2 flex items-center gap-2">
                {usaTarifaSugerida && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    Usando tarifa sugerida
                  </span>
                )}
                {!precioValido && formData.precioPorDia && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Mínimo: ${TARIFA_MINIMA.toLocaleString()}/h
                  </span>
                )}
                {precioValido && !usaTarifaSugerida && formData.precioPorDia && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Info className="w-3 h-3" />
                    Tarifa personalizada
                  </span>
                )}
              </div>

              {errors.precioPorDia && (
                <p className="text-xs text-red-400 mt-1" role="alert">
                  {errors.precioPorDia}
                </p>
              )}
              <p id="precio-help" className="text-xs text-gray-500 mt-1">
                Tarifa mínima: ${TARIFA_MINIMA.toLocaleString()} COP/hora
                {tarifaSugerida > 0 && ` · Sugerida para ${formData.categoria}: ${tarifaSugerida.toLocaleString()}/h`}
              </p>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estado Inicial
              </label>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.map((estado) => (
                  <button
                    key={estado.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, estado: estado.value }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      formData.estado === estado.value
                        ? `${estado.color} border-transparent text-white shadow-[0_0_0_2px_${estado.color.replace("bg-", "")}]`
                        : "border-[var(--color-border)] text-gray-300 hover:border-[var(--color-border-hover)] hover:bg-[rgba(255,255,255,0.03)]"
                    }`}
                  >
                    {estado.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-300 mb-2">
                Descripción <span className="text-red-400">*</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                placeholder="Describe el estado, características, qué incluye, etc."
                className="glass-input resize-none"
                aria-invalid={!!errors.descripcion}
              />
              {errors.descripcion && (
                <p className="text-xs text-red-400 mt-1" role="alert">
                  {errors.descripcion}
                </p>
              )}
            </div>

            {/* Foto URL */}
            <div>
              <label htmlFor="fotoUrl" className="block text-sm font-medium text-gray-300 mb-2">
                URL de la Foto (opcional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="fotoUrl"
                  name="fotoUrl"
                  value={formData.fotoUrl}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="glass-input pr-10"
                  aria-invalid={!!errors.fotoUrl}
                />
                {formData.fotoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, fotoUrl: "" }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-white transition-colors"
                    aria-label="Eliminar URL"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {errors.fotoUrl && (
                <p className="text-xs text-red-400 mt-1" role="alert">
                  {errors.fotoUrl}
                </p>
              )}

              {/* Preview */}
              {(formData.fotoUrl || previewError) && (
                <div className="mt-3 relative h-40 w-full rounded-xl overflow-hidden bg-[var(--color-canvas)] border border-[var(--color-border)]">
                  {previewError ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Image className="w-10 h-10 opacity-50" />
                      <span className="ml-2 text-sm">No se pudo cargar la imagen</span>
                    </div>
                  ) : (
                    <img
                      src={formData.fotoUrl}
                      alt="Vista previa"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !precioValido}
                className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : initialData ? (
                  "Actualizar"
                ) : (
                  "Publicar"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioArticuloModal;