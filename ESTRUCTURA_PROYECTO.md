# 📁 Guía de Arquitectura de Carpetas - UniTrade Frontend

Este documento explica la función de cada carpeta y archivo dentro del repositorio de **UniTrade** para orientar al equipo de desarrollo y mantener las buenas prácticas del proyecto.

---

## 📂 Estructura Principal del Proyecto

- **`src/`**: Carpeta principal del código fuente de la aplicación React.
  - `src/componentes/`: Componentes reutilizables de UI (Artículos, Billetera, Auth, Comunes, Pasarela).
  - `src/contexto/`: Proveedores de estado global (ej. `ContextoAutenticacion.jsx`).
  - `src/paginas/`: Vistas y páginas principales de la app (`PaginaPerfil.jsx`, `PaginaMisArticulos.jsx`, `PaginaBilletera.jsx`, etc.).
  - `src/servicios/`: Lógica de negocio y simuladores de API/Backend (`servicioBilletera.js`, `servicioArticulos.js`, `servicioPasarelaPago.js`).
  - `src/rutas/`: Definición de enrutamiento y guardias de navegación (`EnrutadorAplicacion.jsx`).
  - `src/index.css`: Sistema de diseño global en Tailwind CSS (Dark SaaS Glassmorphism).

- **`public/`**: Archivos estáticos públicos accesibles directamente por el navegador (imágenes, favicons, logos).

---

## ⚙️ Archivos de Configuración y Documentación

- **`package.json` & `package-lock.json`**: Listado de dependencias, librerías instaladas y scripts de ejecución (`npm run dev`, `npm run build`).
- **`vite.config.js`**: Configuración del empaquetador Vite (rutas relativas, alias `@`, servidor local).
- **`tailwind.config.js` & `postcss.config.js`**: Configuración del motor de estilos Tailwind CSS.
- **`eslint.config.js` & `vitest.config.js`**: Reglas de linteo de código y configuración de pruebas unitarias.
- **`.env.example`**: Plantilla con las variables de entorno requeridas para despliegue y desarrollo (sin llaves privadas).
- **`.gitignore`**: Lista de archivos y carpetas locales que **NUNCA** deben subirse a GitHub (ej. `node_modules/`, `.opencode/`, `.env`).
- **`AGENTS.md` & `CONTEXT.md`**: Guías de contexto técnico, prompt de ingeniería y reglas de negocio del sistema UniTrade para asistentes de desarrollo.

---

## 🛑 Archivos Excluidos de GitHub (Solo Locales)

- **`node_modules/`**: Paquetes descargados por npm (se reconstruye en cada equipo con `npm install`).
- **`.opencode/`**: Carpeta de caché local, registros temporales y estado interno de la herramienta de IA OpenCode.
- **`build_errors.txt`**: Logs temporales de compilación generados durante el desarrollo local.
- **`dist/`**: Carpeta de compilación de producción generada por `npm run build` (se regenera en cada deploy).
- **`.env`**: Variables de entorno locales con secretos (usar `.env.example` como plantilla).
- **`*.log`**: Archivos de log generados en tiempo de ejecución.
- **`.DS_Store`**: Archivos de metadatos de macOS.
- **`Thumbs.db`**: Archivos de miniaturas de Windows.
- **`*.tmp` / `*.temp`**: Archivos temporales.
- **`*.swp` / `*.swo`**: Archivos de swap de Vim/Neovim.
- **`*.bak` / `*.backup`**: Archivos de respaldo locales.
- **`test-temp.jsx` / `test-minimal.jsx`**: Archivos de prueba temporales (no versionar).