# UniTrade

Plataforma de **alquiler universitario**: los estudiantes publican artículos, los alquilan por horas y pagan a través de una billetera virtual.

---

## 🚀 Cómo levantar el proyecto

Requisitos: **Node.js 18+** y npm.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

### Scripts disponibles

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Compila para producción (genera `dist/`) |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Revisa el código con ESLint |
| `npm run format` | Formatea con Prettier |
| `npm test` | Ejecuta tests (Vitest) |
| `npm run test:ui` | Tests con interfaz visual |
| `npm run e2e` | Tests end-to-end (Playwright) |

### Variables de entorno

La app usa `VITE_API_BASE_URL` (por defecto `http://localhost:8081/api`). Si no defines un backend, **la billetera funciona igual** con datos mock en `localStorage`.

---

## 🛠️ Stack

- **React 18** + **Vite**
- **Tailwind CSS v4** (configuración "CSS-first" en `src/index.css` con `@theme`)
- **React Router** (navegación)
- **Axios** (peticiones HTTP)
- **Vitest** + **React Testing Library** (tests) y **Playwright** (E2E)

---

## 🔄 Flujo de la aplicación

```
index.html            → punto de entrada (contiene el <div id="root">)
src/main.jsx          → arranca React y carga el enrutador + index.css
src/rutas/            → define las rutas y quién puede entrar (pública / protegida)
src/paginas/          → cada pantalla
src/componentes/      → piezas reutilizables que usan las páginas
contexto/ hooks/ servicios/ utils/  → lógica de apoyo (estado, datos, utilidades)
```

---

## 📁 Estructura de `src/`

| Carpeta | Responsabilidad |
|---|---|
| `rutas/` | **Navegación.** `EnrutadorAplicacion.jsx` define las rutas (`/login`, `/dashboard`, `/billetera`, `/pago`, `/perfil`, `/mis-articulos`) y `ProtectedRoute`, que manda al login si no hay sesión. |
| `paginas/` | **Pantallas completas** (una por ruta): Dashboard, Billetera, InicioSesion, Registro, MisArticulos, PagoReserva, Perfil. |
| `componentes/` | **UI reutilizable**, dividida por dominio (ver abajo). |
| `contexto/` | **Estado global con React Context.** `ContextoAutenticacion` (usuario, login/logout, `useAuth`) y `ContextoBilletera` (saldo, historial). |
| `hooks/` | **Lógica reutilizable.** `useApi.js` = hook genérico para peticiones HTTP (loading/error/data). |
| `servicios/` | **Capa de datos (español).** `servicioBilletera` (mock en localStorage), `servicioArticulos` (artículos del backend), `servicioClienteApi` (Axios + interceptores JWT), `servicioPasarelaPago` (pagos). |
| `services/` | **Capa de datos (inglés, más vieja).** Solo `api.js`: instancia de Axios con manejo de token y refresh en 401. |
| `utils/` | **Funciones de apoyo puras:** `constants.js`, `formatters.js` (fechas/moneda), `validators.js`. |
| `types/` | **Tipos / documentación** (`index.d.ts`). |
| `test/` | **Pruebas.** `setup.js` (configura `jest-dom`) y `setup.test.jsx` (test de ejemplo). |

### Subcarpetas de `componentes/`

| Subcarpeta | Qué contiene |
|---|---|
| `auth/` | Login, registro y verificación por WhatsApp (OTP con PIN). |
| `articulos/` | `ModalReservaHoras` — reservar un artículo por horas, con QR y PIN. |
| `billetera/` | UI de la billetera: balance, historial de transacciones, modal de retiro y de recarga. |
| `pasarela/` | Pago: `ModalConfirmacionPago` y `ResumenDesgloseComision`. |
| `comunes/` | Piezas genéricas: `Encabezado`, `NavegacionLateral`, `ModalGenerico`, `AlertaToast`, `IndicadorCarga`, `EfectoOnda`, `PinInput`, `QRScanner`, `TarjetaIndicador`, `FormularioArticuloModal`. |

### Archivos sueltos en `src/`

- `main.jsx` → arranca la app.
- `App.jsx` → componente raíz (fondo animado + efecto ripple).
- `index.css` → estilos globales y **tema** de Tailwind (`@theme`: colores, fuente Inter).

---

## ⚠️ Archivos que hoy no se usan

Candidatos a limpiar o completar (no están importados en ningún lado):

| Archivo | Situación |
|---|---|
| `componentes/auth/LoginForm.jsx`, `RegisterForm.jsx` | Nadie los importa; las páginas tienen su propio formulario. |
| `hooks/useAuth.js` | Duplicado; el real viene de `contexto/ContextoAutenticacion`. |
| `servicios/servicioPasarelaPago.js` | No lo importa nadie todavía. |
| `utils/` (constants, formatters, validators) | Aún no se importan. |
| `types/index.d.ts` | No referenciado (no hay tsconfig). |
| `App.jsx` | `main.jsx` hoy renderiza directamente el enrutador, no `App`. |

**Nota:** la billetera funciona con **datos mock en `localStorage`**, por lo que se puede probar sin backend.

---

## 👥 Equipo

Proyecto académico — Universidad Simón Bolívar (UniTrade).
