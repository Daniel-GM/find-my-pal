import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from 'firebase/auth';
import { useTranslation } from '@/i18n';
import { PALS } from '@/data/pals';
import PalImage from '@/components/PalImage';
import { CategoryBadge } from '@/components/builds/CategoryBadge';
import { BUILD_ICON_COLORS, EASE_BEZIER } from '@/components/builds/constants';
import { decodeTeam } from '@/lib/team-share';
import type { PublishedTeam, VoteValue } from '@/lib/community';
import { getMyVote, getVoteTransition, vote } from '@/lib/community';

interface CommunityTeamCardProps {
  team: PublishedTeam;
  index: number;
  user: User | null;
}

export function CommunityTeamCard({ team, index, user }: CommunityTeamCardProps) {
  const { t } = useTranslation();
  const color = BUILD_ICON_COLORS[index % BUILD_ICON_COLORS.length];
  const [likes, setLikes] = useState(team.likes);
  const [dislikes, setDislikes] = useState(team.dislikes);
  const [myVote, setMyVote] = useState<VoteValue | null>(null);
  const [voting, setVoting] = useState(false);
  const decoded = useMemo(() => decodeTeam(team.teamData), [team.teamData]);
  const pals = useMemo(
    () => (decoded?.slots || [])
      .filter((slot) => slot.palId)
      .map((slot) => PALS.find((pal) => pal.id === slot.palId))
      .filter((pal): pal is (typeof PALS)[number] => Boolean(pal)),
    [decoded],
  );

  useEffect(() => {
    setLikes(team.likes);
    setDislikes(team.dislikes);
  }, [team.likes, team.dislikes]);

  useEffect(() => {
    let cancelled = false;
    setMyVote(null);
    if (user) {
      void getMyVote(team.id, user.uid)
        .then((value) => {
          if (!cancelled) setMyVote(value);
        })
        .catch(() => {
          if (!cancelled) setMyVote(null);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [team.id, user]);

  const handleOpen = () => {
    window.location.hash = `#team=${team.teamData}`;
  };

  const handleVote = async (selected: VoteValue) => {
    if (!user) {
      toast.error(t('community.loginRequired'));
      return;
    }
    if (voting) return;
    const previous = { likes, dislikes, myVote };
    const transition = getVoteTransition(myVote, selected);
    setLikes((value) => Math.max(0, value + transition.likesDelta));
    setDislikes((value) => Math.max(0, value + transition.dislikesDelta));
    setMyVote(transition.next);
    setVoting(true);
    try {
      const result = await vote(team.id, user.uid, selected);
      setMyVote(result);
    } catch {
      setLikes(previous.likes);
      setDislikes(previous.dislikes);
      setMyVote(previous.myVote);
      toast.error(t('community.voteFailed'));
    } finally {
      setVoting(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: EASE_BEZIER }}
      className="flex flex-col gap-3 p-4 cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') handleOpen();
      }}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 14,
        border: '1px solid var(--border-subtle)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = 'var(--accent-violet)';
        event.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)';
        event.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'var(--border-subtle)';
        event.currentTarget.style.boxShadow = 'none';
        event.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: color.bg }}>
          <Users size={20} style={{ color: color.icon }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {team.teamName}
          </h3>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
            {t('community.byAuthor', { nick: team.authorNick })}
          </p>
        </div>
      </div>

      <p className="text-[12px] leading-relaxed min-h-[2.25rem]" style={{ color: 'var(--text-secondary)' }}>
        {team.description}
      </p>

      <div className="flex items-center gap-1 min-h-8">
        {pals.slice(0, 5).map((pal) => (
          <PalImage key={pal.id} iconName={pal.iconName} name={pal.name} size="sm" />
        ))}
        {pals.length > 5 && (
          <span
            className="text-[10px] font-semibold flex items-center justify-center rounded-full"
            style={{ width: 28, height: 28, backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}
          >
            +{pals.length - 5}
          </span>
        )}
        {!pals.length && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('community.noTeamPals')}</span>}
      </div>

      <div className="flex flex-wrap gap-1 min-h-5">
        {team.tags.slice(0, 3).map((tag) => <CategoryBadge key={tag} category={tag} />)}
      </div>

      <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={(event) => {
            event.stopPropagation();
            void handleVote(1);
          }}
          disabled={voting}
          className="flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-1 transition-colors disabled:opacity-60"
          style={{ color: myVote === 1 ? 'var(--accent-violet)' : 'var(--text-secondary)', backgroundColor: myVote === 1 ? 'rgba(139,92,246,0.12)' : 'transparent' }}
          aria-label="Like"
        >
          <ThumbsUp size={14} fill={myVote === 1 ? 'currentColor' : 'none'} />
          {likes}
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            void handleVote(-1);
          }}
          disabled={voting}
          className="flex items-center gap-1 text-[11px] font-semibold rounded-md px-2 py-1 transition-colors disabled:opacity-60"
          style={{ color: myVote === -1 ? 'var(--accent-red)' : 'var(--text-secondary)', backgroundColor: myVote === -1 ? 'rgba(248,113,113,0.12)' : 'transparent' }}
          aria-label="Dislike"
        >
          <ThumbsDown size={14} fill={myVote === -1 ? 'currentColor' : 'none'} />
          {dislikes}
        </button>
        <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>#team</span>
      </div>
    </motion.article>
  );
}
