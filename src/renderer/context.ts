import { Subject, TimeMode } from '../shared/types';

export type ViewName = 'library' | 'roulette' | 'timer' | 'flex';

export interface PendingSession {
  subject: Subject;
  targetMinutes: number;
  timeMode: TimeMode;
}

export interface AppState {
  pendingSession: PendingSession | null;
  lastQuestJustCompleted: boolean;
}

export interface AppContext {
  navigate: (view: ViewName) => void;
  refreshTabs: () => void;
  state: AppState;
}
