import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, CheckCircle, AlertCircle, Clock, MessageSquare, X, RefreshCw } from 'lucide-react'

export default function WhatsAppOtpModal({
  isOpen,
  onClose,
  method = 'whatsapp',
  phoneNumber,
  onSuccess,
  onResend,
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(300)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [resendDisabled, setResendDisabled] = useState(true)
  const inputsRef = useRef([])
  const timerRef = useRef(null)

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const startTimer = useCallback(() => {
    setTimeLeft(300)
    setResendDisabled(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setResendDisabled(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const verifyOtp = useCallback(async () => {
    const code = otp.join('')
    if (code.length !== 6) return

    setStatus('loading')
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, method, phone: phoneNumber }),
      })

      const data = await response.json()
      if (data.success) {
        setStatus('success')
        onSuccess?.(data)
      } else {
        throw new Error(data.message || 'Código inválido')
      }
    } catch (err) {
      setStatus('error')
      setError(err.message)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [otp, method, phoneNumber, onSuccess])

  const handleResend = async () => {
    if (resendDisabled) return
    setStatus('loading')
    setError(null)
    try {
      await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, phone: phoneNumber }),
      })
      startTimer()
    } catch (err) {
      setError('Error al reenviar código')
    } finally {
      setStatus('idle')
    }
  }

  useEffect(() => {
    if (isOpen) {
      startTimer()
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isOpen, startTimer])

  useEffect(() => {
    if (inputsRef.current[focusedIndex]) {
      inputsRef.current[focusedIndex].focus()
    }
  }, [focusedIndex])

  const handleChange = (index, value) => {
    const numeric = value.replace(/\D/g, '').slice(0, 1)
    const newOtp = [...otp]
    newOtp[index] = numeric
    setOtp(newOtp)

    if (numeric && index < 5) {
      setFocusedIndex(index + 1)
    } else if (!numeric && index > 0) {
      setFocusedIndex(index - 1)
    }

    if (newOtp.join('').length === 6) {
      verifyOtp()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setFocusedIndex(index - 1)
    }
    if (e.key === 'ArrowLeft' && index > 0) setFocusedIndex(index - 1)
    if (e.key === 'ArrowRight' && index < 5) setFocusedIndex(index + 1)
    if (e.key === 'Enter' && otp.join('').length === 6) verifyOtp()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const digits = pasted.split('')
    digits.forEach((digit, i) => {
      if (i < 6) {
        const newOtp = [...otp]
        newOtp[i] = digit
        setOtp(newOtp)
      }
    })
    setFocusedIndex(Math.min(digits.length, 5))
    if (digits.length === 6) verifyOtp()
  }

  const renderStatusIcon = () => {
    if (status === 'loading') {
      return <Loader2 className="animate-spin w-8 h-8 text-blue-500" aria-hidden="true" />
    }
    if (status === 'success') {
      return <CheckCircle className="w-8 h-8 text-green-500" aria-hidden="true" />
    }
    if (status === 'error') {
      return <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
    }
    return (
      <div className="w-8 h-8 text-gray-400 flex items-center justify-center">
        {method === 'whatsapp' ? (
          <MessageSquare className="w-8 h-8" aria-hidden="true" />
        ) : (
          <Clock className="w-8 h-8" aria-hidden="true" />
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Verificación en 2 pasos</h2>
          <button
            onClick={onClose}
            disabled={status === 'loading'}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 text-center">
          {renderStatusIcon()}

          <h3 className="mt-4 text-xl font-semibold text-gray-900">
            {status === 'success' ? '¡Verificado!' : 'Ingresa el código de 6 dígitos'}
          </h3>

          <p className="mt-2 text-gray-600">
            {status === 'success'
              ? 'Tu cuenta ha sido verificada correctamente.'
              : `Enviamos un código a ${method === 'whatsapp' ? 'WhatsApp' : 'tu email'} ${phoneNumber ? `terminado en ${phoneNumber.slice(-4)}` : ''}.`}
          </p>

          {timeLeft > 0 && status !== 'success' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>Expira en: <strong className="text-gray-900 font-mono">{formatTime(timeLeft)}</strong></span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={(e) => e.preventDefault()} className="mt-6">
              <div className="flex justify-center gap-2" role="group" aria-label="Código de verificación de 6 dígitos">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => inputsRef.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => setFocusedIndex(index)}
                    autoComplete="one-time-code"
                    className={`w-10 h-12 text-center text-2xl font-mono rounded-lg border-2 transition-all ${
                      index === focusedIndex
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                        : digit
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } focus:outline-none`}
                    aria-label={`Dígito ${index + 1} del código`}
                    disabled={status === 'loading' || status === 'success'}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendDisabled || status === 'loading'}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>Reenviar código</span>
                </button>
              </div>
            </form>
          )}

          {status === 'success' && (
            <p className="mt-4 text-sm text-green-600">Redirigiendo al panel principal...</p>
          )}
        </div>
      </div>
    </div>
  )
}