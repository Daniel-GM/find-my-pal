import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { useAppState } from '@/hooks/useAppState';
import { BreedingTreeView } from '@/components/breeding';
import { findPalByName } from '@/data/pals';

function renderTree(palName = 'Lamball') {
  const pal = findPalByName(palName)!;
  function Wrapper() {
    const appState = useAppState();
    return <BreedingTreeView targetPal={pal} appState={appState} />;
  }
  return render(
    <I18nProvider>
      <Wrapper />
    </I18nProvider>,
  );
}

describe('BreedingTreeView', () => {
  it('renders the tree with toolbar and steps count', () => {
    renderTree();
    expect(
      screen.getByRole('button', { name: /Save Tree|Salvar Árvore/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/breeding steps|passos de cria/i)).toBeInTheDocument();
    // target pal + at least one level of parents rendered
    expect(screen.getAllByText('Lamball').length).toBeGreaterThan(0);
    const nodeButtons = screen.getAllByTitle(/Change parents|Trocar pais/i);
    expect(nodeButtons.length).toBeGreaterThan(1);
  });

  it('opens the combination picker when clicking a node', async () => {
    renderTree();
    const nodeButtons = screen.getAllByTitle(/Change parents|Trocar pais/i);
    fireEvent.click(nodeButtons[0]);
    expect(
      await screen.findByText(/Choose combination for|Escolher combinação para/i),
    ).toBeInTheDocument();
  });

  it('saves the whole tree as a new package in execution order', async () => {
    renderTree();
    fireEvent.click(screen.getByRole('button', { name: /Save Tree|Salvar Árvore/i }));

    // summary mentions the tree and the target
    expect(
      await screen.findByText(/combinations to Lamball|combinações até Lamball/i),
    ).toBeInTheDocument();

    const nameInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(nameInput, { target: { value: 'Test Tree Pkg' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Create & Save|Criar e Salvar/i }),
    );

    // persistence is debounced (500ms) in useAppState — wait for it
    interface PersistedPkg {
      name: string;
      combinationIds: string[];
      treeTargetPalId?: string;
    }
    let pkg: PersistedPkg | undefined;
    await waitFor(
      () => {
        const raw = JSON.parse(
          localStorage.getItem('palworld-breeding-manager') || '{}',
        ) as { packages?: PersistedPkg[] };
        pkg = (raw.packages || []).find((p) => p.name === 'Test Tree Pkg');
        expect(pkg).toBeDefined();
      },
      { timeout: 2000 },
    );

    expect(pkg).toBeDefined();
    expect(pkg!.combinationIds.length).toBeGreaterThan(1);
    // execution order: target combo (baby = Lamball) is saved last
    const lastId = pkg!.combinationIds[pkg!.combinationIds.length - 1];
    const lamball = findPalByName('Lamball')!;
    expect(lastId.endsWith(`=${lamball.id}`)).toBe(true);
    // tree packages remember their target so "View Tree" can reopen them
    expect(pkg!.treeTargetPalId).toBe(lamball.id);
  });
});
