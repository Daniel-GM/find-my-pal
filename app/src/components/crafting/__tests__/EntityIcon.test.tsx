import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EntityIcon } from '../EntityIcon';

const entity = {
  id: 'Berry_Seeds',
  kind: 'material' as const,
  names: { en: 'Berry Seeds' },
  iconName: 'Berry_Seeds',
  iconUrl: 'https://cdn.paldb.cc/image/Others/InventoryItemIcon/Texture/T_itemicon_Material_BerrySeeds.webp',
  selectable: false,
};

const ancientFence = {
  id: 'Ancient_Fence',
  kind: 'structure' as const,
  names: { en: 'Ancient Fence' },
  iconName: 'Ancient_Fence',
  iconUrl: 'https://cdn.paldb.cc/image/Pal/Texture/BuildObject/PNG/T_icon_buildObject_Ancient_Fence.webp',
  selectable: true,
};

describe('EntityIcon', () => {
  it('tries Palpedia before showing the generic fallback', () => {
    const { container } = render(<EntityIcon entity={entity} />);
    const primary = container.querySelector('img');
    expect(primary).toHaveAttribute('src', entity.iconUrl);

    fireEvent.error(primary!);
    const palpedia = container.querySelector('img');
    expect(palpedia).toHaveAttribute(
      'src',
      'https://palpedia.azrocdn.com/items/T_itemicon_Material_BerrySeeds.png',
    );

    fireEvent.error(palpedia!);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://palpedia.azrocdn.com/items/T_itemicon_Material_Berry_Seeds.png',
    );

    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('falls back from PalDB to Palpedia for building icons', () => {
    const { container } = render(<EntityIcon entity={ancientFence} />);
    const primary = container.querySelector('img');
    expect(primary).toHaveAttribute('src', ancientFence.iconUrl);

    fireEvent.error(primary!);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://palpedia.azrocdn.com/buildings/T_icon_buildObject_Ancient_Fence.png',
    );
  });
});
