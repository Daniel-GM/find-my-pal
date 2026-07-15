import { describe, expect, it } from 'vitest';
import {
  getGameEntityImageUrl,
  getPalpediaImageFallbackUrl,
} from '../game-entity-images';

describe('game entity images', () => {
  it('resolves Coralum assets using their internal Manganese names', () => {
    expect(getGameEntityImageUrl('CoralumOre')).toContain(
      '/items/T_itemicon_Material_ManganeseOre.png',
    );
    expect(getGameEntityImageUrl('CoralumIngot')).toContain(
      '/items/T_itemicon_Material_ManganeseIngot.png',
    );
  });

  it('resolves crafting structures from the buildings asset collection', () => {
    expect(getGameEntityImageUrl('Chest3')).toContain(
      '/buildings/T_icon_buildObject_ItemChest_04.png',
    );
    expect(getGameEntityImageUrl('BlastFurnace4')).toContain(
      '/buildings/T_icon_buildObject_BlastFurnace4.png',
    );
    expect(getGameEntityImageUrl('MissileLauncher')).toContain(
      '/buildings/T_icon_buildObject_efenseBulletLauncher_Missile.png',
    );
  });

  it('derives Palpedia fallbacks from PalDB inventory icons', () => {
    expect(
      getPalpediaImageFallbackUrl(
        'https://cdn.paldb.cc/image/Others/InventoryItemIcon/Texture/T_itemicon_Material_BerrySeeds.webp',
      ),
    ).toBe('https://palpedia.azrocdn.com/items/T_itemicon_Material_BerrySeeds.png');
    expect(
      getPalpediaImageFallbackUrl(
        'https://cdn.paldb.cc/image/Others/InventoryItemIcon/Texture/T_itemicon_Material_Wood_WorldTree.webp',
      ),
    ).toBe('https://palpedia.azrocdn.com/items/T_itemicon_Material_Wood_WorldTree.png');
  });

  it('derives Palpedia fallbacks from PalDB building icons', () => {
    expect(
      getPalpediaImageFallbackUrl(
        'https://cdn.paldb.cc/image/Pal/Texture/BuildObject/PNG/T_icon_buildObject_WorkBench.webp',
      ),
    ).toBe('https://palpedia.azrocdn.com/buildings/T_icon_buildObject_WorkBench.png');
    expect(
      getPalpediaImageFallbackUrl(
        'https://cdn.paldb.cc/image/Pal/Texture/BuildObject/PNG/T_icon_buildObject_Ancient_Fence.webp',
      ),
    ).toBe('https://palpedia.azrocdn.com/buildings/T_icon_buildObject_Ancient_Fence.png');
  });

  it('does not rewrite unrelated image URLs', () => {
    expect(
      getPalpediaImageFallbackUrl('https://cdn.paldb.cc/image/Pal/Texture/UI/Main_Menu/T_icon_unknown.webp'),
    ).toBeUndefined();
    expect(getPalpediaImageFallbackUrl('not a URL')).toBeUndefined();
  });
});
