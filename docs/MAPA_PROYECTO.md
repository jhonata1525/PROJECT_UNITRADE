# 🗺️ Mapa del proyecto UniTrade

> Documento generado tras la limpieza de código muerto (2026-11-11).
> Repositorio Git: rama `develop`, último commit `1b6c93e`.

---

## 1. Tipo de proyecto

**No es un monorepo.** Son **dos aplicaciones npm independientes** dentro de la misma carpeta:

| Proyecto | Ruta | Stack | Puerto |
|---|---|---|---|
| Frontend | `PROJECT_UNITRADE/` | React 18 + Vite 8 + Tailwind 4 + React Router 7 | 5173 |
| Backend | `PROJECT_UNITRADE/backend/` | NestJS 12 + Prisma 7 + PostgreSQL | 8081 |

Cada uno tiene su propio `package.json`, `package-lock.json` y `node_modules`. No hay `workspaces` ni scripts raíz que orquesten ambos: se instalan y ejecutan por separado.

---

## 2. Estructura de carpetas

```
project_unitrade/
└── PROJECT_UNITRADE/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js              # proxy /api → localhost:8081
    ├── postcss.config.js
    ├── eslint.config.js
    ├── README.md
    ├── MAPA_PROYECTO.md            # este archivo
    │
    ├── src/                        # FRONTEND
    │   ├── main.jsx                # punto de entrada
    │   ├── index.css               # Tailwind v4 (@theme)
    │   ├── rutas/
    │   │   └── EnrutadorAplicacion.jsx
    │   ├── paginas/                # 11 pantallas
    │   │   ├── PaginaInicioSesion.jsx
    │   │   ├── PaginaRegistro.jsx
    │   │   ├── PaginaDashboard.jsx
    │   │   ├── PaginaCatalogo.jsx
    │   │   ├── PaginaBilletera.jsx
    │   │   ├── PaginaPagoReserva.jsx
    │   │   ├── PaginaMisArticulos.jsx
    │   │   ├── PaginaMisAlquileres.jsx
    │   │   ├── PaginaPerfil.jsx
    │   │   ├── PaginaVerificarCarnet.jsx
    │   │   └── PaginaEscanearCarnet.jsx
    │   ├── componentes/
    │   │   ├── auth/               # FormularioRegistro
    │   │   ├── articulos/          # ModalReservaHoras
    │   │   ├── billetera/          # TarjetasBalance, ModalRecargaSaldo,
    │   │   │                       # HistorialTransacciones, FormularioRetiroModal
    │   │   ├── carnet/             # ResultadoVerificacionCarnet
    │   │   ├── comunes/            # FormularioArticuloModal, IndicadorCarga,
    │   │   │                       # NavegacionLateral, PinInput, QRScanner
    │   │   ├── onboarding/         # OnboardingEstudiante (bienvenida + tour)
    │   │   ├── perfil/             # ModalEdicionPerfil
    │   │   └── reservas/           # FormularioCalificacion
    │   ├── contexto/
    │   │   └── ContextoAutenticacion.jsx   # usuario, login, registro, logout
    │   ├── servicios/              # capa de datos (Axios)
    │   │   ├── servicioClienteApi.js
    │   │   ├── servicioArticulos.js
    │   │   ├── servicioBilletera.js
    │   │   ├── servicioPagos.js
    │   │   ├── servicioReservas.js
    │   │   └── servicioCarnet.js
    │   └── utils/
    │       ├── constants.js
    │       ├── formatters.js
    │       ├── imagenes.js
    │       ├── perfil.js
    │       └── urlPublica.js
    │
    └── backend/                    # API
        ├── package.json
        ├── package-lock.json
        ├── prisma.config.ts        # Prisma 7: URL desde DATABASE_URL
        ├── .env                    # NO se sube a Git
        ├── .env.example
        ├── nest-cli.json
        ├── tsconfig.json
        ├── docs/
        │   └── HU-06-HU-10.md
        ├── prisma/
        │   ├── schema.prisma
        │   ├── seed.ts
        │   └── migrations/         # 8 migraciones
        └── src/
            ├── main.ts             # bootstrap, CORS, Swagger, ValidationPipe
            ├── app.modulo.ts       # módulo raíz
            ├── app.controlador.ts  # / y /salud
            ├── app.servicio.ts
            ├── auth/               # login, registro, perfil
            ├── articulos/          # CRUD + importación
            ├── reservas/           # reservas, entrega, devolución, mora
            ├── calificaciones/     # HU-09
            ├── pagos/              # HU-06 checkout e historial
            ├── billetera/          # HU-10 saldo, historial, retiros
            ├── pasarela/           # sandbox de cobros/payouts
            ├── carnet/             # carnet digital + verificación QR
            ├── comun/              # dinero, disponibilidad, decoradores
            ├── prisma/             # módulo y servicio Prisma
            └── generated/prisma/   # cliente generado (NO editar)
```

