import { useState } from 'react'
import RentalVerifier from '../components/verification/RentalVerifier'
import { QrCode, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react'

const mockRentals = [
  { id: 1, title: 'MacBook Pro 13"', status: 'pending_pickup', code: 'A1B2', type: 'Entrega', time: 'Hoy 14:00' },
  { id: 2, title: 'Cámara Canon EOS', status: 'active', code: 'C3D4', type: 'Devolución', time: 'Mañana 10:00' },
  { id: 3, title: 'Proyector Epson', status: 'pending_return', code: 'E5F6', type: 'Devolución', time: 'En 2 días' },
]

export default function Scanner() {
  const [showVerifier, setShowVerifier] = useState(false)
  const [selectedRental, setSelectedRental] = useState(null)

  const handleVerifySuccess = (data) => {
    console.log('Verificación exitosa:', data)
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Scanner QR / PIN</h1>
        <p className="text-gray-500 mt-1">Valida entregas y devoluciones escaneando el código o ingresando el PIN</p>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <QrCode className="w-7 h-7 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Escanear Código QR</h2>
            <p className="text-sm text-gray-500">Apunta la cámara al código del artículo</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedRental(mockRentals[0])
            setShowVerifier(true)
          }}
          className="w-full sm:w-auto btn-primary"
        >
          <QrCode className="w-5 h-5 mr-2" aria-hidden="true" />
          Abrir Cámara
        </button>
        <p className="text-xs text-gray-500 mt-3 text-center sm:text-left">
          Si la cámara no funciona, usa la pestaña <strong>PIN Manual</strong> en el modal
        </p>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Alquileres Pendientes de Validación</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {mockRentals.map(rental => (
            <div key={rental.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Package className="w-6 h-6 text-gray-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{rental.title}</h3>
                  <p className="text-sm text-gray-500">Código: <span className="font-mono font-medium">{rental.code}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rental.status === 'pending_pickup' ? 'bg-blue-100 text-blue-700' :
                  rental.status === 'active' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {rental.type}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {rental.time}
                </span>
                <button
                  onClick={() => {
                    setSelectedRental(rental)
                    setShowVerifier(true)
                  }}
                  className="btn-primary text-sm"
                >
                  Validar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showVerifier && selectedRental && (
        <RentalVerifier
          rentalId={selectedRental.id}
          onVerifySuccess={handleVerifySuccess}
          onClose={() => setShowVerifier(false)}
        />
      )}
    </div>
  )
}