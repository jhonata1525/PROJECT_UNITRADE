import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '../../services/api'
import { Image, Camera, Tag, DollarSign, MapPin, AlertCircle, CheckCircle, Loader2, X, Trash2 } from 'lucide-react'

const CATEGORIES = [
  'Tecnología', 'Deportes', 'Fotografía', 'Herramientas',
  'Juegos', 'Instrumentos', 'Electrodomésticos', 'Otros'
]

const CONDITIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'like_new', label: 'Como nuevo' },
  { value: 'good', label: 'Bueno' },
  { value: 'fair', label: 'Regular' },
]

export default function PublishItemForm({ onSuccess, onCancel, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good',
    hourlyRate: '',
    suggestedRate: null,
    location: '',
    images: [],
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingRate, setIsFetchingRate] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(null)

  const fetchSuggestedRate = useCallback(async (category) => {
    if (!category) return
    setIsFetchingRate(true)
    try {
      const response = await api.get('/items/suggested-rate', { params: { category } })
      setFormData(prev => ({ ...prev, suggestedRate: response.data.suggestedRate }))
    } catch (err) {
      console.warn('No se pudo obtener tarifa sugerida:', err)
    } finally {
      setIsFetchingRate(false)
    }
  }, [])

  useEffect(() => {
    if (formData.category) {
      fetchSuggestedRate(formData.category)
    }
  }, [formData.category, fetchSuggestedRate])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'El título es requerido'
    else if (formData.title.length < 5) newErrors.title = 'Mínimo 5 caracteres'
    else if (formData.title.length > 80) newErrors.title = 'Máximo 80 caracteres'

    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida'
    else if (formData.description.length < 20) newErrors.description = 'Mínimo 20 caracteres'
    else if (formData.description.length > 1000) newErrors.description = 'Máximo 1000 caracteres'

    if (!formData.category) newErrors.category = 'Selecciona una categoría'
    if (!formData.condition) newErrors.condition = 'Selecciona el estado'

    const rate = parseFloat(formData.hourlyRate)
    if (!formData.hourlyRate.trim()) newErrors.hourlyRate = 'La tarifa es requerida'
    else if (isNaN(rate) || rate < 1000) newErrors.hourlyRate = 'Mínimo $1.000/hora'
    else if (rate > 100000) newErrors.hourlyRate = 'Máximo $100.000/hora'

    if (!formData.location.trim()) newErrors.location = 'La ubicación es requerida'
    if (formData.images.length === 0) newErrors.images = 'Sube al menos 1 foto'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach(file => formDataToSend.append('images', file))
        } else {
          formDataToSend.append(key, value)
        }
      })

      await api.post('/items', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSubmitSuccess('¡Artículo publicado exitosamente!')
      setTimeout(() => onSuccess?.(), 1500)
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Error al publicar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (submitError) setSubmitError(null)
  }

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles
      .filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
      .slice(0, 5 - formData.images.length)
    setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }))
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }))
  }, [formData.images.length, errors.images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  })

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const fileToPreview = (file) => URL.createObjectURL(file)

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Publicar Artículo</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          aria-label="Cancelar"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        {submitSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-700" role="status">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm">{submitSuccess}</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Título del artículo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Ej: MacBook Pro 13\" M2 2023"
            className={`input-field ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            maxLength={80}
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'title-error' : 'title-hint'}
            disabled={isLoading}
          />
          {errors.title ? (
            <p id="title-error" className="mt-1.5 text-sm text-red-600" role="alert">{errors.title}</p>
          ) : (
            <p id="title-hint" className="mt-1.5 text-sm text-gray-500">{formData.title.length}/80</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe el estado, accesorios incluidos, detalles importantes..."
            rows={4}
            className={`input-field resize-none ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            maxLength={1000}
            aria-invalid={errors.description ? 'true' : 'false'}
            aria-describedby={errors.description ? 'desc-error' : 'desc-hint'}
            disabled={isLoading}
          />
          {errors.description ? (
            <p id="desc-error" className="mt-1.5 text-sm text-red-600" role="alert">{errors.description}</p>
          ) : (
            <p id="desc-hint" className="mt-1.5 text-sm text-gray-500 text-right">{formData.description.length}/1000</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
              Categoría <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`input-field pl-10 ${errors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                aria-invalid={errors.category ? 'true' : 'false'}
                disabled={isLoading}
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {errors.category && (
              <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.category}</p>
            )}
            {formData.suggestedRate && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm text-blue-800">
                  Tarifa promedio sugerida: <strong>${formData.suggestedRate.toLocaleString()}/hr</strong>
                </span>
                {isFetchingRate && <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" aria-hidden="true" />}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1.5">
              Estado <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={`input-field ${errors.condition ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                aria-invalid={errors.condition ? 'true' : 'false'}
                disabled={isLoading}
              >
                {CONDITIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {errors.condition && (
              <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.condition}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1.5">
              Tarifa por hora (COP) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                placeholder="15000"
                min="1000"
                max="100000"
                step="500"
                className={`input-field pl-10 ${errors.hourlyRate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                aria-invalid={errors.hourlyRate ? 'true' : 'false'}
                aria-describedby={errors.hourlyRate ? 'rate-error' : 'rate-hint'}
                disabled={isLoading}
              />
            </div>
            {errors.hourlyRate ? (
              <p id="rate-error" className="mt-1.5 text-sm text-red-600" role="alert">{errors.hourlyRate}</p>
            ) : (
              <p id="rate-hint" className="mt-1.5 text-sm text-gray-500">Entre $1.000 y $100.000</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
              Ubicación de entrega <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Ej: Biblioteca Central, Campus Norte"
                className={`input-field pl-10 ${errors.location ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                aria-invalid={errors.location ? 'true' : 'false'}
                aria-describedby={errors.location ? 'loc-error' : undefined}
                disabled={isLoading}
              />
            </div>
            {errors.location && (
              <p id="loc-error" className="mt-1.5 text-sm text-red-600" role="alert">{errors.location}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fotos del artículo <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-2">(Máx. 5, 5MB cada una)</span>
          </label>
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-xl p-6 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} transition-colors`}
            role="button"
            tabIndex={0}
            aria-label="Subir fotos del artículo"
          >
            <input {...getInputProps()} />
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {formData.images.map((file, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={fileToPreview(file)} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                      aria-label={`Eliminar foto ${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 transition-colors">
                    <Camera className="w-8 h-8" aria-hidden="true" />
                    <span className="text-sm">Añadir más</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-600 mb-1">Arrastra fotos aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-500">JPG, PNG, WebP · Máx. 5MB</p>
              </div>
            )}
          </div>
          {errors.images && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              {errors.images}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 btn-primary"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                Publicando...
              </span>
            ) : (
              'Publicar Artículo'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}