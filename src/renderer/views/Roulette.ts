import { Subject, TimeMode } from '../../shared/types';
import { renderTarotCard, renderCardBack } from '../cardElement';
import { AppContext } from '../context';

export async function renderRoulette(root: HTMLElement, ctx: AppContext): Promise<void> {
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h2>The Draw</h2>
    <p class="hint">Spin the wheel of fate to reveal which subject calls to you.</p>
    <div class="roulette-stage" id="stage"></div>
    <div class="actions-row">
      <button class="mystic-btn" id="spin-btn">Spin the Wheel</button>
    </div>
    <div id="error-slot"></div>
    <div id="time-config" style="display:none;"></div>
  `;
  root.appendChild(panel);

  const stage = panel.querySelector('#stage') as HTMLElement;
  const errorSlot = panel.querySelector('#error-slot') as HTMLElement;
  const timeConfig = panel.querySelector('#time-config') as HTMLElement;
  stage.appendChild(renderCardBack());

  let drawnSubject: Subject | null = null;

  panel.querySelector('#spin-btn')!.addEventListener('click', async () => {
    errorSlot.innerHTML = '';
    timeConfig.style.display = 'none';
    stage.innerHTML = '';
    const back = renderCardBack();
    back.classList.add('spinning');
    stage.appendChild(back);

    let subject: Subject;
    try {
      subject = await window.tarotApi.roulette.spin();
    } catch (err) {
      stage.innerHTML = '';
      errorSlot.innerHTML = `<div class="error-banner">${(err as Error).message}</div>`;
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 900));
    drawnSubject = subject;
    stage.innerHTML = '';
    const card = renderTarotCard(subject);
    card.classList.add('drawn');
    stage.appendChild(card);

    renderTimeConfig(subject);
  });

  function renderTimeConfig(subject: Subject): void {
    timeConfig.style.display = 'block';
    timeConfig.innerHTML = `
      <div class="form-row">
        <select id="time-mode">
          <option value="manual">Manual duration</option>
          <option value="random">Random duration (+15% bonus)</option>
        </select>
        <select id="manual-minutes">
          ${[15, 25, 45, 60, 90, 120].map((m) => `<option value="${m}">${m} min</option>`).join('')}
        </select>
      </div>
      <div class="actions-row">
        <button class="mystic-btn" id="begin-btn">Begin the Vigil</button>
      </div>
    `;

    const modeSelect = timeConfig.querySelector('#time-mode') as HTMLSelectElement;
    const manualSelect = timeConfig.querySelector('#manual-minutes') as HTMLSelectElement;
    modeSelect.addEventListener('change', () => {
      manualSelect.style.display = modeSelect.value === 'manual' ? '' : 'none';
    });

    timeConfig.querySelector('#begin-btn')!.addEventListener('click', async () => {
      const mode = modeSelect.value as TimeMode;
      const manualMinutes = mode === 'manual' ? Number(manualSelect.value) : undefined;
      const targetMinutes = await window.tarotApi.roulette.generateTime(mode, manualMinutes);

      ctx.state.pendingSession = { subject, targetMinutes, timeMode: mode };
      ctx.navigate('timer');
    });
  }
}
