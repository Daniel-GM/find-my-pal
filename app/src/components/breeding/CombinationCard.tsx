import { motion } from 'framer-motion';
import { Bookmark, Check } from 'lucide-react';
import type { PalElement } from '@/data/pals';
import type { BreedingCombination } from '@/lib/breeding';
import { PalIconImg } from './PalIconImg';
import { ElementBadge } from './ElementBadge';
import { WorkSuitabilityGrid } from './WorkSuitabilityGrid';

const EASE_BEZIER = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

interface CombinationCardProps {
  combo: BreedingCombination;
  index: number;
  isSaved: boolean;
  isCompleted: boolean;
  onSave: (combo: BreedingCombination) => void;
  onComplete: (combo: BreedingCombination) => void;
}

export function CombinationCard({
  combo,
  index,
  isSaved,
  isCompleted,
  onSave,
  onComplete,
}: CombinationCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        delay: index * 0.03,
        duration: 0.25,
        ease: EASE_BEZIER,
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 4px 16px rgba(139,92,246,0.08)',
      }}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: 16,
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-violet)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      {/* Row 1: Action buttons - full width, right-aligned */}
      <div className="flex justify-end gap-1.5 mb-3">
        <motion.button
          whileTap={{ scale: 1.2 }}
          onClick={() => onSave(combo)}
          className="flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            width: 30,
            height: 30,
            backgroundColor: isSaved
              ? 'var(--accent-violet)'
              : 'var(--bg-hover)',
          }}
          title="Save to package"
        >
          <Bookmark
            size={14}
            color={isSaved ? '#FFFFFF' : 'var(--text-secondary)'}
            fill={isSaved ? '#FFFFFF' : 'none'}
          />
        </motion.button>
        <motion.button
          whileTap={{ scale: 1.2 }}
          onClick={() => onComplete(combo)}
          className="flex items-center justify-center rounded-full transition-all duration-150"
          style={{
            width: 30,
            height: 30,
            backgroundColor: isCompleted
              ? 'var(--accent-emerald)'
              : 'var(--bg-hover)',
          }}
          title="Mark as completed"
        >
          <Check
            size={14}
            color={isCompleted ? '#FFFFFF' : 'var(--text-secondary)'}
          />
        </motion.button>
      </div>

      {/* Row 2: Parents side by side, 50% each */}
      <div className="flex items-start gap-3">
        {/* Parent A - 50% */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <PalIconImg pal={combo.parentA} size="md" />
          <span
            className="text-[13px] font-semibold truncate w-full text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {combo.parentA.name}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {combo.parentA.number === 0
              ? '???'
              : `#${String(combo.parentA.number).padStart(3, '0')}`}
          </span>
          <div className="flex flex-wrap justify-center gap-1">
            {combo.parentA.elements.map((el: PalElement) => (
              <ElementBadge key={el} element={el} />
            ))}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
            BP: {combo.parentA.breedingPower}
          </span>
          <div className="flex justify-center">
            <WorkSuitabilityGrid pal={combo.parentA} />
          </div>
        </div>

        {/* Plus Divider */}
        <div className="flex flex-col items-center justify-center shrink-0 self-stretch">
          <div style={{ width: 1, flex: 1, backgroundColor: 'var(--border-subtle)' }} />
          <span className="text-[16px] font-light my-2" style={{ color: 'var(--text-muted)' }}>+</span>
          <div style={{ width: 1, flex: 1, backgroundColor: 'var(--border-subtle)' }} />
        </div>

        {/* Parent B - 50% */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <PalIconImg pal={combo.parentB} size="md" />
          <span
            className="text-[13px] font-semibold truncate w-full text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {combo.parentB.name}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {combo.parentB.number === 0
              ? '???'
              : `#${String(combo.parentB.number).padStart(3, '0')}`}
          </span>
          <div className="flex flex-wrap justify-center gap-1">
            {combo.parentB.elements.map((el: PalElement) => (
              <ElementBadge key={el} element={el} />
            ))}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
            BP: {combo.parentB.breedingPower}
          </span>
          <div className="flex justify-center">
            <WorkSuitabilityGrid pal={combo.parentB} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
