import { useState } from 'react';
import { Check, ChevronDown, Globe2, Pencil, Plus, Share2, Swords, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import type { AppState } from '@/hooks/useAppState';
import { encodeTeam } from '@/lib/team-share';
import { createShortLink } from '@/lib/share-links';
import { TeamSlotCard, PlayerGearSection } from '@/components/team';
import { PublishTeamDialog } from '@/components/community';
import { useOptionalAuth } from '@/hooks/useAuth';
import { getPublication, unpublishTeam } from '@/lib/community';
import type { PublishedTeam } from '@/lib/community';

interface TeamBuilderProps {
  appState: AppState;
}

export default function TeamBuilder({ appState }: TeamBuilderProps) {
  const { t } = useTranslation();
  const auth = useOptionalAuth();
  const {
    teams,
    activeTeamId,
    addTeam,
    deleteTeam,
    renameTeam,
    setActiveTeam,
    setSlotPal,
    setSlotStars,
    toggleSlotPassive,
    toggleSlotActiveSkill,
    setPlayerGearItem,
    togglePlayerWeapon,
    togglePlayerAccessory,
    togglePlayerFood,
    updateTeam,
  } = appState;

  const [nameInput, setNameInput] = useState('');
  // 'create' | 'rename' | null — which inline name form is open
  const [nameForm, setNameForm] = useState<'create' | 'rename' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [publicationDialogOpen, setPublicationDialogOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<PublishedTeam | null>(null);
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const [publicationActionLoading, setPublicationActionLoading] = useState(false);

  const activeTeam =
    teams.find((team) => team.id === activeTeamId) || teams[0] || null;

  const openCreateForm = () => {
    setNameInput('');
    setNameForm('create');
  };

  const openRenameForm = () => {
    if (!activeTeam) return;
    setNameInput(activeTeam.name);
    setNameForm('rename');
  };

  const handleSubmitName = () => {
    const name = nameInput.trim();
    if (!name) return;
    if (nameForm === 'create') {
      addTeam(name);
    } else if (nameForm === 'rename' && activeTeam) {
      renameTeam(activeTeam.id, name);
    }
    setNameInput('');
    setNameForm(null);
  };

  const handleDelete = () => {
    if (!activeTeam) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteTeam(activeTeam.id);
    setConfirmingDelete(false);
  };

  const handleShare = async () => {
    if (!activeTeam) return;
    const fullUrl = `${window.location.origin}${window.location.pathname}#team=${encodeTeam(activeTeam)}`;
    let url = fullUrl;

    if (auth?.user) {
      try {
        const shortId = await createShortLink(auth.user, activeTeam);
        url = `${window.location.origin}${window.location.pathname}#t=${shortId}`;
        toast.success(t('share.shortLinkCopied'));
      } catch {
        toast.error(t('share.createFailed'));
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard unavailable (non-secure context, denied permission): show the URL.
      window.prompt(t('team.share'), url);
    }
    if (!auth?.user) toast.info(t('share.shortLinkRequiresLogin'));
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const openPublicationDialog = async () => {
    if (!activeTeam) return;
    if (!auth?.user) {
      toast.error(t('community.loginRequired'));
      return;
    }

    setPublicationActionLoading(true);
    try {
      if (activeTeam.publishId) {
        const publication = await getPublication(activeTeam.publishId);
        if (!publication) {
          updateTeam(activeTeam.id, (team) => ({ ...team, publishId: undefined }));
          toast.info(t('community.unpublished'));
          return;
        }
        setEditingPublication(publication);
      } else {
        setEditingPublication(null);
      }
      setPublicationDialogOpen(true);
    } catch {
      toast.error(t('community.loadFailed'));
    } finally {
      setPublicationActionLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!activeTeam?.publishId) return;
    if (!confirmingUnpublish) {
      setConfirmingUnpublish(true);
      return;
    }
    setPublicationActionLoading(true);
    try {
      await unpublishTeam(activeTeam.publishId);
      updateTeam(activeTeam.id, (team) => ({ ...team, publishId: undefined }));
      setConfirmingUnpublish(false);
      toast.success(t('community.unpublished'));
    } catch {
      toast.error(t('community.unpublishFailed'));
    } finally {
      setPublicationActionLoading(false);
    }
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
            {t('team.title')}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            {t('team.subtitle')}
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 text-[13px] font-medium transition-all duration-150 hover:scale-[1.02]"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: 'var(--accent-violet)',
            color: '#FFFFFF',
          }}
        >
          <Plus size={16} />
          {t('team.newTeam')}
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Inline name form (create / rename) */}
        {nameForm && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t('team.teamNamePlaceholder')}
              maxLength={50}
              className="text-[14px] outline-none"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                minWidth: 280,
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitName();
                if (e.key === 'Escape') setNameForm(null);
              }}
            />
            <button
              onClick={handleSubmitName}
              disabled={!nameInput.trim()}
              className="flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-50"
              style={{ width: 36, height: 36, backgroundColor: 'var(--accent-violet)', color: '#FFFFFF' }}
              title={t('app.confirm')}
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => setNameForm(null)}
              className="flex items-center justify-center rounded-lg"
              style={{ width: 36, height: 36, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              title={t('app.cancel')}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!activeTeam ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'var(--text-secondary)' }}>
            <Swords size={64} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <h3 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('team.noTeams')}
            </h3>
            <p className="text-[14px] text-center" style={{ maxWidth: 400 }}>
              {t('team.noTeamsDesc')}
            </p>
            <button
              onClick={openCreateForm}
              className="text-[13px] font-medium mt-2 transition-all duration-150 hover:scale-[1.02]"
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--accent-violet)',
                color: '#FFFFFF',
              }}
            >
              {t('team.newTeam')}
            </button>
          </div>
        ) : (
          <>
            {/* Team management bar */}
            <div className="flex items-center gap-2 mb-5">
              <div className="relative">
                <select
                  value={activeTeam.id}
                  onChange={(e) => setActiveTeam(e.target.value)}
                  className="appearance-none cursor-pointer text-[14px] font-semibold pr-8 pl-3 transition-all duration-150 outline-none"
                  style={{
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    minWidth: 200,
                  }}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>

              <button
                onClick={openRenameForm}
                className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110"
                style={{ width: 38, height: 38, backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                title={t('team.rename')}
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => void handleShare()}
                className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 text-[11px] font-semibold"
                style={{
                  height: 38,
                  minWidth: 38,
                  padding: copiedShare ? '0 10px' : 0,
                  backgroundColor: copiedShare ? '#22C55E' : 'var(--bg-surface)',
                  color: copiedShare ? '#FFFFFF' : 'var(--text-secondary)',
                }}
                title={t('team.share')}
              >
                {copiedShare ? t('team.shareCopied') : <Share2 size={15} />}
              </button>
              {activeTeam.publishId ? (
                <>
                  <button
                    onClick={() => void openPublicationDialog()}
                    disabled={publicationActionLoading}
                    className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 disabled:opacity-60"
                    style={{ width: 38, height: 38, backgroundColor: 'var(--bg-surface)', color: 'var(--accent-violet)' }}
                    title={t('community.updatePublication')}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => void handleUnpublish()}
                    disabled={publicationActionLoading}
                    className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 text-[11px] font-semibold disabled:opacity-60"
                    style={{
                      height: 38,
                      minWidth: 38,
                      padding: confirmingUnpublish ? '0 10px' : 0,
                      backgroundColor: confirmingUnpublish ? '#EF4444' : 'var(--bg-surface)',
                      color: confirmingUnpublish ? '#FFFFFF' : 'var(--accent-red)',
                    }}
                    title={t('community.unpublishConfirm')}
                  >
                    {confirmingUnpublish ? t('community.unpublish') : <Trash2 size={15} />}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => void openPublicationDialog()}
                  disabled={publicationActionLoading}
                  className="flex items-center gap-2 rounded-lg transition-all duration-150 hover:scale-105 text-[11px] font-semibold px-3 disabled:opacity-60"
                  style={{ height: 38, backgroundColor: 'rgba(139,92,246,0.12)', color: 'var(--accent-violet)' }}
                  title={t('community.publish')}
                >
                  <Globe2 size={15} />
                  {t('community.publish')}
                </button>
              )}
              <button
                onClick={handleDelete}
                className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 text-[11px] font-semibold"
                style={{
                  height: 38,
                  minWidth: 38,
                  padding: confirmingDelete ? '0 10px' : 0,
                  backgroundColor: confirmingDelete ? '#EF4444' : 'var(--bg-surface)',
                  color: confirmingDelete ? '#FFFFFF' : 'var(--text-secondary)',
                }}
                title={t('team.deleteConfirm')}
              >
                {confirmingDelete ? t('app.confirm') : <Trash2 size={15} />}
              </button>
            </div>

            {/* Pal slots */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
                marginBottom: 32,
              }}
            >
              {activeTeam.slots.map((slot, i) => (
                <TeamSlotCard
                  key={i}
                  slot={slot}
                  onPalChange={(palId) => setSlotPal(activeTeam.id, i, palId)}
                  onStarsChange={(stars) => setSlotStars(activeTeam.id, i, stars)}
                  onTogglePassive={(passiveId) => toggleSlotPassive(activeTeam.id, i, passiveId)}
                  onToggleActiveSkill={(activeSkillId) =>
                    toggleSlotActiveSkill(activeTeam.id, i, activeSkillId)
                  }
                />
              ))}
            </div>

            {/* Character gear */}
            <PlayerGearSection
              player={activeTeam.player}
              onSetArmor={(id) => setPlayerGearItem(activeTeam.id, 'armorId', id)}
              onSetHelmet={(id) => setPlayerGearItem(activeTeam.id, 'helmetId', id)}
              onToggleWeapon={(id) => togglePlayerWeapon(activeTeam.id, id)}
              onToggleAccessory={(id) => togglePlayerAccessory(activeTeam.id, id)}
              onToggleFood={(id) => togglePlayerFood(activeTeam.id, id)}
            />
          </>
        )}
      </div>
      <PublishTeamDialog
        isOpen={publicationDialogOpen}
        team={activeTeam}
        user={auth?.user ?? null}
        publication={editingPublication}
        onClose={() => setPublicationDialogOpen(false)}
        onPublished={(publishId) => {
          if (!activeTeam) return;
          updateTeam(activeTeam.id, (team) => ({ ...team, publishId }));
          toast.success(editingPublication ? t('community.published') : t('community.published'));
        }}
      />
    </div>
  );
}
