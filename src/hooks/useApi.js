import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

/**
 * Hook genérico para peticiones GET
 * @param {string} url - Endpoint de la API
 * @param {Object} options - Opciones de configuración
 * @returns {Object} { data, loading, error, refetch }
 */
export function useApi(url, options = {}) {
  const { immediate = true, params, deps = [] } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(url, { params })
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [url, params])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [immediate, fetchData, ...deps])

  return { data, loading, error, refetch: fetchData }
}

/**
 * Hook para mutaciones (POST, PUT, DELETE)
 * @returns {Object} { mutate, loading, error, status }
 */
export function useMutation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle')

  const mutate = useCallback(async (method, url, payload, config = {}) => {
    setLoading(true)
    setError(null)
    setStatus('loading')
    try {
      const response = await api[method](url, payload, config)
      setStatus('success')
      return response.data
    } catch (err) {
      const message = err.response?.data?.message || err.message
      setError(message)
      setStatus('error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading, error, status }
}

/**
 * Hook para formularios con validación
 * @param {Object} initialValues - Valores iniciales
 * @param {Function} validate - Función de validación
 * @returns {Object} { values, errors, handleChange, handleSubmit, setValues, reset }
 */
export function useForm(initialValues = {}, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    if (validate) {
      const validationErrors = validate(values)
      if (validationErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: validationErrors[name] }))
      }
    }
  }

  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault()
    if (validate) {
      const validationErrors = validate(values)
      setErrors(validationErrors)
      if (Object.keys(validationErrors).length > 0) return
    }
    await onSubmit(values)
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, setValues, reset }
}

/**
 * Hook para debounce
 * @param {any} value - Valor a debounce
 * @param {number} delay - Delay en ms
 * @returns {any} Valor con debounce
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para localStorage
 * @param {string} key - Clave
 * @param {any} initialValue - Valor inicial
 * @returns [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Error guardando en localStorage:', error)
    }
  }

  return [storedValue, setValue]
}