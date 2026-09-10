import { AppContext } from '../context';

export async function renderFlexCard(root: HTMLElement, ctx: AppContext): Promise<void> {
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'panel';

  const [profile, mostStudied] = await Promise.all([
    window.tarotApi.profile.get(),
    window.tarotApi.subjects.mostStudiedTitle(),
  ]);

  const quest = profile.activeQuest;
  const pct = Math.min(100, Math.round((quest.currentMinutes / quest.targetMinutes) * 100));
  const justCompleted = ctx.state.lastQuestJustCompleted;
  ctx.state.lastQuestJustCompleted = false;

  panel.innerHTML = `
    <h2>Your Reading</h2>
    <div class="flex-card">
      <div class="points">${profile.totalFlexPoints} ✦</div>
      <div class="hint">Total Flex Points</div>
      <div class="stat-row">
        <div class="stat">
          <div class="label">Streak</div>
          <div class="value">${profile.streakDays} day${profile.streakDays === 1 ? '' : 's'}</div>
        </div>
        <div class="stat">
          <div class="label">Favored Subject</div>
          <div class="value">${mostStudied ? escapeHtml(mostStudied) : '—'}</div>
        </div>
        <div class="stat">
          <div class="label">Grind Tier</div>
          <div class="value">Tier ${quest.tier}</div>
        </div>
      </div>
      <div class="hint">${quest.currentMinutes} / ${quest.targetMinutes} min toward next Grind reward (+${quest.rewardPoints} pts)</div>
      <div class="quest-bar-track"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
      ${justCompleted ? '<div class="celebration">✦ Quest Completed! The stars have blessed your grind. ✦</div>' : ''}
    </div>
  `;
  root.appendChild(panel);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
