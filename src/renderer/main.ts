import { AppContext, AppState, ViewName } from './context';
import { renderSubjectLibrary } from './views/SubjectLibrary';
import { renderRoulette } from './views/Roulette';
import { renderTimer } from './views/Timer';
import { renderFlexCard } from './views/FlexCard';

const viewRoot = document.getElementById('view-root') as HTMLElement;
const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('#tab-nav .tab'));

const state: AppState = {
  pendingSession: null,
  lastQuestJustCompleted: false,
};

const ctx: AppContext = {
  navigate,
  refreshTabs: updateTabAvailability,
  state,
};

function updateTabAvailability(): void {
  const timerTab = tabButtons.find((b) => b.dataset.view === 'timer');
  if (timerTab) timerTab.disabled = !state.pendingSession;
}

async function navigate(view: ViewName): Promise<void> {
  tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  updateTabAvailability();

  switch (view) {
    case 'library':
      return renderSubjectLibrary(viewRoot);
    case 'roulette':
      return renderRoulette(viewRoot, ctx);
    case 'timer':
      return renderTimer(viewRoot, ctx);
    case 'flex':
      return renderFlexCard(viewRoot, ctx);
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    navigate(btn.dataset.view as ViewName);
  });
});

navigate('library');
