// Entry point: mounts the application into the DOM, under the project providers.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import { Providers } from '@app/providers';
import '@shared/styles/app.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root introuvable dans index.html');

createRoot(container).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