---

## 3. Frontend: rutas y flujo

### Rutas (`src/rutas/EnrutadorAplicacion.jsx`)

| Ruta | Página | Acceso |
|---|---|---|
| `/login` | `PaginaInicioSesion` | Pública |
| `/registro` | `PaginaRegistro` | Pública |
| `/verificar/:token` | `PaginaVerificarCarnet` | Pública |
| `/` | — | Redirige a `/login` |
| `/dashboard` | `PaginaDashboard` | Protegida |
| `/catalogo` | `PaginaCatalogo` | Protegida |
| `/billetera` | `PaginaBilletera` | Protegida |
| `/pago` | `PaginaPagoReserva` | Protegida |
| `/mis-articulos` | `PaginaMisArticulos` | Protegida |
| `/mis-alquileres` | `PaginaMisAlquileres` | Protegida |
| `/perfil` | `PaginaPerfil` | Protegida |
| `/escanear-carnet` | `PaginaEscanearCarnet` | Protegida |
| `*` | — | Redirige a `/login` |

`ProtectedRoute` consulta `useAuth()` y redirige si no hay sesión.

### Onboarding guiado

`componentes/onboarding/OnboardingEstudiante.jsx` se monta una sola vez dentro de
`ProveedorAutenticacion` (en `EnrutadorAplicacion.jsx`) y ofrece:

- **Bienvenida de 4 pasos** la primera vez que el estudiante inicia sesión.
- **Tour por el menú**: resalta cada sección usando `data-tour="<ruta>"` en
  `NavegacionLateral.jsx` (sidebar, drawer y barra inferior móvil).
- **Botón flotante “¿Cómo funciona?”** para repetir la guía en cualquier momento.
- **Evento `unitrade:abrir-onboarding`**: el Dashboard lo dispara desde
  “Próximos Pasos → Ver guía interactiva”.
- Se recuerda por usuario en `localStorage` con la clave
  `unitrade_onboarding_v1_<usuarioId>`.
- Atajos: `←` / `→` para navegar y `Esc` para cerrar.

### Flujo de datos

```
Componente/Página
   └── servicio*.js  (servicioClienteApi, Axios)
         └── baseURL = VITE_API_BASE_URL || "/api"
               └── Vite proxy → http://localhost:8081/api
                     └── NestJS → Prisma → PostgreSQL
```

- `servicioClienteApi` añade el header `x-usuario-id` desde la sesión guardada.
- La billetera conserva respaldo en `localStorage` para poder probar sin backend.

### Dependencias entre capas

| Página | Servicios / utilidades |
|---|---|
| Dashboard | `servicioBilletera`, `servicioArticulos`, `servicioClienteApi`, `formatters` |
| Catálogo | `servicioArticulos`, `utils/perfil` |
| Billetera | `servicioBilletera`, `ContextoAutenticacion` |
| Pago de reserva | `servicioPagos` |
| Mis artículos | `servicioArticulos`, `servicioReservas`, `utils/perfil`, `PinInput`, `QRScanner` |
| Mis alquileres | `servicioReservas`, `servicioPagos`, `formatters` |
| Perfil | `servicioCarnet`, `utils/perfil`, `utils/urlPublica` |
| Verificar / escanear carnet | `servicioCarnet` |

