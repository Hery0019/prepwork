// SPA-007 : la carte des routes vit ici, et chaque écran charge sa feature en différé.
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { t } from '@shared/lib/text';
import { Skeleton } from '@shared/ui';

const NoteList = lazy(async () => ({ default: (await import('@features/notes')).NoteList }));
const NoteForm = lazy(async () => ({ default: (await import('@features/notes')).NoteForm }));
const NoteDetail = lazy(async () => ({ default: (await import('@features/notes')).NoteDetail }));

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-busy="true" aria-label={t('routes.loading', 'Chargement de l\'écran')}>
          <Skeleton className="h-40" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="/notes" element={<NoteList />} />
        <Route path="/notes/new" element={<NoteForm />} />
        <Route path="/notes/:id" element={<NoteDetail />} />
      </Routes>
    </Suspense>
  );
}
