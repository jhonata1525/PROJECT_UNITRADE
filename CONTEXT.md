# CONTEXTO DEL PROYECTO: UniTrade

## Información General
- **Proyecto**: UniTrade (Aplicación Web Responsive para Alquiler de Artículos Universitarios)
- **Institución**: Universidad Simón Bolívar
- **Integrantes Frontend**: Jhonatan Acevedo y Tomas Mateo Monsalve
- **Dominio institucional permitido**: @unisimon.edu.co
- **Backend API**: `http://localhost:8080/api` (variable `VITE_API_BASE_URL`)

## Estado Actual del Desarrollo

### Sprint 1 (Completado)
- **HU-06**: Pasarela de pagos y comisión → `src/components/checkout/CheckoutModal.jsx`
- **HU-10**: Billetera virtual y retiros → `src/components/wallet/WalletView.jsx`

### Sprint 2 (Completado)
- **HU-07**: Validación dual QR con html5-qrcode y PIN manual de 4 dígitos → `src/components/verification/RentalVerifier.jsx`
- **HU-08**: Motor de mora (backend)

### Sprint 3 (En Proceso)
- **HU-05**: Reserva por horas → `src/components/rentals/TimeBookingCalculator.jsx`
- **HU-04**: Tarifa sugerida por categoría → `src/components/catalog/PublishItemForm.jsx`
- **HU-02**: WhatsApp OTP → `src/components/auth/WhatsAppOtpModal.jsx`

## Stack y Tecnologías Frontend
- **Framework**: React 18 + Vite 5
- **Estilos**: Tailwind CSS 3 (Mobile-First)
- **Routing**: React Router DOM 6
- **HTTP Client**: Axios con interceptores JWT
- **QR Scanner**: html5-qrcode
- **Iconos**: Lucide React
- **Fuente**: Inter (Google Fonts)
- **Lint/Format**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library + Playwright

## Arquitectura y Estructura

```
src/
├── components/
│   ├── auth/           # WhatsAppOtpModal.jsx
│   ├── catalog/        # PublishItemForm.jsx, ItemCard.jsx
│   ├── checkout/       # CheckoutModal.jsx
│   ├── layout/         # Header.jsx, Footer.jsx
│   ├── rentals/        # TimeBookingCalculator.jsx, RentalCard.jsx
│   ├── verification/   # RentalVerifier.jsx
│   └── wallet/         # WalletView.jsx, WithdrawForm.jsx
├── context/
│   └── AuthContext.jsx # AuthProvider, useAuth hook
├── hooks/
│   └── useAuth.js      # (exportado desde AuthContext)
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Catalogo.jsx
│   ├── Billetera.jsx   # Wrapper para WalletView
│   ├── Scanner.jsx     # Wrapper para RentalVerifier
│   ├── Perfil.jsx
│   └── Wallet.jsx      # Alias para Billetera
├── routes/
│   └── AppRouter.jsx   # ProtectedRoute, PublicRoute, Routes
├── services/
│   └── api.js          # Axios instance + interceptors
├── utils/
│   ├── formatters.js   # formatCurrency, formatDate, etc.
│   ├── validators.js   # validateEmail, validatePin, etc.
│   └── constants.js    # CATEGORIES, WITHDRAW_METHODS, etc.
└── types/
    └── index.d.ts      # JSDoc / TypeScript types
```

## Matriz de Rutas Frontend

| Ruta | Componente | Protección | Descripción |
|------|-----------|------------|-------------|
| `/login` | Login.jsx | Pública | Formulario acceso + WhatsApp OTP |
| `/register` | Register.jsx | Pública | Registro @unisimon.edu.co |
| `/` | Dashboard.jsx | Protegida | Home, stats, actividad, accesos rápidos |
| `/catalogo` | Catalogo.jsx | Protegida | Listado, filtros, búsqueda, cards |
| `/catalogo/:id` | ItemDetail.jsx | Protegida | Detalle + TimeBookingCalculator |
| `/billetera` | Billetera.jsx | Protegida | Saldo, retiros (Nequi/Daviplata/Banco) |
| `/scanner` | Scanner.jsx | Protegida | Lista alquileres + RentalVerifier modal |
| `/perfil` | Perfil.jsx | Protegida | Tabs: Perfil, Seguridad, Configuración |

## Componentes Clave por Historia de Usuario

### HU-02: WhatsApp OTP
- **Archivo**: `src/components/auth/WhatsAppOtpModal.jsx`
- **Flujo**: Input teléfono → Envía código 6 dígitos → Modal con timer 5 min → Verifica → Login/Register

### HU-04: Tarifa Sugerida
- **Archivo**: `src/components/catalog/PublishItemForm.jsx`
- **Feature**: Select categoría → Fetch `/api/items/suggested-rate?category=X` → Badge "Tarifa promedio: $X/hr"

### HU-05: Reserva por Horas
- **Archivo**: `src/components/rentals/TimeBookingCalculator.jsx`
- **Feature**: Date picker + time range → Cálculo horas × tarifa → Preview comisión + total

### HU-06: Checkout
- **Archivo**: `src/components/checkout/CheckoutModal.jsx`
- **Feature**: Desglose base + 10% comisión → Botón "Pagar en Pasarela (Sandbox)" → POST `/api/payments/checkout`

### HU-07: Validación Dual
- **Archivo**: `src/components/verification/RentalVerifier.jsx`
- **Tabs**: QR Camera (html5-qrcode) / PIN Manual (4 inputs)
- **API**: POST `/api/rentals/verify-code` { rentalId, code, type: 'qr'|'pin' }

### HU-10: Billetera
- **Archivo**: `src/components/wallet/WalletView.jsx`
- **Feature**: Saldo destacado → Form retiro (método, cuenta, monto) → Validación ≤ saldo → POST `/api/wallet/withdraw`

## Criterios de Calidad (Definition of Done)
- [ ] Código limpio, modular en `src/components/`, `src/pages/`, `src/services/`
- [ ] Responsivo (probado en móviles 375px+ y escritorio 1440px)
- [ ] Manejo explícito de estados: Loading, Error, Success en **todas** las peticiones
- [ ] Accesibilidad: focus visible, aria-labels, semantic HTML, contraste WCAG AA
- [ ] Mobile-First: breakpoints `sm:`, `md:`, `lg:`, `xl:` en Tailwind
- [ ] Sin warnings en consola (React, Vite, ESLint)
- [ ] Build de producción exitoso (`npm run build`)

## Variables de Entorno Requeridas
```env
# .env.local (no commitear)
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=UniTrade
```

## Comandos de Desarrollo
```bash
npm install          # Instalar dependencias
npm run dev          # Servidor desarrollo (puerto 5173)
npm run build        # Build producción
npm run preview      # Preview build
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest
```