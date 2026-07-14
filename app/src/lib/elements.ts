export type PalElement = 'neutral' | 'fire' | 'water' | 'grass' | 'electric' | 'ice' | 'ground' | 'dark' | 'dragon';

export const ELEMENTS: PalElement[] = ['neutral', 'fire', 'water', 'grass', 'electric', 'ice', 'ground', 'dark', 'dragon'];

export const ELEMENT_COLORS: Record<PalElement, { color: string; bg: string }> = {
  neutral:  { color: '#B8B8C8', bg: 'rgba(184,184,200,0.15)' },
  fire:     { color: '#F08030', bg: 'rgba(240,128,48,0.15)' },
  water:    { color: '#6890F0', bg: 'rgba(104,144,240,0.15)' },
  grass:    { color: '#78C850', bg: 'rgba(120,200,80,0.15)' },
  electric: { color: '#F8D030', bg: 'rgba(248,208,48,0.15)' },
  ice:      { color: '#98D8D8', bg: 'rgba(152,216,216,0.15)' },
  ground:   { color: '#E0C068', bg: 'rgba(224,192,104,0.15)' },
  dark:     { color: '#705848', bg: 'rgba(112,88,72,0.15)' },
  dragon:   { color: '#7038F8', bg: 'rgba(112,56,248,0.15)' },
};

export function getElementColor(element: PalElement): string {
  return ELEMENT_COLORS[element]?.color || '#B8B8C8';
}

export function getElementBg(element: PalElement): string {
  return ELEMENT_COLORS[element]?.bg || 'rgba(184,184,200,0.15)';
}
