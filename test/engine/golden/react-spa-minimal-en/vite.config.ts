/// <reference types="vitest/config" />
// Vite and Vitest configuration. The aliases mirror the profile layers.
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
    // Tests run with the configuration of a real environment: nothing is guessed.
    env: {
      VITE_API_BASE_URL: 'http://localhost:8080/api/v1',
    },
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
  },
});
