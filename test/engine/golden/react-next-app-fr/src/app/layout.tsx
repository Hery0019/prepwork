// Coquille de l'application : elle porte la feuille de style et le repère principal.
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { publicEnv } from '@shared/config/env';
import { t } from '@shared/lib/text';
import '@shared/styles/app.css';

export const metadata: Metadata = {
  title: publicEnv.NEXT_PUBLIC_APP_NAME,
  description: 'Interface rendue sur le serveur',
};

export const viewport: Viewport = { colorScheme: 'light dark' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        <header className="border-b border-border">
          <nav
            className="mx-auto flex max-w-5xl items-center gap-4 p-4"
            aria-label={t('nav.main', 'Navigation principale')}
          >
            <Link href="/notes" className="text-lg font-semibold">
              {publicEnv.NEXT_PUBLIC_APP_NAME}
            </Link>
            <Link href="/notes/new" className="text-primary underline">
              {t('nav.newNote', 'Nouvelle note')}
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
