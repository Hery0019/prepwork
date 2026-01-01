// Coquille de l'application : en-tête, repère principal, puis les routes.
import { Link } from 'react-router';
import { t } from '@shared/lib/text';
import { AppRoutes } from './routes';

export function App() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 p-4" aria-label={t('nav.main', 'Navigation principale')}>
          <Link to="/notes" className="text-lg font-semibold">
            note-book
          </Link>
          <Link to="/notes/new" className="text-primary underline">
            {t('nav.newNote', 'Nouvelle note')}
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <AppRoutes />
      </main>
    </div>
  );
}
