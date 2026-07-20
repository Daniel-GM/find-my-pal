import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { Pal } from '@/data/pals';
import { PalIconImg } from './PalIconImg';
import { ElementBadge } from './ElementBadge';
import { WorkSuitabilityGrid } from './WorkSuitabilityGrid';

interface TargetPalBannerProps {
  pal: Pal;
  combinationCount: number;
  onChangePal: () => void;
  label?: string;
  countLabel?: string;
}

export function TargetPalBanner({
  pal,
  combinationCount,
  onChangePal,
  label = 'Target Pal',
  countLabel = 'Combinations',
}: TargetPalBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        background:
          'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '20px 24px',
        margin: '24px 24px 16px',
      }}
    >
      <div className="flex items-center gap-5">
        {/* Left: Pal Image with Change Pal button above */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onChangePal}
            className="flex items-center gap-1 text-[11px] font-medium transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={12} />
            Change Pal
          </button>
          <PalIconImg pal={pal} size="lg" borderColor="var(--accent-violet)" />
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="text-[11px] font-semibold uppercase"
            style={{
              color: 'var(--accent-violet)',
              letterSpacing: '0.08em',
            }}
          >
            {label}
          </span>
          <h2
            className="text-[24px] font-bold leading-tight mt-0.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {pal.name}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-[11px] font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {pal.number === 0 ? '???' : `#${String(pal.number).padStart(3, '0')}`}
            </span>
            {pal.elements.map((el) => (
              <ElementBadge key={el} element={el} />
            ))}
          </div>
        </div>

        {/* Center: Work Suitability */}
        <div className="flex flex-col items-center justify-center">
          <span
            className="text-[10px] font-semibold uppercase mb-1.5"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            Work Suitability
          </span>
          <WorkSuitabilityGrid pal={pal} />
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <div
              className="text-[18px] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {pal.breedingPower}
            </div>
            <div
              className="text-[11px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Breeding Power
            </div>
          </div>
          <div className="text-center">
            <motion.div
              className="text-[18px] font-bold"
              style={{ color: 'var(--text-primary)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {combinationCount}
            </motion.div>
            <div
              className="text-[11px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {countLabel}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
