/**
 * Type definitions for UniTrade Frontend
 * Used for JSDoc annotations and IDE support
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_WHATSAPP_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Usuario autenticado */
interface User {
  id: number
  name: string
  email: string
  phone?: string
  university?: string
  career?: string
  avatar?: string
  verified: boolean
  rating?: number
  reviewsCount?: number
  createdAt: string
}

/** Artículo del catálogo */
interface Item {
  id: number
  title: string
  description: string
  category: string
  condition: 'new' | 'like_new' | 'good' | 'fair'
  hourlyRate: number
  suggestedRate?: number
  location: string
  images: string[]
  owner: User
  availableFrom: string
  availableTo: string
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
}

/** Alquiler/reserva */
interface Rental {
  id: number
  item: Item
  renter: User
  owner: User
  startDateTime: string
  endDateTime: string
  hours: number
  subtotal: number
  commission: number
  total: number
  status: RentalStatus
  verificationCode?: string
  qrCode?: string
  createdAt: string
  updatedAt: string
}

type RentalStatus =
  | 'pending_pickup'
  | 'active'
  | 'pending_return'
  | 'completed'
  | 'cancelled'
  | 'overdue'

/** Pago */
interface Payment {
  id: number
  rentalId: number
  amount: number
  status: PaymentStatus
  method: 'sandbox' | 'stripe' | 'mercadopago'
  transactionId?: string
  paidAt?: string
  createdAt: string
}

type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'

/** Billetera */
interface Wallet {
  balance: number
  pendingBalance: number
  currency: string
}

/** Transacción de billetera */
interface WalletTransaction {
  id: number
  type: 'deposit' | 'withdrawal' | 'commission' | 'refund'
  amount: number
  balanceAfter: number
  description: string
  status: 'pending' | 'completed' | 'failed'
  metadata?: Record<string, unknown>
  createdAt: string
}

/** Solicitud de retiro */
interface WithdrawRequest {
  method: 'nequi' | 'daviplata' | 'banco'
  account: string
  amount: number
}

/** Respuesta de API genérica */
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

/** Paginación */
interface PaginatedResponse<T> {
  data: T[]
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

/** Filtros de catálogo */
interface CatalogFilters {
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  location?: string
  condition?: string
  availableNow?: boolean
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating'
  page?: number
  perPage?: number
}

/** Props para componentes de formulario */
interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  id?: string
  name: string
}

/** Estados de carga asíncrona */
type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

/** Hook de autenticación */
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: { email: string; password: string }) => Promise<User>
  register: (userData: RegisterData) => Promise<User>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone: string
  university?: string
  career?: string
}

/** Datos de reserva para checkout */
interface BookingData {
  startDateTime: string
  endDateTime: string
  hours: number
  subtotal: number
  commission: number
  total: number
}

/** Configuración de notificaciones */
interface NotificationPreferences {
  newRentals: boolean
  returnReminders: boolean
  promotions: boolean
  appUpdates: boolean
}