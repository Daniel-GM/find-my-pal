import { useState } from 'react';
import { Check, Download, Link2Off, Loader2, Swords } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { AppState } from '@/hooks/useAppState';
import type { SharedTeam as SharedTeamData } from '@/lib/team-share';
import { TeamSlotCard, PlayerGearSection } from '@/components/team';

interface SharedTeamProps {
  appState: AppState;
  /** Decoded build; null means the share link was invalid. */
  team: SharedTeamData | null;
  /** Shows the loading state while a short link is resolved. */
  loading?: boolean;
  /** Clears the share hash and returns to the normal app. */
  onClose: () => void;
}

const noop = () => {};

export default function SharedTeam({ appState, team, loading = false, onClose }: SharedTeamProps) {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!team || saved) return;
    appState.importTeam({ name: team.name, slots: team.slots, player: team.player });
    setSaved(true);
    setTimeout(() => {
      onClose();
      appState.setView('team');
    }, 900);
  };

  return (
    <div>
      {/* Top Bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between"
        style={{
          height: 60,
          padding: '0 24px',
          backgroundColor: 'var(--bg-base)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[20px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {team ? team.name : t('team.sharedBuildTitle')}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {t('team.sharedBuildSubtitle')}
          </p>
        </div>
        {team && (
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center gap-2 text-[13px] font-medium transition-all duration-150 hover:scale-[1.02] disabled:opacity-80"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: saved ? '#22C55E' : 'var(--accent-violet)',
              color: '#FFFFFF',
            }}
          >
            {saved ? <Check size={16} /> : <Download size={16} />}
            {saved ? t('team.savedToDevice') : t('team.saveToDevice')}
          </button>
        )}
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'var(--text-secondary)' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-violet)' }} />
            <p className="text-[14px]">{t('team.loading')}</p>
          </div>
        ) : !team ? (
          /* Invalid link */
          <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'var(--text-secondary)' }}>
            <Link2Off size={64} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <h3 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('team.invalidShareTitle')}
            </h3>
            <p className="text-[14px] text-center" style={{ maxWidth: 400 }}>
              {t('team.invalidShareDesc')}
            </p>
            <button
              onClick={onClose}
              className="text-[13px] font-medium mt-2 transition-all duration-150 hover:scale-[1.02]"
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--accent-violet)',
                color: '#FFFFFF',
              }}
            >
              {t('team.backToApp')}
            </button>
          </div>
        ) : (
          <>
            {/* Pal slots */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
                marginBottom: 32,
              }}
            >
              {team.slots.map((slot, i) => (
                <TeamSlotCard
                  key={i}
                  slot={slot}
                  readOnly
                  onPalChange={noop}
                  onStarsChange={noop}
                  onTogglePassive={noop}
                  onToggleActiveSkill={noop}
                />
              ))}
            </div>

            {/* Character gear */}
            <PlayerGearSection
              player={team.player}
              readOnly
              onSetArmor={noop}
              onSetHelmet={noop}
              onToggleWeapon={noop}
              onToggleAccessory={noop}
              onToggleFood={noop}
            />

            <div className="flex justify-center mt-8">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-[13px] font-medium transition-all duration-150 hover:scale-[1.02]"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Swords size={15} />
                {t('team.backToApp')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
