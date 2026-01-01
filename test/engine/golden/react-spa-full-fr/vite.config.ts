/// <reference types="vitest/config" />
// Configuration Vite et Vitest. Les alias reflètent les couches du profil.
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@app': resolvePath('./src/app'),
      '@features': resolvePath('./src/features'),
      '@entities': resolvePath('./src/entities'),
      '@shared': resolvePath('./src/shared'),
    },
  },
  test: {
    environment: 'jsdom',
    // Les tests tournent avec la configuration d'un environnement réel : rien n'est deviné.
    env: {
      VITE_API_BASE_URL: 'http://localhost:8080/api/v1',
      VITE_AUTH_LOGIN_PATH: '/bff/login',
    },
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
  },
});
