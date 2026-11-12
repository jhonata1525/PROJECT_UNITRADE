# UniTrade Project

This is a monorepo-style project with two independent applications at root level:

### Frontend (`frontend/`)
- React 18 + Vite 8 + Tailwind 4 + React Router 7
- Port: 5173
- Entry: `frontend/src/main.jsx`

### Backend (`backend/`)
- NestJS 12 + Prisma 7 + PostgreSQL
- Port: 8081

### Available Scripts

#### Frontend
```powershell
cd project_unitrade/frontend
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
npm run build
npm run lint
```

#### Backend
```powershell
cd project_unitrade/backend
npm install
npm run start:dev     # http://localhost:8081/api
```

### Documentation
See `docs/MAPA_PROYECTO.md` for detailed architecture, routes, and database schema.

```powershell
# Frontend dev
cd project_unitrade/frontend
npm run dev

# Backend dev
cd project_unitrade/backend
npm run start:dev
```