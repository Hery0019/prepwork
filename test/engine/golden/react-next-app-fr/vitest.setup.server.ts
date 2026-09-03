// Mise en place des tests de modules serveur : seulement le serveur MSW, aucun DOM.
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/shared/test/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
