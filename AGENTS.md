# AGENTS.md - Reglas de Desarrollo UniTrade

## Arquitectura Limpia (Clean Architecture)

### Estructura de Directorios Obligatoria
```
src/
├── components/     # Componentes UI reutilizables (Presentacionales)
│   ├── auth/       # Autenticación (WhatsAppOtpModal, etc.)
│   ├── catalog/    # Catálogo (PublishItemForm, ItemCard, etc.)
│   ├── checkout/   # Checkout (CheckoutModal, etc.)
│   ├── layout/     # Layout (Header, Footer, Sidebar)
│   ├── rentals/    # Alquileres (TimeBookingCalculator, RentalCard)
│   ├── verification/ # Verificación (RentalVerifier)
│   └── wallet/     # Billetera (WalletView, WithdrawForm)
├── context/        # React Context (AuthContext, etc.)
├── hooks/          # Custom Hooks (useAuth, useApi, etc.)
├── pages/          # Vistas/Páginas (Dashboard, Login, Register, etc.)
├── routes/         # Configuración de rutas (AppRouter)
├── services/       # Servicios API (api.js, endpoints/)
├── utils/          # Utilidades (formatters, validators, constants)
└── types/          # TypeScript types / JSDoc types
```

### Principios SOLID y DRY
- **Single Responsibility**: Cada componente/archivo tiene una sola responsabilidad
- **Open/Closed**: Abierto para extensión, cerrado para modificación
- **Liskov Substitution**: Componentes intercambiables por sus contratos
- **Interface Segregation**: Props específicas, no objetos gigantes
- **Dependency Inversion**: Dependencias hacia abstracciones (hooks, context)
- **DRY**: Extraer lógica común a hooks/utils; componentes compuestos

## Convenciones de Código

### Componentes
- **Funcionales** con hooks (useState, useEffect, useCallback, useMemo)
- **Naming**: PascalCase para componentes, camelCase para hooks/utils
- **Props**: Destructuring en la firma, JSDoc para tipos complejos
- **Tamaño**: Máximo 150 líneas; dividir si supera

### Estilos (Tailwind CSS - Mobile First)
- **Breakpoints**: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- **Utility-first**: Clases utilitarias sobre CSS custom
- **Componentes base**: Definidos en `@layer components` (index.css)
- **Dark mode**: Soporte via `class` strategy

### Manejo de Estado
- **Server State**: React Query / SWR (preferido) o useEffect + useState
- **Client State**: useState/useReducer para UI local
- **Global State**: React Context (Auth, Theme, Notifications)
- **Formularios**: React Hook Form + Zod (validación)

### Peticiones Asíncronas - Estados Obligatorios
```jsx
const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// En useEffect / handlers:
setState('loading');
setError(null);
try {
  const res = await api.post('/endpoint', payload);
  setData(res.data);
  setState('success');
} catch (err) {
  setError(err.response?.data?.message || err.message);
  setState('error');
}
```

### Manejo de Errores
- **API Errors**: Interceptor en `api.js` para 401/403/500
- **UI Errors**: Toast/Alert accesible (role="alert")
- **Validation Errors**: Inline bajo cada campo
- **Boundary**: ErrorBoundary en App.jsx

## Rutas y Navegación

### Patrones de Rutas
- **Públicas**: `/login`, `/register` (redirigen a `/` si autenticado)
- **Protegidas**: `/`, `/catalogo`, `/billetera`, `/scanner`, `/perfil`
- **Anidadas**: Usar `<Outlet />` en layout padre

### Lazy Loading
```jsx
const Dashboard = lazy(() => import('../pages/Dashboard'));
// En Routes: <Suspense fallback={<Loader />}> <Routes>...</Routes> </Suspense>
```

## Autenticación y Seguridad
- **JWT**: Access token en memoria (Context), Refresh token en httpOnly cookie
- **Interceptores**: Adjuntan `Authorization: Bearer <token>` automáticamente
- **Logout**: Limpia storage + redirect a `/login`
- **Dominio**: Validar `@unisimon.edu.co` en Register (HU-01)

## Accesibilidad (a11y)
- **Semántica**: HTML5 landmarks (header, main, nav, footer, section)
- **ARIA**: labels, roles, live regions para estados dinámicos
- **Focus**: Visible outline, focus trapping en modales
- **Contraste**: Mínimo WCAG AA (4.5:1 texto normal)
- **Teclado**: Navegación completa sin mouse

## Testing (Definition of Done)
- **Unit**: Vitest + React Testing Library (hooks, utils, components)
- **Integration**: Páginas completas con MSW (mock service worker)
- **E2E**: Playwright (flujos críticos: login, checkout, verify)
- **Coverage**: Mínimo 80% en lógica de negocio

## Git y Commits
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`
- **Branch**: `feature/HU-XX-descripcion`, `fix/HU-XX-descripcion`
- **PR**: Template con checklist DoD, screenshots mobile/desktop

## Variables de Entorno
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=UniTrade
VITE_WHATSAPP_API_URL=https://api.whatsapp.com
```

## Scripts Disponibles
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext js,jsx",
  "format": "prettier --write src/",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "e2e": "playwright test"
}
```

## Checklist Pre-Commit
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run format` aplicado
- [ ] `npm run test` pasa
- [ ] Build exitoso (`npm run build`)
- [ ] Probado en móvil (Chrome DevTools device toolbar)
- [ ] Accesibilidad: focus visible, contrast, aria-labels
- [ ] Estados loading/error/success en todas las llamadas API