---

## 4. Backend: módulos y endpoints

Prefijo global: **`/api`**. Documentación interactiva: **`/api/docs`**.

### Autenticación (`app.modulo.ts` → `auth/`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login con correo y contraseña |
| POST | `/api/auth/register` | Registro (alias) |
| POST | `/api/auth/registro` | Registro con correo `@unisimon.edu.co` |
| GET | `/api/auth/perfil` | Perfil del usuario (`x-usuario-id`) |
| PATCH | `/api/auth/perfil` | Actualiza sede, punto de entrega y disponibilidad |

### Artículos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/articulos` | Catálogo de artículos activos |
| GET | `/api/articulos/mios` | Artículos del usuario |
| GET | `/api/articulos/tarifas-sugeridas` | Promedio de tarifa por hora por categoría |
| POST | `/api/articulos/importar` | Importa artículos desde `localStorage` |
| POST | `/api/articulos` | Publica un artículo |
| GET | `/api/articulos/:id/agenda` | Franjas del dueño y horarios ya ocupados |
| GET | `/api/articulos/:id` | Detalle |
| PATCH | `/api/articulos/:id` | Actualiza artículo propio |
| DELETE | `/api/articulos/:id` | Elimina o pausa |

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reservas` | Reservas del usuario con desglose |
| GET | `/api/reservas/:id` | Detalle de reserva y pago |
| POST | `/api/reservas/articulos/:articuloId/entrega` | Certifica entrega con QR/PIN |
| POST | `/api/reservas/articulos/:articuloId/devolucion` | Valida devolución y liquida mora |
| POST | `/api/reservas/:id/pagar-mora` | Paga mora por checkout |

### Pagos (HU-06)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/payments/checkout` | Procesa pago y comisión (12%) |
| GET | `/api/payments/status/:transactionId` | Estado de transacción |
| GET | `/api/payments/history` | Historial de pagos |

### Billetera (HU-10)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/wallet/balance` | Saldo disponible/pendiente |
| GET | `/api/wallet/historial` | Transacciones |
| POST | `/api/wallet/deposit` | Recarga |
| POST | `/api/wallet/withdraw` | Solicita retiro |
| GET | `/api/wallet/withdrawals` | Solicitudes de retiro |
| GET | `/api/wallet/entidades` | Métodos de retiro |

### Calificaciones y carnet

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/calificaciones/:alquilerId` | Califica un alquiler |
| GET | `/api/carnet/mio` | Emite/obtiene carnet del usuario |
| GET | `/api/carnet/verificar/:token` | Verificación pública por QR (30 req/min) |

### Salud

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api` | Información del servicio |
| GET | `/api/salud` | Health check |

> Mientras no exista guard JWT, la identidad viaja en el header `x-usuario-id`.

---

## 5. Base de datos (Prisma)

- Proveedor: **PostgreSQL**.
- URL: `DATABASE_URL` en `backend/.env` (leída por `prisma.config.ts`).
- Cliente generado en `backend/src/generated/prisma` (no editar a mano).

### Modelos

| Modelo | Uso |
|---|---|
| `Usuario` | Cuenta, verificación, sede, carnet |
| `Articulo` | Publicaciones de alquiler |
| `Alquiler` | Reservas y estados |
| `Calificacion` | HU-09 |
| `Pago` | Checkout y estados |
| `Billetera` | Saldos por usuario |
| `TransaccionBilletera` | Movimientos |
| `Retiro` | Solicitudes de payout |
| `CodigoOtp` | Verificación por teléfono |
| `TokenRefresco` | Refresh tokens |

### Migraciones (8)

```
20261020213506_inicial
20261021180000_pagos_billetera_hu06_hu10
20261022010000_articulos_clave_externa
20261023220000_mora_y_validacion_fisica
20261024190000_registro_y_verificacion_dual
20261025120000_pago_desde_billetera
20261025190000_hu09_calificaciones
20261026120000_carnet_digital_qr
```

---

## 6. Variables de entorno

