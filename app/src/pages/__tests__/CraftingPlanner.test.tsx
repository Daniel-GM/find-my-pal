import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import CraftingPlanner from '@/pages/CraftingPlanner';

function renderPlanner() {
  return render(
    <I18nProvider>
      <CraftingPlanner />
    </I18nProvider>,
  );
}

describe('CraftingPlanner page', () => {
  it('shows empty state before selection', () => {
    renderPlanner();
    expect(screen.getByText(/Choose something to craft|Escolha o que craftar/i)).toBeInTheDocument();
  });

  it('selects a target and shows raw materials', async () => {
    renderPlanner();
    const search = screen.getByLabelText(/Search by name|Buscar por nome/i);
    fireEvent.change(search, { target: { value: 'Gigantic Furnace' } });
    const option = await screen.findByRole('option', { name: /Gigantic Furnace|Fornalha Gigante/i });
    fireEvent.click(option);
    expect(await screen.findByRole('heading', { name: /Raw materials|Materiais brutos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Crafting steps|Etapas de craft/i })).toBeInTheDocument();
  });

  it('recalculates when quantity changes', async () => {
    renderPlanner();
    fireEvent.change(screen.getByLabelText(/Search by name|Buscar por nome/i), {
      target: { value: 'Charcoal' },
    });
    fireEvent.click(await screen.findByRole('option', { name: /Charcoal|Carvão Vegetal/i }));
    const quantity = screen.getByLabelText(/Quantity|Quantidade/i);
    fireEvent.change(quantity, { target: { value: '2' } });
    expect(await screen.findByText('4')).toBeInTheDocument();
  });
});
