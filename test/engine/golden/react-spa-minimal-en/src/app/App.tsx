// Application shell: header, main landmark, then the routes.
import { Link } from 'react-router';
import { t } from '@shared/lib/text';
import { AppRoutes } from './routes';

export function App() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 p-4" aria-label={t('nav.main', 'Main navigation')}>
          <Link to="/notes" className="text-lg font-semibold">
            kiosk
          </Link>
          <Link to="/notes/new" className="text-primary underline">
            {t('nav.newNote', 'New note')}
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <AppRoutes />
      </main>
    </div>
  );
}
