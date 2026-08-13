import { useState } from 'react';
import { Plus, Star, X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { PALS } from '@/data/pals';
import type { Pal } from '@/data/pals';
import { ElementBadge } from '@/components/breeding';
import { findPassiveById } from '@/data/passives';
import { findActiveSkillById } from '@/data/activeSkills';
import { MAX_SLOT_ACTIVE_SKILLS, MAX_SLOT_PASSIVES } from '@/hooks/useAppState';
import type { TeamSlot } from '@/hooks/useAppState';
import { PalPickerDialog } from './PalPickerDialog';
import { PassivePickerDialog } from './PassivePickerDialog';
import { PassiveChip } from './PassiveChip';
import { ActiveSkillPickerDialog } from './ActiveSkillPickerDialog';
import { ActiveSkillChip } from './ActiveSkillChip';
import { PartnerSkillHoverCard } from './PartnerSkillHoverCard';
import { PalDetailDialog } from '@/components/pals/PalDetailDialog';

interface TeamSlotCardProps {
  slot: TeamSlot;
  onPalChange: (palId: string | null) => void;
  onStarsChange: (stars: number) => void;
  onTogglePassive: (passiveId: string) => void;
  onToggleActiveSkill: (activeSkillId: string) => void;
  /** Hides all editing affordances (pickers, remove buttons, star clicks). */
  readOnly?: boolean;
}

export function TeamSlotCard({
  slot,
  onPalChange,
  onStarsChange,
  onTogglePassive,
  onToggleActiveSkill,
  readOnly = false,
}: TeamSlotCardProps) {
  const { t } = useTranslation();
  const [showPalPicker, setShowPalPicker] = useState(false);
  const [showPassivePicker, setShowPassivePicker] = useState(false);
  const [showActiveSkillPicker, setShowActiveSkillPicker] = useState(false);
  const pal = slot.palId ? PALS.find((p) => p.id === slot.palId) || null : null;
  const [selectedPal, setSelectedPal] = useState<Pal | null>(null);

  if (!pal) {
    if (readOnly) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-2"
          style={{
            minHeight: 220,
            borderRadius: 14,
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          <span className="text-[13px] font-medium">{t('team.emptySlot')}</span>
        </div>
      );
    }
    return (
      <>
        <button
          onClick={() => setShowPalPicker(true)}
          className="flex flex-col items-center justify-center gap-2 transition-all duration-150"
          style={{
            minHeight: 220,
            borderRadius: 14,
            backgroundColor: 'var(--bg-surface)',
            border: '2px dashed var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-violet)';
            e.currentTarget.style.color = 'var(--accent-violet)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Plus size={28} />
          <span className="text-[13px] font-medium">{t('team.emptySlot')}</span>
        </button>
        <PalPickerDialog
          isOpen={showPalPicker}
          onSelect={onPalChange}
          onClose={() => setShowPalPicker(false)}
        />
      </>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Pal header */}
      <div className="flex items-start gap-3">
        <PartnerSkillHoverCard
          pal={pal}
          stars={slot.stars}
          onPalClick={setSelectedPal}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {pal.name}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {pal.number === 0 ? '???' : `#${String(pal.number).padStart(3, '0')}`}
          </div>
          <div className="flex gap-1 mt-1">
            {pal.elements.map((el) => (
              <ElementBadge key={el} element={el} />
            ))}
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => onPalChange(null)}
            className="flex items-center justify-center rounded-lg transition-all duration-150 hover:scale-110 shrink-0"
            style={{ width: 28, height: 28, backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            title={t('team.removePal')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Change pal */}
      {!readOnly && (
        <button
          onClick={() => setShowPalPicker(true)}
          className="text-[11px] font-medium self-start transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('team.selectPal')}...
        </button>
      )}

      {/* Stars (condensation level 0-4) */}
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => {
          const active = i < slot.stars;
          return (
            <button
              key={i}
              onClick={() => onStarsChange(slot.stars === i + 1 ? i : i + 1)}
              disabled={readOnly}
              className={readOnly ? '' : 'transition-all duration-100 hover:scale-125'}
              style={readOnly ? { cursor: 'default' } : undefined}
              title={`${i + 1}`}
            >
              <Star
                size={18}
                color={active ? '#EAB308' : 'var(--text-muted)'}
                fill={active ? '#EAB308' : 'none'}
              />
            </button>
          );
        })}
      </div>

      {/* Active skills */}
      <div>
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}
        >
          {t('team.activeSkills')}
        </span>
        <div className="mt-1.5 flex flex-col gap-1">
          {slot.activeSkillIds.map((activeSkillId) => {
            const skill = findActiveSkillById(activeSkillId);
            if (!skill) return null;
            return (
              <ActiveSkillChip
                key={activeSkillId}
                skill={skill}
                onRemove={readOnly ? undefined : () => onToggleActiveSkill(activeSkillId)}
              />
            );
          })}
          {!readOnly && slot.activeSkillIds.length < MAX_SLOT_ACTIVE_SKILLS && (
            <button
              type="button"
              onClick={() => setShowActiveSkillPicker(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-all duration-150"
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = 'var(--accent-violet)';
                event.currentTarget.style.color = 'var(--accent-violet)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = 'var(--border-subtle)';
                event.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <Plus size={12} />
              {t('team.selectActiveSkill')}
            </button>
          )}
        </div>
      </div>

      {/* Passives */}
      <div>
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}
        >
          {t('team.passives')}
        </span>
        <div className="flex flex-col gap-1 mt-1.5">
          {slot.passiveIds.map((passiveId) => {
            const passive = findPassiveById(passiveId);
            if (!passive) return null;
            return (
              <PassiveChip
                key={passiveId}
                passive={passive}
                onRemove={readOnly ? undefined : () => onTogglePassive(passiveId)}
              />
            );
          })}
          {!readOnly && slot.passiveIds.length < MAX_SLOT_PASSIVES && (
            <button
              onClick={() => setShowPassivePicker(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium transition-all duration-150"
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-violet)';
                e.currentTarget.style.color = 'var(--accent-violet)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <Plus size={12} />
              {t('team.selectPassive')}
            </button>
          )}
        </div>
      </div>

      {!readOnly && (
        <>
          <PalPickerDialog
            isOpen={showPalPicker}
            onSelect={onPalChange}
            onClose={() => setShowPalPicker(false)}
          />
          <PassivePickerDialog
            isOpen={showPassivePicker}
            selectedIds={slot.passiveIds}
            onToggle={onTogglePassive}
            onClose={() => setShowPassivePicker(false)}
          />
          <ActiveSkillPickerDialog
            isOpen={showActiveSkillPicker}
            selectedIds={slot.activeSkillIds}
            onToggle={onToggleActiveSkill}
            onClose={() => setShowActiveSkillPicker(false)}
          />
        </>
      )}
      <PalDetailDialog
        pal={selectedPal}
        onOpenChange={(open) => {
          if (!open) setSelectedPal(null);
        }}
      />
    </div>
  );
}
