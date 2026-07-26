import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { useAppState } from '@/hooks/useAppState';
import Home from '@/pages/Home';

function renderHome() {
  function Wrapper() {
    const appState = useAppState();
    return <Home appState={appState} />;
  }
  return render(
    <I18nProvider>
      <Wrapper />
    </I18nProvider>,
  );
}

describe('Home search mode toggle', () => {
  it('switches between child, parent and tree modes', () => {
    renderHome();

    const childBtn = screen.getByRole('button', { name: /By Child|Por Filho/i });
    const parentBtn = screen.getByRole('button', { name: /By Parent|Por Pai/i });
    const treeBtn = screen.getByRole('button', { name: /Tree|Árvore/i });

    // child is the default: child-mode empty state subtitle visible
    expect(
      screen.getAllByText(/all possible parent breeding combinations|combinações possíveis de pais/i)
        .length,
    ).toBeGreaterThan(0);

    fireEvent.click(parentBtn);
    expect(
      screen.getAllByText(/all possible partners|parceiros possíveis e seus resultados/i).length,
    ).toBeGreaterThan(0);

    fireEvent.click(treeBtn);
    // tree mode keeps the pal-selection empty state (child-style subtitle)
    expect(
      screen.getAllByText(/all possible parent breeding combinations|combinações possíveis de pais/i)
        .length,
    ).toBeGreaterThan(0);

    fireEvent.click(childBtn);
    expect(childBtn).toBeInTheDocument();
  });
});
