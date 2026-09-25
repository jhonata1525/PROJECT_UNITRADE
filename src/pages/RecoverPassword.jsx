import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, AlertCircle, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

export default function RecoverPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputsRef = useRef([])

  const validateEmail = () => {
    if (!email.trim()) return 'El correo es requerido'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Formato inválido'
    if (!email.endsWith('@unisimon.edu.co')) return 'Solo @unisimon.edu.co'
    return null
  }

  const validateCode = () => {
    if (code.join('').length !== 6) return 'Código incompleto'
    return null
  }

  const validatePasswords = () => {
    if (!newPassword) return 'Nueva contraseña requerida'
    if (newPassword.length < 8) return 'Mínimo 8 caracteres'
    if (!/[A-Z]/.test(newPassword)) return 'Al menos una mayúscula'
    if (!/[a-z]/.test(newPassword)) return 'Al menos una minúscula'
    if (!/[0-9]/.test(newPassword)) return 'Al menos un número'
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }

  const handleStep1 = async (e) => {
    e.preventDefault()
    const error = validateEmail()
    if (error) return setErrors({ email: error })
    setErrors({})
    setIsLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStep('code')
      setErrors({})
    } catch (err) {
      setErrors({ email: err.message || 'Error al enviar código' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    const error = validateCode()
    if (error) return setErrors({ code: error })
    setErrors({})
    setIsLoading(true)
    try {
      await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.join('') }),
      })
      setStep('password')
    } catch (err) {
      setErrors({ code: err.message || 'Código inválido' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    const error = validatePasswords()
    if (error) return setErrors({ password: error })
    setErrors({})
    setIsLoading(true)
    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.join(''), password: newPassword }),
      })
      navigate('/login', { replace: true })
    } catch (err) {
      setErrors({ password: err.message || 'Error al cambiar contraseña' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6" aria-label="UniTrade Inicio">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="text-2xl font-bold text-gray-900">UniTrade</span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h1>
          <p className="text-gray-500 mt-2">Te ayudaremos a restablecer tu acceso</p>
        </div>

        <div className="card p-6 sm:p-8">
          {step === 'email' && (
            <form onSubmit={handleStep1} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo institucional
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                    placeholder="usuario@unisimon.edu.co"
                    className={`input-field pl-10 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.email}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="w-full btn-primary py-3">
                {isLoading ? 'Enviando...' : 'Enviar código de verificación'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleStep2} className="space-y-5" noValidate>
              <p className="text-gray-600 text-center">Ingresa el código de 6 dígitos enviado a <strong>{email}</strong></p>

              <div className="flex justify-center gap-2" role="group" aria-label="Código de verificación">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => inputsRef.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 1)
                      const newCode = [...code]
                      newCode[index] = val
                      setCode(newCode)
                      if (val && index < 5) setFocusedIndex(index + 1)
                      else if (!val && index > 0) setFocusedIndex(index - 1)
                      setErrors({})
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !code[index] && index > 0) setFocusedIndex(index - 1)
                      if (e.key === 'ArrowLeft' && index > 0) setFocusedIndex(index - 1)
                      if (e.key === 'ArrowRight' && index < 5) setFocusedIndex(index + 1)
                    }}
                    onFocus={() => setFocusedIndex(index)}
                    autoComplete="one-time-code"
                    className={`w-10 h-12 text-center text-2xl font-mono rounded-lg border-2 transition-all ${
                      index === focusedIndex ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : digit ? 'border-green-300 bg-green-50' : 'border-gray-300'
                    } focus:outline-none`}
                    aria-label={`Dígito ${index + 1}`}
                  />
                ))}
              </div>

              {errors.code && <p className="text-center text-sm text-red-600" role="alert">{errors.code}</p>}

              <button type="submit" disabled={isLoading} className="w-full btn-primary py-3">
                {isLoading ? 'Verificando...' : 'Verificar código'}
              </button>

              <p className="text-center text-sm text-gray-500">
                <button type="button" onClick={() => setStep('email')} className="text-blue-600 hover:underline">
                  Cambiar correo
                </button>
              </p>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleStep3} className="space-y-5" noValidate>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrors({}) }}
                  placeholder="••••••••"
                  className={`input-field ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
                  placeholder="••••••••"
                  className={`input-field ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <p className="text-sm text-red-600" role="alert">{errors.password}</p>}

              <button type="submit" disabled={isLoading} className="w-full btn-primary py-3">
                {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Recordaste tu contraseña? <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}