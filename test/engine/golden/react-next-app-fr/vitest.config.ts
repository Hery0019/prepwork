// Un projet Next vit dans deux mondes, donc les tests aussi : les composants clients dans jsdom,
// les modules serveur dans Node avec la condition `react-server` — celle qui décide si
// `server-only` laisse passer l'import ou le refuse.
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

const alias = {
  '@app': resolvePath('./src/app'),
  '@features': resolvePath('./src/features'),
  '@entities': resolvePath('./src/entities'),
  '@shared': resolvePath('./src/shared'),
};

const env = {
  API_BASE_URL: 'http://localhost:8080/api/v1',
  NEXT_PUBLIC_APP_NAME: 'note-board',
  NEXT_PUBLIC_AUTH_LOGIN_PATH: '/bff/login',
};

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'client',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.tsx'],
          env,
        },
      },
      {
        resolve: {
          alias: { ...alias, 'server-only': resolvePath('./src/shared/test/server-only.ts') },
        },
        test: {
          name: 'server',
          environment: 'node',
          globals: true,
          setupFiles: ['./vitest.setup.server.ts'],
          include: ['src/**/*.test.ts'],
          env,
        },
      },
    ],
  },
});
