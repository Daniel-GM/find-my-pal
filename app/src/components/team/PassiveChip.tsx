import { X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { Passive } from '@/data/passives';
import { getPassiveStyle, PASSIVE_STYLE_TOKENS } from '@/data/passives';

interface PassiveChipProps {
  passive: Passive;
  onRemove?: () => void;
}

/**
 * Game-style passive banner with the original Palworld texture and rank image.
 */
export function PassiveChip({ passive, onRemove }: PassiveChipProps) {
  const { locale } = useTranslation();
  const style = getPassiveStyle(passive);
  const tokens = PASSIVE_STYLE_TOKENS[style];
  const rank = Math.min(Math.abs(passive.tier), 5);

  return (
    <div
      className="relative flex items-center gap-2 overflow-hidden"
      data-passive-style={style}
      style={{
        minHeight: 28,
        padding: '3px 6px 3px 9px',
        borderRadius: 3,
        border: `1px solid ${tokens.border}`,
        borderLeft: `4px solid ${tokens.accent}`,
        backgroundImage: `${tokens.overlay}, linear-gradient(rgba(12, 17, 18, 0.58), rgba(4, 8, 9, 0.88)), url('/assets/passives/passive-bar-texture.webp')`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat, no-repeat, repeat-x',
        backgroundSize: 'cover, cover, auto 100%',
        boxShadow: `inset 0 0 7px ${tokens.glow}, 0 0 4px ${tokens.glow}`,
      }}
      title={passive.effects[locale] || passive.effects.en}
    >
      <span
        className="text-[12px] font-semibold flex-1 min-w-0 truncate"
        style={{ color: tokens.text, textShadow: '0 1px 2px rgba(0,0,0,0.85)' }}
      >
        {passive.names[locale] || passive.names.en}
      </span>
      <img
        src={`/assets/passives/rank-arrow-${rank}.webp`}
        alt=""
        aria-hidden="true"
        className="shrink-0 object-contain"
        style={{
          width: 18,
          height: 18,
          filter: tokens.arrowFilter,
          transform: passive.tier < 0 ? 'scaleY(-1)' : undefined,
        }}
      />
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 flex items-center justify-center rounded-sm"
          style={{ color: 'rgba(255,255,255,0.82)' }}
          aria-label={`${passive.names[locale] || passive.names.en}: ${locale === 'pt-BR' ? 'remover' : 'remove'}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
