import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, MapPin, Star, Clock, User, Shield, AlertCircle, Heart, Share2, Package, Calendar, Loader2 } from 'lucide-react'
import TimeBookingCalculator from '../components/rentals/TimeBookingCalculator'
import CheckoutModal from '../components/checkout/CheckoutModal'
import api from '../services/api'

const mockItem = {
  id: 1,
  title: 'MacBook Pro 13" M2 2023',
  description: 'MacBook Pro 13 pulgadas con chip M2, 8GB RAM, 256GB SSD. Perfecto para trabajos universitarios, programación y diseño. Incluye cargador original y funda protectora. Estado impecable, sin golpes ni rayones.',
  category: 'Tecnología',
  condition: 'like_new',
  hourlyRate: 15000,
  location: 'Biblioteca Central, Campus Principal',
  owner: {
    id: 5,
    name: 'Carlos Mendoza',
    rating: 4.9,
    reviews: 23,
    avatar: 'CM',
    verified: true,
  },
  images: ['💻', '💻', '💻'],
  availableFrom: '2024-01-15',
  availableTo: '2024-12-31',
  createdAt: '2024-01-10',
}

export default function ItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImage, setCurrentImage] = useState(0)
  const [showCheckout, setShowCheckout] = useState(false)
  const [bookingData, setBookingData] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/items/${id}`)
        setItem(response.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Artículo no encontrado')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  const handleBook = (data) => {
    setBookingData(data)
    setShowCheckout(true)
  }

  const handleCheckoutClose = () => {
    setShowCheckout(false)
    setBookingData(null)
  }

  const handlePaymentSuccess = () => {
    setShowCheckout(false)
    setBookingData(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" aria-hidden="true" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900">Artículo no encontrado</h2>
          <p className="text-gray-500 mt-2">{error || 'El artículo no existe o fue eliminado'}</p>
          <Link to="/catalogo" className="mt-4 inline-flex items-center gap-2 btn-primary">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const conditionLabels = {
    new: 'Nuevo',
    like_new: 'Como nuevo',
    good: 'Bueno',
    fair: 'Regular',
  }

  const conditionColors = {
    new: 'bg-green-100 text-green-700',
    like_new: 'bg-blue-100 text-blue-700',
    good: 'bg-yellow-100 text-yellow-700',
    fair: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-blue-600">Inicio</Link></li>
            <li><ChevronLeft className="w-4 h-4" aria-hidden="true" /></li>
            <li><Link to="/catalogo" className="hover:text-blue-600">Catálogo</Link></li>
            <li><ChevronLeft className="w-4 h-4" aria-hidden="true" /></li>
            <li className="text-gray-900 truncate max-w-xs">{item.title}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden relative">
              <div className="w-full h-full flex items-center justify-center text-8xl">
                {item.images[currentImage] || '📦'}
              </div>
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(prev => (prev - 1 + item.images.length) % item.images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setCurrentImage(prev => (prev + 1) % item.images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 rotate-180" aria-hidden="true" />
                  </button>
                </>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <button className={`p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-600'}`} aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'} onClick={() => setIsFavorite(!isFavorite)}>
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} aria-hidden="true" />
                </button>
                <button className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors" aria-label="Compartir">
                  <Share2 className="w-5 h-5 text-gray-600" aria-hidden="true" />
                </button>
              </div>
            </div>

            {item.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2" role="list" aria-label="Miniaturas">
                {item.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentImage ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                    }`}
                    aria-label={`Ver imagen ${i + 1}`}
                    aria-current={i === currentImage ? 'true' : 'false'}
                  >
                    <span className="w-full h-full block text-3xl flex items-center justify-center bg-gray-100">{img}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{item.category}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${conditionColors[item.condition] || 'bg-gray-100 text-gray-700'}`}>
                  {conditionLabels[item.condition] || item.condition}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                  <span>{item.owner.rating} ({item.owner.reviews} reseñas)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>{item.location}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-gray-900">${item.hourlyRate.toLocaleString()}</span>
                <span className="text-gray-500">/ hora</span>
              </div>
              <p className="text-sm text-gray-500">Comisión del 10% incluida en el total al reservar</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Disponibilidad</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  <div>
                    <p className="text-gray-500">Disponible desde</p>
                    <p className="font-medium">{new Date(item.availableFrom).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  <div>
                    <p className="text-gray-500">Hasta</p>
                    <p className="font-medium">{new Date(item.availableTo).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            <TimeBookingCalculator
              hourlyRate={item.hourlyRate}
              availableFrom={item.availableFrom}
              availableTo={item.availableTo}
              onBook={handleBook}
            />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Publicado por</h2>
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {item.owner.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.owner.name}</h3>
                  {item.owner.verified && (
                    <Shield className="w-5 h-5 text-blue-500" aria-label="Usuario verificado" />
                  )}
                </div>
                <p className="text-gray-500 mt-1">Miembro desde {new Date(item.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                    <span className="font-medium">{item.owner.rating}</span>
                    <span className="text-gray-500">({item.owner.reviews} reseñas)</span>
                  </div>
                </div>
              </div>
              <Link to={`/perfil/${item.owner.id}`} className="btn-secondary">
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && bookingData && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={handleCheckoutClose}
          rentalData={{
            id: item.id,
            title: item.title,
            hourlyRate: item.hourlyRate,
            hours: bookingData.hours,
            startDateTime: bookingData.startDateTime,
            endDateTime: bookingData.endDateTime,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}