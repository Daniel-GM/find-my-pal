import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Globe2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import type { Team } from '@/hooks/useAppState';
import { SKILL_CATEGORIES } from '@/data/partnerSkills';
import type { SkillCategory } from '@/data/partnerSkills';
import { CategoryBadge } from '@/components/builds/CategoryBadge';
import type { PublishedTeam } from '@/lib/community';
import {
  CommunityError,
  countPublications,
  getUserProfile,
  MAX_DESCRIPTION_LENGTH,
  MAX_PUBLICATIONS,
  publishTeam,
  saveUserNick,
  updatePublication,
  validateNick,
} from '@/lib/community';
import { encodeTeam } from '@/lib/team-share';
import type { User } from 'firebase/auth';

interface PublishTeamDialogProps {
  isOpen: boolean;
  team: Team | null;
  user: User | null;
  publication?: PublishedTeam | null;
  onClose: () => void;
  onPublished: (publishId: string) => void;
}

function errorMessage(error: unknown, t: ReturnType<typeof useTranslation>['t']): string {
  if (!(error instanceof CommunityError)) return t('community.publishFailed');
  switch (error.code) {
    case 'LIMIT_REACHED':
      return t('community.limitReached', { max: MAX_PUBLICATIONS });
    case 'INVALID_NICK':
      return t('community.nickInvalid');
    case 'INVALID_NAME':
      return t('community.nameRequired');
    case 'INVALID_DESCRIPTION':
      return t('community.descriptionRequired');
    case 'INVALID_TAGS':
      return t('community.tagsRequired');
    default:
      return t('community.publishFailed');
  }
}

export function PublishTeamDialog({
  isOpen,
  team,
  user,
  publication,
  onClose,
  onPublished,
}: PublishTeamDialogProps) {
  const { t } = useTranslation();
  const isEditing = Boolean(publication);
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<SkillCategory[]>([]);
  const [nick, setNick] = useState('');
  const [publicationCount, setPublicationCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !team) return;
    setTeamName(publication?.teamName || team.name);
    setDescription(publication?.description || '');
    setTags(publication?.tags || []);
    setNick(user?.displayName?.trim() || '');
    setPublicationCount(0);
    let cancelled = false;
    if (user) {
      void Promise.all([countPublications(user.uid), getUserProfile(user.uid)])
        .then(([count, profile]) => {
          if (cancelled) return;
          setPublicationCount(count);
          if (profile?.nick) setNick(profile.nick);
        })
        .catch(() => {
          if (!cancelled) toast.error(t('community.loadFailed'));
        });
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen, team, publication, user, t]);

  const toggleTag = (tag: SkillCategory) => {
    setTags((current) => {
      if (current.includes(tag)) return current.filter((item) => item !== tag);
      if (current.length >= 3) {
        toast.info(t('community.tagsLimit'));
        return current;
      }
      return [...current, tag];
    });
  };

  const handleSubmit = async () => {
    if (!team || !user) {
      toast.error(t('community.loginRequired'));
      return;
    }
    if (!teamName.trim()) {
      toast.error(t('community.nameRequired'));
      return;
    }
    if (!description.trim()) {
      toast.error(t('community.descriptionRequired'));
      return;
    }
    if (!tags.length) {
      toast.error(t('community.tagsRequired'));
      return;
    }
    try {
      validateNick(nick);
    } catch {
      toast.error(t('community.nickInvalid'));
      return;
    }

    setLoading(true);
    try {
      await saveUserNick(user.uid, nick);
      const publishId = isEditing && publication
        ? (await updatePublication(publication.id, {
            teamName,
            description,
            tags,
            teamData: encodeTeam(team),
          }), publication.id)
        : await publishTeam(user, { ...team, name: teamName.trim() }, { teamName, description, tags });
      onPublished(publishId);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 16,
              border: '1px solid var(--border-subtle)',
              padding: 24,
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ backgroundColor: 'rgba(139,92,246,0.14)', color: 'var(--accent-violet)' }}
                >
                  <Globe2 size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    {isEditing ? t('community.updatePublication') : t('community.publish')}
                  </h2>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {t('community.publishLimitInfo', { count: publicationCount, max: MAX_PUBLICATIONS })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)' }}
                aria-label={t('app.close')}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {t('community.nameLabel')}
                </span>
                <input
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  maxLength={50}
                  className="w-full text-[14px] outline-none"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {t('community.descriptionLabel')}
                  <span style={{ color: description.length > MAX_DESCRIPTION_LENGTH ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={3}
                  placeholder={t('community.descriptionPlaceholder')}
                  className="w-full resize-none text-[14px] outline-none"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {t('community.tagsLabel')}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{tags.length}/3</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SKILL_CATEGORIES.map((tag) => {
                    const selected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="transition-all duration-150"
                        style={{
                          borderRadius: 7,
                          outline: selected ? '2px solid var(--accent-violet)' : '2px solid transparent',
                          opacity: selected ? 1 : 0.72,
                        }}
                        aria-pressed={selected}
                      >
                        <CategoryBadge category={tag} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {t('community.nickLabel')}
                </span>
                <input
                  value={nick}
                  onChange={(event) => setNick(event.target.value)}
                  maxLength={20}
                  placeholder={t('community.nickPlaceholder')}
                  className="w-full text-[14px] outline-none"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="text-[13px] font-medium"
                style={{ padding: '9px 16px', borderRadius: 8, color: 'var(--text-secondary)' }}
              >
                {t('app.cancel')}
              </button>
              <button
                onClick={() => void handleSubmit()}
                disabled={loading || !team || !user || !teamName.trim() || !description.trim() || !tags.length || (!isEditing && publicationCount >= MAX_PUBLICATIONS)}
                className="flex items-center gap-2 text-[13px] font-semibold disabled:opacity-50"
                style={{ padding: '9px 16px', borderRadius: 8, backgroundColor: 'var(--accent-violet)', color: '#fff' }}
              >
                <Check size={15} />
                {isEditing ? t('community.updatePublication') : t('community.publish')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
