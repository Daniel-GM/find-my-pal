import { useEffect, useState } from 'react';
import { Globe2, LogIn, Package, Save, Swords, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import type { AppState } from '@/hooks/useAppState';
import { useOptionalAuth } from '@/hooks/useAuth';
import {
  countPublications,
  getUserProfile,
  listMyPublications,
  MAX_PUBLICATIONS,
  saveUserNick,
  unpublishTeam,
} from '@/lib/community';
import type { PublishedTeam } from '@/lib/community';

interface ProfileProps {
  appState: AppState;
}

export default function Profile({ appState }: ProfileProps) {
  const { t } = useTranslation();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const [nick, setNick] = useState('');
  const [publications, setPublications] = useState<PublishedTeam[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingNick, setSavingNick] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    void Promise.all([
      getUserProfile(user.uid),
      countPublications(user.uid),
      listMyPublications(user.uid),
    ])
      .then(([profile, count, nextPublications]) => {
        if (cancelled) return;
        setNick(profile?.nick || user.displayName?.trim() || '');
        setPublishedCount(count);
        setPublications(nextPublications);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          toast.error(t('profile.loadFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, t]);

  const handleSaveNick = async () => {
    if (!user) return;
    setSavingNick(true);
    try {
      const saved = await saveUserNick(user.uid, nick);
      setNick(saved);
      toast.success(t('profile.nickSaved'));
    } catch {
      toast.error(t('community.nickInvalid'));
    } finally {
      setSavingNick(false);
    }
  };

  const handleRemove = async (publication: PublishedTeam) => {
    if (!window.confirm(t('community.unpublishConfirm'))) return;
    setRemovingId(publication.id);
    try {
      await unpublishTeam(publication.id);
      setPublications((items) => items.filter((item) => item.id !== publication.id));
      setPublishedCount((count) => Math.max(0, count - 1));
      toast.success(t('community.unpublished'));
    } catch {
      toast.error(t('community.unpublishFailed'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <div
        className="sticky top-0 z-10 flex items-center gap-3"
        style={{
          minHeight: 60,
          padding: '10px 24px',
          backgroundColor: 'var(--bg-base)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: 'var(--accent-violet)' }}>
          <UserRound size={19} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{t('profile.title')}</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{t('profile.subtitle')}</p>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: 980 }}>
        {!user ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <LogIn size={56} style={{ color: 'var(--text-muted)', opacity: 0.45 }} />
            <h2 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('community.loginRequired')}</h2>
            <button
              onClick={() => void auth?.signInWithGoogle()}
              className="flex items-center gap-2 text-[13px] font-medium"
              style={{ padding: '9px 16px', borderRadius: 8, backgroundColor: 'var(--accent-violet)', color: '#fff' }}
            >
              <LogIn size={15} />
              {t('auth.signInGoogle')}
            </button>
          </div>
        ) : loading ? (
          <div className="h-64 animate-pulse" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 14 }} aria-label={t('app.loading')} />
        ) : error ? (
          <p className="py-16 text-center text-[14px]" style={{ color: 'var(--text-secondary)' }}>{t('profile.loadFailed')}</p>
        ) : (
          <>
            <section className="p-5 mb-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
                <label className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('profile.nick')}</span>
                  <input
                    value={nick}
                    onChange={(event) => setNick(event.target.value)}
                    maxLength={20}
                    placeholder={t('profile.nickPlaceholder')}
                    className="w-full text-[14px] outline-none"
                    style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </label>
                <button
                  onClick={() => void handleSaveNick()}
                  disabled={savingNick || !nick.trim()}
                  className="flex items-center gap-2 text-[13px] font-semibold disabled:opacity-50"
                  style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--accent-violet)', color: '#fff' }}
                >
                  <Save size={15} />
                  {t('profile.saveNick')}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <OverviewItem icon={UserRound} label={t('profile.nick')} value={nick || t('profile.nickRequired')} />
                <OverviewItem icon={Package} label={t('profile.packagesCount')} value={String(appState.packages.length)} />
                <OverviewItem icon={Swords} label={t('profile.teamsCount')} value={String(appState.teams.length)} />
                <OverviewItem icon={Globe2} label={t('profile.publishedCount')} value={String(publishedCount)} />
              </div>
            </section>

            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>{t('profile.myPublications')}</h2>
              <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {t('community.publishLimitInfo', { count: publishedCount, max: MAX_PUBLICATIONS })}
              </span>
            </div>

            {!publications.length ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--text-secondary)' }}>
                <Users size={42} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <p className="text-[13px]">{t('profile.noPublications')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {publications.map((publication) => (
                  <div key={publication.id} className="flex items-center gap-3 p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{publication.teamName}</h3>
                      <p className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>{publication.description}</p>
                    </div>
                    <button
                      onClick={() => void handleRemove(publication)}
                      disabled={removingId === publication.id}
                      className="shrink-0 text-[12px] font-semibold disabled:opacity-50"
                      style={{ padding: '8px 10px', borderRadius: 7, color: 'var(--accent-red)', backgroundColor: 'rgba(248,113,113,0.1)' }}
                    >
                      {t('profile.removePublication')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function OverviewItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--text-muted)' }}>
        <Icon size={14} />
        <span className="text-[11px] truncate">{label}</span>
      </div>
      <div className="text-[18px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
