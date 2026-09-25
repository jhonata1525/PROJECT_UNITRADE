import { useState } from 'react'
import { Search, Filter, Tag, Star, MapPin, Clock, Heart, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const categories = [
  'Todos', 'Tecnología', 'Deportes', 'Fotografía', 'Herramientas', 'Juegos', 'Instrumentos', 'Otros'
]

const mockItems = [
  { id: 1, title: 'MacBook Pro 13" M2', category: 'Tecnología', price: 15000, rating: 4.9, reviews: 23, location: 'Campus Central', owner: 'Carlos M.', image: '💻' },
  { id: 2, title: 'Cámara Canon EOS R50', category: 'Fotografía', price: 25000, rating: 4.8, reviews: 15, location: 'Facultad de Artes', owner: 'Ana L.', image: '📷' },
  { id: 3, title: 'Proyector Epson Full HD', category: 'Tecnología', price: 8000, rating: 4.7, reviews: 31, location: 'Biblioteca', owner: 'Pedro R.', image: '📽️' },
  { id: 4, title: 'Bicicleta MTB 29"', category: 'Deportes', price: 12000, rating: 4.6, reviews: 8, location: 'Gimnasio', owner: 'Luis G.', image: '🚲' },
  { id: 5, title: 'Taladro Inalámbrico DeWalt', category: 'Herramientas', price: 5000, rating: 4.9, reviews: 12, location: 'Talleres', owner: 'Miguel T.', image: '🔧' },
  { id: 6, title: 'Guitarra Acústica Yamaha', category: 'Instrumentos', price: 10000, rating: 4.8, reviews: 19, location: 'Conservatorio', owner: 'Sofía P.', image: '🎸' },
  { id: 7, title: 'Nintendo Switch OLED', category: 'Juegos', price: 18000, rating: 4.9, reviews: 42, location: 'Residencias', owner: 'Diego K.', image: '🎮' },
  { id: 8, title: 'Drone DJI Mini 3 Pro', category: 'Fotografía', price: 30000, rating: 4.7, reviews: 7, location: 'Campus Norte', owner: 'Roberto M.', image: '🚁' },
]

export default function Catalogo() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [view, setView] = useState('grid')

  const filteredItems = mockItems.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'Todos' || item.category === category)
  )

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Catálogo de Artículos</h1>
        <p className="text-gray-500 mt-1">Encuentra lo que necesitas para tus proyectos universitarios</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar artículos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              aria-label="Buscar artículos"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field pl-10 pr-8 appearance-none bg-white"
              aria-label="Filtrar por categoría"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg ${view === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Vista en cuadrícula"
              aria-pressed={view === 'grid'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg ${view === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Vista en lista"
              aria-pressed={view === 'list'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Categorías rápidas">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {filteredItems.length} {filteredItems.length === 1 ? 'artículo' : 'artículos'} encontrado{filteredItems.length !== 1 ? 's' : ''}
        </p>
        <label className="flex items-center gap-2 text-sm text-gray-500">
          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Solo disponibles ahora
        </label>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Link key={item.id} to={`/catalogo/${item.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-video bg-gray-100 flex items-center justify-center text-6xl relative overflow-hidden">
                <span>{item.image}</span>
                <div className="absolute top-2 right-2 p-1 bg-white/90 rounded-full backdrop-blur-sm">
                  <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" aria-label="Favorito" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                    <span className="font-medium">{item.rating}</span>
                    <span className="text-gray-400">({item.reviews})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-lg font-bold text-gray-900">${item.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">/ hora</p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg group-hover:bg-blue-700 transition-colors">
                    Alquilar
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <Link key={item.id} to={`/catalogo/${item.id}`} className="card p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-100 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 relative">
                <span>{item.image}</span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                      <span>{item.rating} ({item.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>Por {item.owner}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 sm:mt-0 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-4">
                  <div className="text-right sm:text-left">
                    <p className="text-xl font-bold text-gray-900">${item.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">/ hora</p>
                  </div>
                  <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg group-hover:bg-blue-700 transition-colors whitespace-nowrap">
                    Ver detalle
                    <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron artículos</h3>
          <p className="text-gray-500 mt-1">Intenta cambiar los filtros o busca con otros términos</p>
        </div>
      )}
    </div>
  )
}