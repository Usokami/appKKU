import { Subject, TarotIcon } from '../../shared/types';
import { TAROT_ICONS, TAROT_ICON_SYMBOLS } from '../../shared/tarotArt';
import { renderTarotCard } from '../cardElement';

export async function renderSubjectLibrary(root: HTMLElement): Promise<void> {
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h2>The Grimoire</h2>
    <p class="hint">Inscribe your subjects as cards, then choose which join the Roulette pool.</p>
    <div class="form-row">
      <input type="text" id="subject-title" placeholder="Subject name" maxlength="40" />
      <input type="color" id="subject-color" value="#8a4fd6" />
      <div class="icon-picker" id="icon-picker"></div>
      <button class="mystic-btn" id="add-subject-btn">Inscribe Card</button>
    </div>
    <div id="error-slot"></div>
    <div class="card-grid" id="subject-grid"></div>
  `;
  root.appendChild(panel);

  let selectedIcon: TarotIcon = 'star';
  const iconPicker = panel.querySelector('#icon-picker') as HTMLElement;
  TAROT_ICONS.forEach((icon) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = TAROT_ICON_SYMBOLS[icon];
    btn.title = icon;
    if (icon === selectedIcon) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      selectedIcon = icon;
      iconPicker.querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    iconPicker.appendChild(btn);
  });

  const grid = panel.querySelector('#subject-grid') as HTMLElement;
  const errorSlot = panel.querySelector('#error-slot') as HTMLElement;

  async function refreshGrid(): Promise<void> {
    const subjects = await window.tarotApi.subjects.list();
    grid.innerHTML = '';
    subjects.forEach((subject) => {
      const card = renderTarotCard(subject, { showToggle: true });
      card.addEventListener('click', async () => {
        await window.tarotApi.subjects.togglePool(subject.id, !subject.inRoulettePool);
        refreshGrid();
      });
      grid.appendChild(card);
    });
    if (subjects.length === 0) {
      grid.innerHTML = '<p class="hint">No cards inscribed yet. Add your first subject above.</p>';
    }
  }

  panel.querySelector('#add-subject-btn')!.addEventListener('click', async () => {
    const titleInput = panel.querySelector('#subject-title') as HTMLInputElement;
    const colorInput = panel.querySelector('#subject-color') as HTMLInputElement;
    const title = titleInput.value.trim();
    errorSlot.innerHTML = '';
    if (!title) {
      errorSlot.innerHTML = '<div class="error-banner">Give the card a name first.</div>';
      return;
    }
    await window.tarotApi.subjects.create(title, colorInput.value, selectedIcon);
    titleInput.value = '';
    refreshGrid();
  });

  await refreshGrid();
}
