export const CATEGORIES = [
  'Tecnología',
  'Deportes',
  'Fotografía',
  'Herramientas',
  'Juegos',
  'Instrumentos',
  'Electrodomésticos',
  'Otros',
]

export const CONDITIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'like_new', label: 'Como nuevo' },
  { value: 'good', label: 'Bueno' },
  { value: 'fair', label: 'Regular' },
]

export const CONDITION_LABELS = {
  new: 'Nuevo',
  like_new: 'Como nuevo',
  good: 'Bueno',
  fair: 'Regular',
}

export const CONDITION_COLORS = {
  new: 'bg-green-100 text-green-700',
  like_new: 'bg-blue-100 text-blue-700',
  good: 'bg-yellow-100 text-yellow-700',
  fair: 'bg-orange-100 text-orange-700',
}

export const WITHDRAW_METHODS = [
  { id: 'nequi', label: 'Nequi', icon: '📱', placeholder: '300XXXXXXX' },
  { id: 'daviplata', label: 'Daviplata', icon: '📲', placeholder: '300XXXXXXX' },
  { id: 'banco', label: 'Cuenta Bancaria', icon: '🏦', placeholder: 'Número de cuenta' },
]

export const RENTAL_STATUS = {
  pending_pickup: { label: 'Pendiente de entrega', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'En curso', color: 'bg-green-100 text-green-700' },
  pending_return: { label: 'Pendiente de devolución', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completado', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  overdue: { label: 'En mora', color: 'bg-red-100 text-red-700' },
}

export const PAYMENT_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-700' },
}

export const PLATFORM_COMMISSION = 0.10
export const MIN_HOURLY_RATE = 1000
export const MAX_HOURLY_RATE = 100000
export const MIN_WITHDRAWAL = 1000
export const MAX_IMAGES_PER_ITEM = 5
export const MAX_IMAGE_SIZE_MB = 5
export const OTP_LENGTH = 6
export const PIN_LENGTH = 4
export const OTP_EXPIRY_MINUTES = 5

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    verifyResetCode: '/auth/verify-reset-code',
    resetPassword: '/auth/reset-password',
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
  },
  items: {
    list: '/items',
    create: '/items',
    detail: (id) => `/items/${id}`,
    update: (id) => `/items/${id}`,
    delete: (id) => `/items/${id}`,
    suggestedRate: '/items/suggested-rate',
    myItems: '/items/my-items',
  },
  rentals: {
    list: '/rentals',
    create: '/rentals',
    detail: (id) => `/rentals/${id}`,
    verifyCode: '/rentals/verify-code',
    myRentals: '/rentals/my-rentals',
    asOwner: '/rentals/as-owner',
  },
  payments: {
    checkout: '/payments/checkout',
    webhook: '/payments/webhook',
    history: '/payments/history',
  },
  wallet: {
    balance: '/wallet/balance',
    withdraw: '/wallet/withdraw',
    transactions: '/wallet/transactions',
  },
  users: {
    profile: '/users/profile',
    update: '/users/profile',
    changePassword: '/users/change-password',
    notifications: '/users/notifications',
  },
}

export const STORAGE_KEYS = {
  authToken: 'authToken',
  user: 'user',
  theme: 'theme',
  recentSearches: 'recentSearches',
}