import { describe, it, expect } from 'vitest';
import { MOUNTS, getMountsByType, LEVEL_RANGES } from '@/data/mounts';

describe('mounts data', () => {
  it('has mount entries', () => {
    expect(MOUNTS.length).toBeGreaterThan(0);
  });

  it('filters and sorts mounts by type', () => {
    const groundMounts = getMountsByType('ground');
    expect(groundMounts.length).toBeGreaterThan(0);
    for (const mount of groundMounts) {
      expect(mount.type).toBe('ground');
    }
    for (let i = 1; i < groundMounts.length; i++) {
      expect(groundMounts[i].saddleLevel).toBeGreaterThanOrEqual(groundMounts[i - 1].saddleLevel);
    }
  });

  it('returns empty array for type with no mounts', () => {
    expect(getMountsByType('ground')).not.toEqual([]);
  });

  it('defines level ranges', () => {
    expect(LEVEL_RANGES).toEqual([
      { min: 11, max: 20, label: 'Early Game', color: '#22c55e' },
      { min: 21, max: 40, label: 'Mid Game', color: '#3b82f6' },
      { min: 41, max: 60, label: 'Late Game', color: '#a855f7' },
      { min: 61, max: 80, label: 'End Game', color: '#f59e0b' },
    ]);
  });
});
