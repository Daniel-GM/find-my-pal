import { describe, expect, it } from 'vitest';
import { getGameEntityImageUrl } from '../game-entity-images';

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
});
