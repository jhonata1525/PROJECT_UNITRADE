import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Info } from 'lucide-react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function TimeBookingCalculator({
  hourlyRate,
  minHours = 1,
  maxHours = 168,
  availableFrom,
  availableTo,
  onBook,
  disabledDates = [],
  className = '',
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [errors, setErrors] = useState({})

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysCount = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    const days = []
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) })
    }
    for (let d = 1; d <= daysCount; d++) {
      const date = new Date(year, month, d)
      days.push({ day: d, currentMonth: true, date })
    }
    const remaining = (7 - (days.length % 7)) % 7
    for (let n = 1; n <= remaining; n++) {
      days.push({ day: n, currentMonth: false, date: new Date(year, month + 1, n) })
    }
    return days
  }, [currentMonth])

  const isDateDisabled = (date) => {
    if (date < today) return true
    if (availableFrom && date < new Date(availableFrom)) return true
    if (availableTo && date > new Date(availableTo)) return true
    return disabledDates.some(d => new Date(d).toDateString() === date.toDateString())
  }

  const isDateSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const calculateHours = () => {
    if (!startTime || !endTime) return 0
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const start = sh * 60 + sm
    const end = eh * 60 + em
    return end > start ? (end - start) / 60 : 0
  }

  const hours = calculateHours()
  const subtotal = hours * hourlyRate
  const commission = subtotal * 0.10
  const total = subtotal + commission

  const validateBooking = () => {
    const newErrors = {}
    if (!selectedDate) {
      newErrors.date = 'Selecciona una fecha'
    }
    if (hours < minHours) {
      newErrors.time = `Mínimo ${minHours} hora${minHours > 1 ? 's' : ''}`
    }
    if (hours > maxHours) {
      newErrors.time = `Máximo ${maxHours} horas`
    }
    if (startTime >= endTime) {
      newErrors.time = 'La hora de inicio debe ser anterior a la de fin'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBook = () => {
    if (!validateBooking()) return
    const startDateTime = new Date(selectedDate)
    const [sh, sm] = startTime.split(':').map(Number)
    startDateTime.setHours(sh, sm, 0, 0)

    const endDateTime = new Date(selectedDate)
    const [eh, em] = endTime.split(':').map(Number)
    endDateTime.setHours(eh, em, 0, 0)

    onBook?.({
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      hours,
      subtotal,
      commission,
      total,
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const formatTime = (time) => {
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${m} ${ampm}`
  }

  return (
    <div className={`card ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Reservar por Horas</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                <span className="font-medium text-gray-900 capitalize">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((item, i) => {
                  const disabled = isDateDisabled(item.date)
                  const selected = isDateSelected(item.date)
                  return (
                    <button
                      key={i}
                      onClick={() => !disabled && setSelectedDate(item.date)}
                      disabled={disabled}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                        !item.currentMonth
                          ? 'text-gray-300'
                          : disabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : selected
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                      aria-label={item.date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                      aria-selected={selected}
                      aria-disabled={disabled}
                    >
                      {item.day}
                    </button>
                  )
                })}
              </div>
            </div>
            {errors.date && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Horario</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-xs text-gray-500 mb-1">Hora de inicio</label>
                <select
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
                  disabled={!selectedDate}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                      {formatTime(`${String(h).padStart(2, '0')}:00`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="endTime" className="block text-xs text-gray-500 mb-1">Hora de fin</label>
                <select
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                  disabled={!selectedDate}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                      {formatTime(`${String(h).padStart(2, '0')}:00`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.time && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {errors.time}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-blue-900">Resumen de la reserva</p>
                <div className="mt-2 space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Fecha:</span> {selectedDate ? formatDate(selectedDate) : 'Sin seleccionar'}</p>
                  <p><span className="font-medium">Horario:</span> {selectedDate ? `${formatTime(startTime)} - ${formatTime(endTime)}` : 'Sin seleccionar'}</p>
                  <p><span className="font-medium">Duración:</span> {hours} hora{hours !== 1 ? 's' : ''}</p>
                  <p className="pt-2 border-t border-blue-200"><span className="font-medium">Tarifa:</span> ${hourlyRate.toLocaleString()}/hr</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({hours}h × ${hourlyRate.toLocaleString()})</span>
              <span className="font-medium">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Comisión plataforma (10%)</span>
              <span className="font-medium">${commission.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total.toLocaleString()} COP</span>
            </div>
          </div>

          <button
            onClick={handleBook}
            disabled={!selectedDate || hours < minHours || isLoading}
            className="w-full btn-primary py-3 disabled:opacity-50"
          >
            {isLoading ? 'Procesando...' : 'Continuar al Pago'}
          </button>
        </div>
      </div>
    </div>
  )
}