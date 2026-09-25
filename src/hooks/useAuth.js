import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Hook para acceder al contexto de autenticación
 * @returns {AuthContextType} Contexto de autenticación
 * @throws {Error} Si se usa fuera de AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}