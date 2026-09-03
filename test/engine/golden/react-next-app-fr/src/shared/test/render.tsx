// Rendu de test des composants clients. Un composant serveur se teste par sa sortie, pas ici.
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(ui);
}
