import * as HoverCard from '@radix-ui/react-hover-card';
import { Star } from 'lucide-react';
import PalImage from '@/components/PalImage';
import type { Pal } from '@/data/pals';
import {
  findPartnerSkillByPalName,
  getPartnerSkillDescription,
  getPartnerSkillName,
} from '@/data/partnerSkills';
import { useTranslation } from '@/i18n';

interface PartnerSkillHoverCardProps {
  pal: Pal;
  stars: number;
}

export function PartnerSkillHoverCard({ pal, stars }: PartnerSkillHoverCardProps) {
  const { t, locale } = useTranslation();
  const skill = findPartnerSkillByPalName(pal.name);

  return (
    <HoverCard.Root openDelay={160} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          className="shrink-0 rounded-full outline-none transition-transform duration-150 hover:scale-105 focus-visible:ring-2"
          aria-label={`${t('team.partnerSkill')}: ${pal.name}`}
          style={{ '--tw-ring-color': 'var(--accent-violet)' } as React.CSSProperties}
        >
          <PalImage
            iconName={pal.iconName}
            name={pal.name}
            size="lg"
            style={{ border: '2px solid var(--accent-violet)' }}
          />
        </button>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          className="z-[70] w-[360px] max-w-[calc(100vw-24px)]"
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
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: '#6BE7FF' }}
          >
            {t('team.partnerSkill')}
          </div>
          {skill ? (
            <>
              <div className="mt-1 text-[16px] font-bold">
                {getPartnerSkillName(skill, locale)}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {getPartnerSkillDescription(skill, locale)}
              </p>
              {skill.rankProgression && skill.rankProgression.length > 0 && (
                <div className="mt-3">
                  <div
                    className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t('team.partnerSkillProgression')}
                  </div>
                  <div
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${skill.rankProgression.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {skill.rankProgression.map((rank) => {
                      const active = rank.stars === stars;
                      return (
                        <div
                          key={`${rank.stars}-${rank.values.join('-')}`}
                          className="flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5"
                          style={{
                            border: active
                              ? '1px solid var(--accent-violet)'
                              : '1px solid rgba(118, 148, 151, 0.35)',
                            backgroundColor: active
                              ? 'rgba(139, 92, 246, 0.18)'
                              : 'rgba(0, 0, 0, 0.22)',
                          }}
                        >
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px]"
                            style={{ color: active ? '#EAB308' : 'var(--text-muted)' }}
                          >
                            {rank.stars}
                            <Star size={9} fill="currentColor" />
                          </span>
                          <span
                            className="max-w-full truncate text-[11px] font-bold"
                            style={{ color: active ? '#FFFFFF' : 'var(--text-primary)' }}
                            title={rank.values.join(' · ')}
                          >
                            {rank.values.join(' · ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {t('team.noPartnerSkill')}
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
