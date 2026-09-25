import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { User, Mail, Phone, Shield, Star, Settings, LogOut, Edit2, Camera } from 'lucide-react'

export default function Perfil() {
  const { user, updateUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('perfil')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    university: user?.university || '',
    career: user?.career || '',
  })

  const handleSave = () => {
    updateUser(formData)
    setEditing(false)
  }

  const tabs = [
    { id: 'perfil', label: 'Mi Perfil', icon: User },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'config', label: 'Configuración', icon: Settings },
  ]

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <nav className="flex gap-1" aria-label="Pestañas de perfil">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setEditing(false) }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'perfil' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {editing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors" aria-label="Cambiar foto">
                      <Camera className="w-5 h-5 text-gray-600" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                        <input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="input-field"
                          placeholder="+57 300 000 0000"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">Universidad</label>
                          <input
                            id="university"
                            type="text"
                            value={formData.university}
                            onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label htmlFor="career" className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
                          <input
                            id="career"
                            type="text"
                            value={formData.career}
                            onChange={(e) => setFormData(prev => ({ ...prev, career: e.target.value }))}
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button onClick={handleSave} className="btn-primary">
                          Guardar cambios
                        </button>
                        <button onClick={() => { setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', university: user?.university || '', career: user?.career || '' }); setEditing(false) }} className="btn-secondary">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Usuario'}</h2>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Mail className="w-4 h-4" aria-hidden="true" />{user?.email || 'Sin email'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" aria-hidden="true" />{user?.phone || 'Sin teléfono'}</span>
                        <span className="flex items-center gap-1"><User className="w-4 h-4" aria-hidden="true" />{user?.university || 'Sin universidad'}</span>
                        <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />{user?.career || 'Sin carrera'}</span>
                      </div>
                      <button onClick={() => setEditing(true)} className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                        Editar perfil
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">24</p>
                  <p className="text-sm text-gray-500">Alquileres completados</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">4.9</p>
                  <p className="text-sm text-gray-500">Calificación promedio</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-900">156</p>
                  <p className="text-sm text-gray-500">Artículos publicados</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="max-w-2xl space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" aria-hidden="true" />
                  <div>
                    <h3 className="font-medium text-blue-900">Autenticación de dos factores</h3>
                    <p className="text-sm text-blue-700">Añade una capa extra de seguridad a tu cuenta</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button className="w-full btn-secondary justify-start gap-3">
                  <Shield className="w-5 h-5" aria-hidden="true" />
                  <span>Activar 2FA</span>
                </button>
                <button className="w-full btn-secondary justify-start gap-3">
                  <Settings className="w-5 h-5" aria-hidden="true" />
                  <span>Cambiar contraseña</span>
                </button>
                <button className="w-full btn-secondary justify-start gap-3">
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span>Dispositivos conectados</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Notificaciones</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Nuevos alquileres', desc: 'Recibe alertas cuando alguien alquila tu artículo' },
                    { label: 'Recordatorios de devolución', desc: 'Te avisamos antes de que venza el plazo' },
                    { label: 'Promociones y ofertas', desc: 'Descuentos exclusivos para ti' },
                    { label: 'Actualizaciones de la app', desc: 'Novedades y mejoras' },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <button onClick={logout} className="w-full btn-secondary justify-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}