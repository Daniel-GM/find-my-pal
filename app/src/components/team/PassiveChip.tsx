import { X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { Passive } from '@/data/passives';
import { getPassiveStyle, PASSIVE_STYLE_GRADIENTS } from '@/data/passives';

/** Stacked chevrons like the game's passive chips (count = |tier|) */
function Chevrons({ count }: { count: number }) {
  return (
    <span className="flex flex-col items-center shrink-0" style={{ lineHeight: 0 }}>
      {Array.from({ length: count }, (_, i) => (
        <svg
          key={i}
          width="10"
          height="5"
          viewBox="0 0 10 6"
          style={{ marginTop: i === 0 ? 0 : -2, display: 'block' }}
        >
          <path
            d="M1 5L5 1L9 5"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

interface PassiveChipProps {
  passive: Passive;
  onRemove?: () => void;
}

/**
 * Game-style passive chip: gradient background by style (blue/gold/rainbow/gray),
 * white bold name and stacked chevrons for the tier.
 */
export function PassiveChip({ passive, onRemove }: PassiveChipProps) {
  const { locale } = useTranslation();
  const style = getPassiveStyle(passive);
  const chevrons = Math.abs(passive.tier);

  return (
    <div
      className="flex items-center gap-2"
      style={{
        padding: '4px 8px',
        borderRadius: 6,
        background: PASSIVE_STYLE_GRADIENTS[style],
      }}
      title={passive.effects[locale] || passive.effects.en}
    >
      <span
        className="text-[12px] font-semibold flex-1 min-w-0 truncate"
        style={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.55)' }}
      >
        {passive.names[locale] || passive.names.en}
      </span>
      <Chevrons count={chevrons} />
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 flex items-center justify-center"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
