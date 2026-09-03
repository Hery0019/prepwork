// Niveau composant : le composant reçoit ses données, donc le test n'a besoin d'aucun réseau.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@shared/test/render';
import { aNote } from '../api/handlers';
import { NoteList } from './NoteList';

describe('NoteList', () => {
  it('NoteList_notesGiven_showsThemAsAList', () => {
    renderWithProviders(<NoteList notes={[aNote(), aNote({ id: 'n-2', title: 'Deuxième note' })]} />);

    expect(screen.getByRole('heading', { name: 'Première note' })).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('NoteList_noNote_showsTheEmptyStateAndTheWayOut', () => {
    renderWithProviders(<NoteList notes={[]} />);

    expect(
      screen.getByText('Aucune note pour le moment.'),
    ).toBeVisible();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/notes/new');
  });
});
