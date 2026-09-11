import { StudySession } from '../../shared/types';
import { AppContext } from '../context';

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export async function renderTimer(root: HTMLElement, ctx: AppContext): Promise<void> {
  const pending = ctx.state.pendingSession;
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'panel';

  if (!pending) {
    panel.innerHTML = `<h2>The Vigil</h2><p class="hint">Draw a card first from The Draw.</p>`;
    root.appendChild(panel);
    return;
  }

  panel.innerHTML = `
    <h2>The Vigil</h2>
    <div class="timer-display" id="timer-display">
      <div class="clock" id="clock">${formatClock(pending.targetMinutes * 60)}</div>
      <div class="subject-name">${escapeHtml(pending.subject.title)} — ${pending.timeMode === 'random' ? 'random draw' : 'manual'} · ${pending.targetMinutes} min</div>
    </div>
    <div class="actions-row">
      <button class="mystic-btn" id="pause-btn">Pause</button>
      <button class="mystic-btn danger" id="abandon-btn">Abandon</button>
    </div>
    <div id="result-slot"></div>
  `;
  root.appendChild(panel);

  const clockEl = panel.querySelector('#clock') as HTMLElement;
  const displayEl = panel.querySelector('#timer-display') as HTMLElement;
  const pauseBtn = panel.querySelector('#pause-btn') as HTMLButtonElement;
  const abandonBtn = panel.querySelector('#abandon-btn') as HTMLButtonElement;
  const resultSlot = panel.querySelector('#result-slot') as HTMLElement;

  const targetSeconds = pending.targetMinutes * 60;
  let elapsedSeconds = 0;
  let running = true;
  let finished = false;

  const session: StudySession = await window.tarotApi.sessions.start(
    pending.subject.id,
    pending.targetMinutes,
    pending.timeMode,
  );

  const interval = setInterval(() => {
    if (!running || finished) return;
    elapsedSeconds += 1;
    const remaining = Math.max(0, targetSeconds - elapsedSeconds);
    clockEl.textContent = formatClock(remaining);
    if (remaining <= 0) {
      finish('completed');
    }
  }, 1000);

  pauseBtn.addEventListener('click', () => {
    running = !running;
    pauseBtn.textContent = running ? 'Pause' : 'Resume';
    displayEl.classList.toggle('paused', !running);
  });

  abandonBtn.addEventListener('click', () => finish('abandoned'));

  async function finish(outcome: 'completed' | 'abandoned'): Promise<void> {
    if (finished) return;
    finished = true;
    clearInterval(interval);
    pauseBtn.disabled = true;
    abandonBtn.disabled = true;

    const actualMinutes = Math.round(elapsedSeconds / 60);
    const result = await window.tarotApi.sessions.finish(session.id, actualMinutes, outcome);

    ctx.state.lastQuestJustCompleted = result.questJustCompleted;
    ctx.state.pendingSession = null;
    ctx.refreshTabs();

    resultSlot.innerHTML = `
      <div class="hint">
        ${outcome === 'completed' ? 'The vigil is complete.' : 'You broke the vigil early.'}
        Earned <strong>${result.session.totalPoints}</strong> flex points.
      </div>
      <div class="actions-row">
        <button class="mystic-btn" id="view-flex-btn">View your Reading</button>
      </div>
    `;
    resultSlot.querySelector('#view-flex-btn')!.addEventListener('click', () => ctx.navigate('flex'));
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
