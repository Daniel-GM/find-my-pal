import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { findGearById, getRaritySlotStyle } from '@/data/gear';
import type { GearKind } from '@/data/gear';
import type { PlayerGear } from '@/hooks/useAppState';
import {
  MAX_PLAYER_ACCESSORIES,
  MAX_PLAYER_WEAPONS,
  MAX_PLAYER_FOODS,
} from '@/hooks/useAppState';
import { GearPickerDialog } from './GearPickerDialog';
import { GearHoverCard } from './GearHoverCard';

interface PlayerGearSectionProps {
  player: PlayerGear;
  onSetArmor: (gearId: string | null) => void;
  onSetHelmet: (gearId: string | null) => void;
  onToggleWeapon: (gearId: string) => void;
  onToggleAccessory: (gearId: string) => void;
  onToggleFood: (gearId: string) => void;
  /** Hides pickers and remove buttons; slots become static display. */
  readOnly?: boolean;
}

interface GearSlotProps {
  itemId: string | null;
  onOpen: () => void;
  onRemove: () => void;
  readOnly?: boolean;
}

function GearSlot({ itemId, onOpen, onRemove, readOnly = false }: GearSlotProps) {
  const { locale, t } = useTranslation();
  const item = itemId ? findGearById(itemId) : null;

  const slotButton = (
    <button
      onClick={readOnly ? undefined : onOpen}
      disabled={readOnly}
      title={item ? item.names[locale] || item.names.en : t('team.selectItem')}
      className={`flex items-center justify-center${readOnly ? '' : ' transition-all duration-150 hover:scale-105'}`}
      style={{
        width: 64,
        height: 64,
        borderRadius: 8,
        padding: 6,
        ...(readOnly ? { cursor: 'default' } : {}),
        ...(item
          ? getRaritySlotStyle(item)
          : {
              backgroundColor: 'var(--bg-base)',
              border: '1px dashed var(--border-subtle)',
            }),
      }}
    >
      {item?.iconUrl ? (
        <img
          src={item.iconUrl}
          alt={item.names[locale] || item.names.en}
          width={52}
          height={52}
          loading="lazy"
          style={{ objectFit: 'contain' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : item ? (
        <span
          className="text-[9px] font-medium text-center leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.names[locale] || item.names.en}
        </span>
      ) : (
        <Plus size={18} style={{ color: 'var(--text-muted)' }} />
      )}
    </button>
  );

  return (
    <div style={{ position: 'relative', width: 64, height: 64 }}>
      {item ? <GearHoverCard item={item}>{slotButton}</GearHoverCard> : slotButton}
      {item && !readOnly && (
        <button
          onClick={onRemove}
          className="flex items-center justify-center transition-all duration-150 hover:scale-110"
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          title={t('app.delete')}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export function PlayerGearSection({
  player,
  onSetArmor,
  onSetHelmet,
  onToggleWeapon,
  onToggleAccessory,
  onToggleFood,
  readOnly = false,
}: PlayerGearSectionProps) {
  const { t } = useTranslation();
  const [openKind, setOpenKind] = useState<GearKind | null>(null);

  const groupStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
  };

  const slotsRow = (
    ids: (string | null)[],
    max: number,
    kind: GearKind,
    onRemove: (id: string) => void,
  ) => (
    <div className="flex flex-wrap" style={{ gap: 10 }}>
      {Array.from({ length: max }, (_, i) => {
        const id = ids[i] ?? null;
        return (
          <GearSlot
            key={id ?? `empty-${kind}-${i}`}
            itemId={id}
            onOpen={() => setOpenKind(kind)}
            onRemove={() => id && onRemove(id)}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );

  return (
    <div>
      <h3 className="text-[16px] font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        {t('team.playerSection')}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {/* Armor */}
        <div style={groupStyle}>
          <span className="text-[10px] font-semibold uppercase" style={labelStyle}>
            {t('team.armor')}
          </span>
          {slotsRow([player.armorId], 1, 'armor', () => onSetArmor(null))}
        </div>

        {/* Helmet */}
        <div style={groupStyle}>
          <span className="text-[10px] font-semibold uppercase" style={labelStyle}>
            {t('team.helmet')}
          </span>
          {slotsRow([player.helmetId], 1, 'helmet', () => onSetHelmet(null))}
        </div>

        {/* Weapons */}
        <div style={groupStyle}>
          <span className="text-[10px] font-semibold uppercase" style={labelStyle}>
            {t('team.weapon')} ({player.weaponIds.length}/{MAX_PLAYER_WEAPONS})
          </span>
          {slotsRow(player.weaponIds, MAX_PLAYER_WEAPONS, 'weapon', onToggleWeapon)}
        </div>

        {/* Accessories */}
        <div style={groupStyle}>
          <span className="text-[10px] font-semibold uppercase" style={labelStyle}>
            {t('team.accessories')} ({player.accessoryIds.length}/{MAX_PLAYER_ACCESSORIES})
          </span>
          {slotsRow(player.accessoryIds, MAX_PLAYER_ACCESSORIES, 'accessory', onToggleAccessory)}
        </div>

        {/* Food */}
        <div style={groupStyle}>
          <span className="text-[10px] font-semibold uppercase" style={labelStyle}>
            {t('team.food')} ({player.foodIds.length}/{MAX_PLAYER_FOODS})
          </span>
          {slotsRow(player.foodIds, MAX_PLAYER_FOODS, 'food', onToggleFood)}
        </div>
      </div>

      {/* Pickers */}
      {!readOnly && (
        <>
          <GearPickerDialog
            isOpen={openKind === 'armor'}
            kind="armor"
            selectedIds={player.armorId ? [player.armorId] : []}
            onToggle={(id) => {
              onSetArmor(player.armorId === id ? null : id);
              setOpenKind(null);
            }}
            onClose={() => setOpenKind(null)}
          />
          <GearPickerDialog
            isOpen={openKind === 'helmet'}
            kind="helmet"
            selectedIds={player.helmetId ? [player.helmetId] : []}
            onToggle={(id) => {
              onSetHelmet(player.helmetId === id ? null : id);
              setOpenKind(null);
            }}
            onClose={() => setOpenKind(null)}
          />
          <GearPickerDialog
            isOpen={openKind === 'weapon'}
            kind="weapon"
            selectedIds={player.weaponIds}
            onToggle={onToggleWeapon}
            onClose={() => setOpenKind(null)}
          />
          <GearPickerDialog
            isOpen={openKind === 'accessory'}
            kind="accessory"
            selectedIds={player.accessoryIds}
            onToggle={onToggleAccessory}
            onClose={() => setOpenKind(null)}
          />
          <GearPickerDialog
            isOpen={openKind === 'food'}
            kind="food"
            selectedIds={player.foodIds}
            onToggle={onToggleFood}
            onClose={() => setOpenKind(null)}
          />
        </>
      )}
    </div>
  );
}
