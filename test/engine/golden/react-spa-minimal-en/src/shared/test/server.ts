// CORE-062: HTTP is stubbed at the network boundary, never by replacing `fetch`.
import { setupServer } from 'msw/node';

export const server = setupServer();
