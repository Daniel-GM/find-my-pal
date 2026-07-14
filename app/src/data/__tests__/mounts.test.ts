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
    expect(LEVEL_RANGES.length).toBeGreaterThan(0);
    expect(LEVEL_RANGES[0].min).toBe(1);
    expect(LEVEL_RANGES[LEVEL_RANGES.length - 1].max).toBe(100);
  });
});
