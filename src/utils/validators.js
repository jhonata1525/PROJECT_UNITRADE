export function validateEmail(email) {
  if (!email || !email.trim()) return 'El correo es requerido'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Formato de correo inválido'
  if (!email.endsWith('@unisimon.edu.co')) return 'Solo se permite dominio @unisimon.edu.co'
  return null
}

export function validatePassword(password) {
  if (!password) return 'La contraseña es requerida'
  if (password.length < 8) return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'Al menos una mayúscula'
  if (!/[a-z]/.test(password)) return 'Al menos una minúscula'
  if (!/[0-9]/.test(password)) return 'Al menos un número'
  return null
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Confirma tu contraseña'
  if (password !== confirmPassword) return 'Las contraseñas no coinciden'
  return null
}

export function validatePhone(phone) {
  if (!phone || !phone.trim()) return 'El teléfono es requerido'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 10) return 'Número de teléfono inválido'
  return null
}

export function validatePin(pin, length = 4) {
  if (!pin) return `El PIN de ${length} dígitos es requerido`
  if (!/^\d+$/.test(pin)) return 'Solo números permitidos'
  if (pin.length !== length) return `Debe tener ${length} dígitos`
  return null
}

export function validateOtp(otp, length = 6) {
  return validatePin(otp, length)
}

export function validateRequired(value, fieldName = 'Este campo') {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} es requerido`
  }
  if (typeof value === 'string' && !value.trim()) {
    return `${fieldName} es requerido`
  }
  return null
}

export function validateMinLength(value, min, fieldName = 'Este campo') {
  if (!value || value.length < min) {
    return `${fieldName} debe tener al menos ${min} caracteres`
  }
  return null
}

export function validateMaxLength(value, max, fieldName = 'Este campo') {
  if (value && value.length > max) {
    return `${fieldName} no puede exceder ${max} caracteres`
  }
  return null
}

export function validateNumber(value, fieldName = 'Este campo') {
  if (value === '' || value === null || value === undefined) return null
  if (isNaN(Number(value))) return `${fieldName} debe ser un número`
  return null
}

export function validateMin(value, min, fieldName = 'Este campo') {
  const num = Number(value)
  if (isNaN(num)) return null
  if (num < min) return `${fieldName} debe ser mayor o igual a ${min}`
  return null
}

export function validateMax(value, max, fieldName = 'Este campo') {
  const num = Number(value)
  if (isNaN(num)) return null
  if (num > max) return `${fieldName} debe ser menor o igual a ${max}`
  return null
}

export function validateUrl(url) {
  if (!url) return null
  try {
    new URL(url)
    return null
  } catch {
    return 'URL inválida'
  }
}

export function validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
  if (!file) return null
  if (!allowedTypes.includes(file.type)) {
    return `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`
  }
  return null
}

export function validateFileSize(file, maxSizeMB = 5) {
  if (!file) return null
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `El archivo excede ${maxSizeMB}MB`
  }
  return null
}