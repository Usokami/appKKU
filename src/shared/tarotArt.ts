import { TarotIcon } from './types';

const ROMAN_NUMERALS: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRomanNumeral(n: number): string {
  let value = Math.max(0, Math.round(n));
  if (value === 0) return '0';
  let result = '';
  for (const [amount, symbol] of ROMAN_NUMERALS) {
    while (value >= amount) {
      result += symbol;
      value -= amount;
    }
  }
  return result;
}

export const TAROT_ICON_SYMBOLS: Record<TarotIcon, string> = {
  star: '✦',
  moon: '☽',
  sun: '☀',
  cup: '◎',
  sword: '⚔',
  wand: 'ᚠ',
  coin: '◉',
};

export const TAROT_ICONS: TarotIcon[] = ['star', 'moon', 'sun', 'cup', 'sword', 'wand', 'coin'];

export interface CardFrameStyle {
  romanNumeral: string;
  glyph: string;
  borderColor: string;
  glowColor: string;
}

/** Lighten a #RRGGBB hex color by a 0-1 amount, for glow accents. */
export function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
  const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function buildCardFrame(cardOrder: number, icon: TarotIcon, colorHex: string): CardFrameStyle {
  return {
    romanNumeral: toRomanNumeral(cardOrder),
    glyph: TAROT_ICON_SYMBOLS[icon],
    borderColor: colorHex,
    glowColor: lightenHex(colorHex, 0.35),
  };
}
