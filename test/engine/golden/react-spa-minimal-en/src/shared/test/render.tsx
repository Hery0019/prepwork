// Test rendering: the same providers as the application, so tests exercise the real wiring.
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

export interface RenderOptions {
  /** Initial route of the memory router. */
  route?: string;
}

function Wrapper({ children, route }: { children: ReactNode; route: string }) {
  return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}): RenderResult {
  const route = options.route ?? '/';
  return render(ui, {
    wrapper: ({ children }) => <Wrapper route={route}>{children}</Wrapper>,
  });
}
