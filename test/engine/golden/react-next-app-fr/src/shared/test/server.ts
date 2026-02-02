// CORE-062 : le HTTP est simulé à la frontière réseau, jamais en remplaçant `fetch`.
import { setupServer } from 'msw/node';

export const server = setupServer();
