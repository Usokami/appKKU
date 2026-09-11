import { Subject } from '../shared/types';
import { buildCardFrame } from '../shared/tarotArt';

export function renderTarotCard(
  subject: Subject,
  options: { showToggle?: boolean; showDelete?: boolean } = {},
): HTMLElement {
  const frame = buildCardFrame(subject.cardOrder, subject.icon, subject.colorHex);
  const card = document.createElement('div');
  card.className = 'tarot-card';
  if (!subject.inRoulettePool) card.classList.add('out-of-pool');
  card.style.setProperty('--card-border', frame.borderColor);
  card.style.setProperty('--card-glow', frame.glowColor);

  card.innerHTML = `
    <span class="corner tl">${frame.romanNumeral}</span>
    <span class="numeral">${frame.romanNumeral}</span>
    <span class="glyph">${frame.glyph}</span>
    <span class="title">${escapeHtml(subject.title)}</span>
    <span class="minutes">${subject.totalMinutesStudied} min studied</span>
    <span class="corner br">${frame.romanNumeral}</span>
    ${options.showDelete ? '<button type="button" class="card-delete-btn" title="Burn this card">✕</button>' : ''}
  `;

  if (options.showToggle) {
    card.title = subject.inRoulettePool ? 'Click to remove from the Roulette pool' : 'Click to add to the Roulette pool';
  }

  return card;
}

export function renderCardBack(): HTMLElement {
  const card = document.createElement('div');
  card.className = 'tarot-card';
  card.style.setProperty('--card-border', '#d4af6a');
  card.innerHTML = `<span class="glyph">✦</span>`;
  return card;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
