# UniTrade — Backend

API REST de UniTrade construida con **NestJS**, **Prisma 7** y **PostgreSQL** (Neon).

## Requisitos

- Node.js 20+
- npm
- Una base de datos PostgreSQL (Neon o Supabase)

## Levantar el proyecto

```bash
cd backend
npm install
```

Copia el archivo de ejemplo y configura las variables:

```bash
copy .env.example .env
```

Edita `.env` con tu cadena de conexión de Neon:

```env
DATABASE_URL="postgresql://usuario:password@ep-xxx.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
PORT=8081
FRONTEND_URL=http://localhost:5173
```

> Usa la conexión **directa** (sin `-pooler`) para las migraciones.
> Nunca subas el archivo `.env` al repositorio.

Genera el cliente de Prisma y aplica las migraciones:

```bash
npm run prisma:generate
npm run prisma:deploy
```

Inicia el servidor:

```bash
npm run start:dev
```

- API: http://localhost:8081/api
- Salud: http://localhost:8081/api/salud
- Swagger: http://localhost:8081/api/docs

## Base de datos para el equipo

Cada integrante tiene dos opciones:

1. **Crear su propia base en Neon** (recomendado): crea un proyecto gratis en
   https://neon.tech, copia su `DATABASE_URL` en `backend/.env` y ejecuta
   `npm run prisma:deploy`. Las tablas se crean a partir de las migraciones del repo.
2. **Compartir la misma base del equipo**:
   1. Cada compañero debe crear una cuenta gratis en https://neon.tech y darte
      el correo con el que se registró.
   2. En Neon Console, abre el proyecto → **Settings → Collaborators**
      (en algunas versiones aparece como **Sharing**) → **Invite**.
   3. Escribe los correos separados por comas y confirma con **Invite**.
   4. Cada invitado acepta el correo; el proyecto aparecerá en su panel en
      **Shared with me**. Desde ahí abre **Connect** y copia su cadena de conexión.
   5. Esa cadena va en `backend/.env` de cada compañero (nunca se sube a Git).
   6. Luego cada uno ejecuta `npm install`, `npm run prisma:deploy` y
      `npm run start:dev`.

   El consumo y los costos del proyecto compartido se cobran a la cuenta dueña.

   Como todos usan la **misma base**, tengan en cuenta:
   - Solo una persona crea migraciones con `npm run prisma:migrate -- --name ...`.
   - Los demás aplican los cambios con `npm run prisma:deploy`.
   - **Nunca** ejecutar `prisma migrate reset` sin avisar al equipo: borra todo.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | Servidor en modo desarrollo |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run lint` | Revisa el código |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run test:e2e` | Pruebas end-to-end |
| `npm run prisma:generate` | Genera el cliente de Prisma |
| `npm run prisma:migrate -- --name nombre` | Crea una migración en desarrollo |
| `npm run prisma:deploy` | Aplica migraciones existentes |
| `npm run prisma:studio` | Abre Prisma Studio |

## Estructura

```
backend/
├── prisma/
│   ├── schema.prisma        # Modelos en español
│   └── migrations/          # Historial de migraciones
├── src/
│   ├── prisma/              # Servicio y módulo de Prisma
│   ├── app.modulo.ts        # Módulo raíz
│   ├── app.controlador.ts   # Rutas de salud
│   ├── app.servicio.ts
│   └── main.ts              # Arranque, CORS, Swagger y validación
├── test/
├── prisma.config.ts
└── .env.example
```

## Modelos actuales

`Usuario`, `Articulo`, `Alquiler`, `Pago`, `Billetera`,
`TransaccionBilletera`, `Retiro`, `CodigoOtp`, `TokenRefresco`.

## Nota sobre el puerto

El puerto por defecto de Nest es `3000`, pero aquí usamos `8081` porque el
`8080` suele estar ocupado por Oracle (`TNSLSNR`) en Windows. El frontend debe
apuntar a `VITE_API_BASE_URL=http://localhost:8081/api`.