### Backend (`backend/.env`)

| Variable | Ejemplo / valor | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Conexión PostgreSQL (obligatoria) |
| `PORT` | `8081` | Puerto de la API |
| `NODE_ENV` | `development` | Entorno |
| `FRONTEND_URL` | `http://localhost:5173` | CORS y QR del carnet |
| `JWT_SECRET` | cadena larga | Firma JWT (pendiente de usar) |
| `JWT_EXPIRES_IN` | `7d` | Expiración JWT |
| `SANDBOX_TASA_EXITO` | `1` | Éxito de pasarela sandbox |
| `SANDBOX_DEMORA_MS` | `0` | Retardo simulado |

### Frontend

| Variable | Por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base de la API |
| `VITE_PUBLIC_APP_URL` | IP local detectada | URL pública para QR |

---

## 7. Comandos

### Frontend

```powershell
cd C:\Users\Javier\Documents\project_unitrade\PROJECT_UNITRADE
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
npm run build
npm run lint
```

### Backend

```powershell
cd C:\Users\Javier\Documents\project_unitrade\PROJECT_UNITRADE\backend
npm install
npm run prisma:generate
npm run prisma:deploy     # requiere DATABASE_URL real
npm run prisma:seed       # opcional: SEED_DEMO=true
npm run start:dev         # http://localhost:8081/api
```

---

## 8. Limpieza realizada

Se eliminaron **17 archivos sin uso** (verificados con análisis de alcanzabilidad desde `main.jsx`) y **4 carpetas vacías**:

| Archivo eliminado | Motivo |
|---|---|
| `src/App.jsx` | `main.jsx` renderiza el enrutador directamente |
| `src/hooks/useApi.js` | Nunca importado |
| `src/hooks/useAuth.js` | Duplicado; se usa el de `contexto/` |
| `src/services/api.js` | Solo lo usaba `useApi` |
| `src/types/index.d.ts` | Sin referencias |
| `src/utils/validators.js` | Sin referencias |
| `src/contexto/ContextoBilletera.jsx` | Sin referencias |
| `src/servicios/servicioPasarelaPago.js` | Envoltorio sin consumidores |
| `src/componentes/auth/LoginForm.jsx` | Sin referencias |
| `src/componentes/auth/RegisterForm.jsx` | Sin referencias |
| `src/componentes/comunes/AlertaToast.jsx` | Sin referencias |
| `src/componentes/comunes/EfectoOnda.jsx` | Solo lo usaba `App.jsx` |
| `src/componentes/comunes/Encabezado.jsx` | Sin referencias |
| `src/componentes/comunes/ModalGenerico.jsx` | Sin referencias |
| `src/componentes/comunes/TarjetaIndicador.jsx` | Solo lo usaba `ResumenDesgloseComision` |
| `src/componentes/pasarela/ModalConfirmacionPago.jsx` | Sin referencias |
| `src/componentes/pasarela/ResumenDesgloseComision.jsx` | Sin referencias |

También se eliminaron las carpetas vacías `src/hooks/`, `src/services/`, `src/types/`, `src/componentes/pasarela/` y `develop/` (esta última fuera del repo y vacía). El backend no tenía código muerto.

**Cómo recuperar un archivo eliminado** (siguen en Git):

```powershell
git checkout HEAD -- src/App.jsx
# o todos:
git checkout HEAD -- src/
```

---

## 9. Estado actual

| Elemento | Estado |
|---|---|
| Node.js / npm | ✅ instalados (v26.13.1 / 11.20.0) |
| Dependencias frontend | ✅ 299 paquetes |
| Dependencias backend | ✅ 416 paquetes |
| Cliente Prisma | ✅ generado en `src/generated/prisma` |
| Frontend dev | ✅ http://localhost:5173 |
| Backend dev | ✅ http://localhost:8081/api (Swagger en `/api/docs`) |
| Base de datos | ✅ conectada a Neon; 8/8 migraciones aplicadas |
| Build frontend | ✅ compila (2012 módulos) |
| Archivos sin uso | ✅ eliminados |
