import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { useAppState } from '@/hooks/useAppState';
import TeamBuilder from '@/pages/TeamBuilder';

function renderTeamBuilder() {
  function Wrapper() {
    const appState = useAppState();
    return <TeamBuilder appState={appState} />;
  }
  return render(
    <I18nProvider>
      <Wrapper />
    </I18nProvider>,
  );
}

describe('TeamBuilder page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows empty state when there are no teams', () => {
    renderTeamBuilder();
    expect(screen.getByText(/No teams yet|Nenhum time ainda/i)).toBeInTheDocument();
  });

  it('creates a team and fills a pal slot with active skills, passives and stars', async () => {
    renderTeamBuilder();
    // create team
    fireEvent.click(screen.getAllByRole('button', { name: /New Team|Novo Time/i })[0]);
    const nameInput = screen.getByPlaceholderText(/Team name|Nome do time/i);
    fireEvent.change(nameInput, { target: { value: 'Boss Team' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm|Confirmar/i }));

    // 5 empty slots + character section
    const emptySlots = screen.getAllByRole('button', { name: /Empty slot|Slot vazio/i });
    expect(emptySlots).toHaveLength(5);
    expect(screen.getByText(/^Character$|^Personagem$/i)).toBeInTheDocument();

    // assign a pal to the first slot
    fireEvent.click(emptySlots[0]);
    const searchInput = await screen.findByPlaceholderText(/Search pals|Buscar pals/i);
    fireEvent.change(searchInput, { target: { value: 'Lamball' } });
    fireEvent.click(await screen.findByText('Lamball'));
    expect(await screen.findByTitle(/Remove Pal|Remover Pal/i)).toBeInTheDocument();

    // add an active skill
    fireEvent.click(screen.getByRole('button', { name: /Select Active Skill|Escolher Habilidade Ativa/i }));
    const activeDialogHeading = await screen.findByRole('heading', {
      name: /Select Active Skill|Escolher Habilidade Ativa/i,
    });
    fireEvent.click(screen.getByRole('button', { name: /^Dark$|^Sombrio$/i }));
    const activeSearch = await screen.findByPlaceholderText(/^Search$|^Buscar$/i);
    fireEvent.change(activeSearch, { target: { value: 'Poison Blast' } });
    fireEvent.click(await screen.findByText('Poison Blast'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm|Confirmar/i }));
    await waitForElementToBeRemoved(activeDialogHeading);
    expect((await screen.findAllByText('Poison Blast')).length).toBeGreaterThan(0);

    // add a passive
    fireEvent.click(screen.getByRole('button', { name: /Select Passive|Escolher Passiva/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tier 4/i }));
    fireEvent.click(await screen.findByText('Legend'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm|Confirmar/i }));
    expect((await screen.findAllByText('Legend')).length).toBeGreaterThan(0);

    // set 3 stars
    const starButtons = screen.getAllByTitle('3');
    fireEvent.click(starButtons[0]);
  }, 15000);
});
