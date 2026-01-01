// Point d'entrée : monte l'application dans le DOM, sous les providers du projet.
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
