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

### Variables de entorno

La app usa `VITE_API_BASE_URL` (por defecto `/api`, que Vite redirige a `http://localhost:8081` con el proxy de `vite.config.js`). Así funciona también desde el celular en la red local (`http://IP-DEL-PC:5173`). Si no defines un backend, **la billetera funciona igual** con datos mock en `localStorage`.

En desarrollo, Vite detecta la IP local de tu PC y la usa en el QR del carnet, para que el enlace funcione al escanearlo desde el celular. Si necesitas forzar otra URL (por ejemplo un dominio de producción), define `VITE_PUBLIC_APP_URL`.

> La cámara del navegador solo está disponible en HTTPS o en `localhost`. Si abres UniTrade desde el celular por la IP local (`http://192.168.x.x:5173`), usa **Tomar o subir foto del QR** en la página de verificación, o pega el enlace del carnet.

---

## 🛠️ Stack

- **React 18** + **Vite**
- **Tailwind CSS v4** (configuración "CSS-first" en `src/index.css` con `@theme`)
- **React Router** (navegación)
- **Axios** (peticiones HTTP)

---

## ✨ Experiencia para estudiantes nuevos

Al iniciar sesión por primera vez, UniTrade muestra una **bienvenida de 4 pasos** y
un **tour guiado** por el menú (Explorar, Dashboard, Artículos, Alquileres,
Billetera, Pagos, Verificar y Perfil).

- Botón flotante **“¿Cómo funciona?”** para repetir la guía cuando quieras.
- En el Dashboard: **Próximos Pasos → Ver guía interactiva**.
- Solo se muestra una vez por usuario; se guarda en `localStorage`.

Archivo principal: `src/componentes/onboarding/OnboardingEstudiante.jsx`.

---

## 🔄 Flujo de la aplicación

```
index.html            → punto de entrada (contiene el <div id="root">)
src/main.jsx          → arranca React y carga el enrutador + index.css
src/rutas/            → define las rutas y quién puede entrar (pública / protegida)
src/paginas/          → cada pantalla
src/componentes/      → piezas reutilizables que usan las páginas
contexto/ servicios/ utils/  → lógica de apoyo (estado, datos, utilidades)
```

---

## 📁 Estructura de `src/`

| Carpeta | Responsabilidad |
|---|---|
| `rutas/` | **Navegación.** `EnrutadorAplicacion.jsx` define las rutas (`/login`, `/verificar/:token`, `/escanear-carnet`, `/dashboard`, `/billetera`, `/pago`, `/perfil`, `/mis-articulos`) y `ProtectedRoute`, que manda al login si no hay sesión. |
| `paginas/` | **Pantallas completas** (una por ruta): Dashboard, Billetera, InicioSesion, Registro, MisArticulos, PagoReserva, Perfil, VerificarCarnet, EscanearCarnet. |
| `componentes/` | **UI reutilizable**, dividida por dominio (ver abajo). |
| `contexto/` | **Estado global con React Context.** `ContextoAutenticacion` (usuario, login/logout, `useAuth`). |
| `servicios/` | **Capa de datos.** `servicioClienteApi` (Axios + interceptores), `servicioArticulos`, `servicioBilletera`, `servicioPagos`, `servicioReservas`, `servicioCarnet`. |
| `utils/` | **Funciones de apoyo puras:** `constants.js`, `formatters.js` (fechas/moneda), `imagenes.js`, `perfil.js`, `urlPublica.js`. |

### Subcarpetas de `componentes/`

| Subcarpeta | Qué contiene |
|---|---|
| `auth/` | `FormularioRegistro` y flujo de verificación. |
| `articulos/` | `ModalReservaHoras` — reservar un artículo por horas, con QR y PIN. |
| `billetera/` | UI de la billetera: balance, historial de transacciones, modal de retiro y de recarga. |
| `carnet/` | `ResultadoVerificacionCarnet`. |
| `perfil/` | `ModalEdicionPerfil`. |
| `reservas/` | `FormularioCalificacion`. |
| `comunes/` | Piezas genéricas: `NavegacionLateral`, `IndicadorCarga`, `PinInput`, `QRScanner`, `FormularioArticuloModal`. |

### Archivos sueltos en `src/`

- `main.jsx` → arranca la app.
- `index.css` → estilos globales y **tema** de Tailwind (`@theme`: colores, fuente Inter).

> La billetera usa la API real y conserva respaldo local para poder probarse sin backend.
> El mapa completo de carpetas, rutas y endpoints está en [`MAPA_PROYECTO.md`](MAPA_PROYECTO.md).

---

## 👥 Equipo

Proyecto académico — Universidad Simón Bolívar (UniTrade).
