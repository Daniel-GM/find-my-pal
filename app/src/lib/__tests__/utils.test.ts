import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles conditional classes', () => {
    const isHidden = false;
    const isBlock = true;
    expect(cn('base', isHidden && 'hidden', isBlock && 'block')).toBe('base block');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
