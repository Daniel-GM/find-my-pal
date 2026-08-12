import { useEffect, useState } from 'react';
import { Globe2, RefreshCw, UserRound, Users } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { AppState } from '@/hooks/useAppState';
import { useOptionalAuth } from '@/hooks/useAuth';
import { subscribeCommunityTeams } from '@/lib/community';
import type { PublishedTeam } from '@/lib/community';
import { CommunityTeamCard } from '@/components/community/CommunityTeamCard';

interface CommunityTeamsProps {
  appState: AppState;
}

export default function CommunityTeams({ appState }: CommunityTeamsProps) {
  const { t } = useTranslation();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const [teams, setTeams] = useState<PublishedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    return subscribeCommunityTeams((nextTeams, nextError) => {
      if (nextError) {
        setError(nextError);
        setLoading(false);
        return;
      }
      setError(null);
      setTeams(nextTeams);
      setLoading(false);
    });
  }, [retry]);

  return (
    <div>
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-4"
        style={{
          minHeight: 60,
          padding: '10px 24px',
          backgroundColor: 'var(--bg-base)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: 'var(--accent-violet)' }}>
            <Globe2 size={19} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
              {t('community.title')}
            </h1>
            <p className="text-[13px] truncate" style={{ color: 'var(--text-secondary)' }}>
              {t('community.subtitle')} {teams.length ? `· ${teams.length}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => appState.setView('profile')}
          className="flex items-center gap-2 shrink-0 text-[13px] font-medium transition-all duration-150 hover:scale-[1.02]"
          style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <UserRound size={15} />
          {t('community.myProfile')}
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" aria-label={t('app.loading')}>
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <RefreshCw size={42} style={{ color: 'var(--text-muted)' }} />
            <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>{t('community.loadFailed')}</p>
            <button
              onClick={() => setRetry((value) => value + 1)}
              className="flex items-center gap-2 text-[13px] font-medium"
              style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: 'var(--accent-violet)', color: '#fff' }}
            >
              <RefreshCw size={14} />
              {t('app.confirm')}
            </button>
          </div>
        ) : !teams.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Users size={58} style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
            <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('community.empty')}</h2>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{t('community.subtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {teams.map((team, index) => (
              <CommunityTeamCard key={team.id} team={team} index={index} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
