import { describe, it, expect } from 'vitest';
import { ELEMENTS, ELEMENT_COLORS, getElementColor, getElementBg, type PalElement } from '@/lib/elements';

describe('elements', () => {
  it('contains all expected elements', () => {
    expect(ELEMENTS).toContain('neutral');
    expect(ELEMENTS).toContain('fire');
    expect(ELEMENTS).toContain('dragon');
  });

  it('returns a color for every known element', () => {
    for (const element of ELEMENTS) {
      expect(getElementColor(element)).toBe(ELEMENT_COLORS[element].color);
    }
  });

  it('returns a background for every known element', () => {
    for (const element of ELEMENTS) {
      expect(getElementBg(element)).toBe(ELEMENT_COLORS[element].bg);
    }
  });

  it('falls back to neutral values for unknown elements', () => {
    expect(getElementColor('unknown' as PalElement)).toBe('#B8B8C8');
    expect(getElementBg('unknown' as PalElement)).toBe('rgba(184,184,200,0.15)');
  });
});
