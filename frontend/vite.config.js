import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUERTO_DEV = 5173;

/**
 * Devuelve la IPv4 de la red local para que el QR del carnet pueda abrirse
 * desde el celular (localhost en el teléfono apunta al propio teléfono).
 */
const obtenerIpLocal = () => {
  const interfaces = os.networkInterfaces();

  for (const redes of Object.values(interfaces)) {
    for (const red of redes ?? []) {
      if (
        red.family === 'IPv4' &&
        !red.internal &&
        !red.address.startsWith('169.254.')
      ) {
        return red.address;
      }
    }
  }

  return null;
};

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const ipLocal = command === 'serve' ? obtenerIpLocal() : null;
  const urlPublica =
    env.VITE_PUBLIC_APP_URL?.trim() ||
    (ipLocal ? `http://${ipLocal}:${PUERTO_DEV}` : '');

  return {
    define: {
      __URL_PUBLICA_APP__: JSON.stringify(urlPublica),
    },
    plugins: [react()],
    server: {
      port: PUERTO_DEV,
      host: true,
      // El frontend llama a /api y Vite lo redirige al backend local.
      // Así funciona desde el celular (192.168.x.x:5173/api) sin CORS ni
      // tener que apuntar a localhost, que en el teléfono sería el teléfono.
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
        react: path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      },
    },
  };
});
