import * as HoverCard from '@radix-ui/react-hover-card';
import {
  Activity,
  Apple,
  BriefcaseBusiness,
  Heart,
  Shield,
  Sparkles,
  Sword,
  Timer,
  Zap,
} from 'lucide-react';
import type { ReactElement } from 'react';
import type { GearItem, GearStat } from '@/data/gear';
import { getRarityColor } from '@/data/gear';
import { useTranslation } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';

interface GearHoverCardProps {
  item: GearItem;
  children: ReactElement;
}

const STAT_LABEL_KEYS: Record<string, TranslationKey> = {
  attack: 'team.itemDamage',
  ataque: 'team.itemDamage',
  defense: 'team.itemDefense',
  defesa: 'team.itemDefense',
  health: 'team.itemHealth',
  vida: 'team.itemHealth',
  hp: 'team.itemHealth',
  pv: 'team.itemHealth',
  shield: 'team.itemShield',
  escudo: 'team.itemShield',
  nutrition: 'team.itemNutrition',
  'valor nutricional': 'team.itemNutrition',
  san: 'team.itemSanity',
  'work speed': 'team.itemWorkSpeed',
  'velocidade de trabalho': 'team.itemWorkSpeed',
  'recovery time': 'team.itemRecoveryTime',
  'tempo de recuperação': 'team.itemRecoveryTime',
  'tempo de cura': 'team.itemRecoveryTime',
  technology: 'team.itemTechnology',
  tecnologias: 'team.itemTechnology',
  bonus: 'team.itemBonus',
  bônus: 'team.itemBonus',
};

const STAT_ICONS: Record<string, ReactElement> = {
  attack: <Sword size={13} />,
  ataque: <Sword size={13} />,
  defense: <Shield size={13} />,
  defesa: <Shield size={13} />,
  health: <Heart size={13} />,
  vida: <Heart size={13} />,
  hp: <Heart size={13} />,
  pv: <Heart size={13} />,
  shield: <Shield size={13} />,
  escudo: <Shield size={13} />,
  nutrition: <Apple size={13} />,
  'valor nutricional': <Apple size={13} />,
  san: <Activity size={13} />,
  'work speed': <BriefcaseBusiness size={13} />,
  'velocidade de trabalho': <BriefcaseBusiness size={13} />,
  'recovery time': <Timer size={13} />,
  'tempo de recuperação': <Timer size={13} />,
  'tempo de cura': <Timer size={13} />,
  technology: <Zap size={13} />,
  tecnologias: <Zap size={13} />,
  bonus: <Sparkles size={13} />,
  bônus: <Sparkles size={13} />,
};

const RARITY_NAMES = {
  en: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
  'pt-BR': ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'],
} as const;

function normalizeLabel(label: string) {
  return label.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function getStats(item: GearItem, locale: 'en' | 'pt-BR'): GearStat[] {
  const stats = item.stats?.[locale] || item.stats?.en;
  if (stats?.length) return stats;

  return (item.effects?.[locale] || item.effects?.en || '')
    .split(';')
    .map((effect) => effect.trim())
    .filter(Boolean)
    .map((effect) => {
      const match = effect.match(/^(.*?)(?:\s+)([-+]?\d+(?:\.\d+)?%?)$/);
      return match ? { label: match[1], value: match[2] } : { label: 'Bonus', value: effect };
    });
}

function getKindLabel(item: GearItem, t: (key: TranslationKey) => string) {
  const key: Record<GearItem['kind'], TranslationKey> = {
    armor: 'team.armor',
    helmet: 'team.helmet',
    accessory: 'team.accessories',
    weapon: 'team.weapon',
    food: 'team.food',
  };
  return t(key[item.kind]);
}

function statLabel(label: string, t: (key: TranslationKey) => string) {
  const key = STAT_LABEL_KEYS[normalizeLabel(label)];
  return key ? t(key) : label;
}

function statIcon(label: string) {
  return STAT_ICONS[normalizeLabel(label)] || <Sparkles size={13} />;
}

export function GearHoverCard({ item, children }: GearHoverCardProps) {
  const { t, locale } = useTranslation();
  const stats = getStats(item, locale);
  const description = item.descriptions?.[locale] || item.descriptions?.en;
  const rarity = item.rarity ?? 0;
  const rarityColor = getRarityColor(item);
  const rarityName = RARITY_NAMES[locale][rarity] || RARITY_NAMES.en[rarity];

  return (
    <HoverCard.Root openDelay={160} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <span className="flex w-full">{children}</span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          className="z-[70] w-[350px] max-w-[calc(100vw-24px)]"
          style={{
            padding: 14,
            borderRadius: 12,
            border: '1px solid rgba(92, 225, 232, 0.5)',
            background:
              'linear-gradient(145deg, rgba(25, 42, 45, 0.98), rgba(6, 13, 16, 0.99))',
            boxShadow: '0 18px 45px rgba(0,0,0,0.52), inset 0 0 18px rgba(72,215,224,0.06)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex items-start gap-3">
            {item.iconUrl ? (
              <img
                src={item.iconUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-contain"
                style={{
                  border: `1px solid ${rarityColor}`,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                }}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: '#6BE7FF' }}
              >
                {t('team.itemDetails')}
              </div>
              <div className="mt-1 truncate text-[16px] font-bold">
                {item.names[locale] || item.names.en}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                <span style={{ color: 'var(--text-muted)' }}>{getKindLabel(item, t)}</span>
                <span style={{ color: rarityColor }}>{rarityName}</span>
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {stats.map((stat, index) => (
                <div
                  key={`${stat.label}-${stat.value}-${index}`}
                  className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2"
                  style={{
                    border: '1px solid rgba(118, 148, 151, 0.35)',
                    backgroundColor: 'rgba(0, 0, 0, 0.22)',
                  }}
                >
                  <span style={{ color: '#6BE7FF' }}>{statIcon(stat.label)}</span>
                  <span className="min-w-0 flex-1 truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {statLabel(stat.label, t)}
                  </span>
                  <strong className="text-[12px]" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </strong>
                </div>
              ))}
            </div>
          )}

          {description && (
            <div className="mt-3">
              <div
                className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--text-muted)' }}
              >
                {t('team.itemBonus')}
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            </div>
          )}

          {!stats.length && !description && (
            <p className="mt-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {t('team.noItemDetails')}
            </p>
          )}

          <HoverCard.Arrow
            width={12}
            height={7}
            style={{ fill: 'rgba(25, 42, 45, 0.98)' }}
          />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
