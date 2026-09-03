// Rendu de test : les mêmes providers que l'application, pour que les tests exercent le vrai câblage.
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export interface RenderOptions {
  /** Route initiale du routeur mémoire. */
  route?: string;
}

function Wrapper({ children, route }: { children: ReactNode; route: string }) {
  // Un client neuf par test : aucun cache ne fuit d'un test à l'autre.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const route = options.route ?? '/';
  return render(ui, {
    wrapper: ({ children }) => <Wrapper route={route}>{children}</Wrapper>,
  });
}
