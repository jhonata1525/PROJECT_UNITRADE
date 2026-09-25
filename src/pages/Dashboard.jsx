import { useAuth } from '../context/AuthContext'
import { Package, Wallet, QrCode, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Artículos alquilados', value: '12', icon: Package, color: 'bg-blue-100 text-blue-600', href: '/catalogo' },
  { label: 'Saldo disponible', value: '$45.200', icon: Wallet, color: 'bg-green-100 text-green-600', href: '/billetera' },
  { label: 'Entregas pendientes', value: '3', icon: QrCode, color: 'bg-orange-100 text-orange-600', href: '/scanner' },
  { label: 'Calificación', value: '4.8', icon: TrendingUp, color: 'bg-purple-100 text-purple-600', href: '/perfil' },
]

const recentActivity = [
  { id: 1, type: 'rental', title: 'MacBook Pro 13"', desc: 'Alquilado a Juan P.', time: 'Hace 2h', status: 'active', icon: Package },
  { id: 2, type: 'return', title: 'Cámara Canon EOS', desc: 'Devuelto a María G.', time: 'Ayer', status: 'completed', icon: CheckCircle },
  { id: 3, type: 'rental', title: 'Proyector Epson', desc: 'Pendiente de entrega', time: 'Mañana 10:00', status: 'pending', icon: Clock },
  { id: 4, type: 'issue', title: 'iPad Air', desc: 'Reporte de daño menor', time: 'Hace 3d', status: 'issue', icon: AlertCircle },
]

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bienvenido, {user?.name?.split(' ')[0] || 'Usuario'}</h1>
        <p className="text-gray-500 mt-1">Gestiona tus alquileres y ganancias desde aquí</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              to={stat.href}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
          <Link to="/catalogo" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Ver todo</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.map((activity) => {
            const Icon = activity.icon
            const statusStyles = {
              active: 'bg-blue-100 text-blue-700',
              completed: 'bg-green-100 text-green-700',
              pending: 'bg-yellow-100 text-yellow-700',
              issue: 'bg-red-100 text-red-700',
            }
            const statusLabels = {
              active: 'En curso',
              completed: 'Completado',
              pending: 'Pendiente',
              issue: 'Incidencia',
            }
            return (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${statusStyles[activity.status]}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                    <p className="text-sm text-gray-500">{activity.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[activity.status]}`}>
                      {statusLabels[activity.status]}
                    </span>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <Link to="/catalogo" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
              <Package className="w-6 h-6 text-blue-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Explorar Catálogo</h3>
              <p className="text-gray-500 mt-1">Encuentra artículos para alquilar cerca de ti</p>
            </div>
          </div>
        </Link>
        <Link to="/billetera" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
              <Wallet className="w-6 h-6 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mi Billetera</h3>
              <p className="text-gray-500 mt-1">Revisa tu saldo y solicita retiros</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}