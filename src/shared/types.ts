export type TarotIcon = 'star' | 'moon' | 'sun' | 'cup' | 'sword' | 'wand' | 'coin';

export interface Subject {
  id: string;
  title: string;
  colorHex: string;
  icon: TarotIcon;
  inRoulettePool: boolean;
  totalMinutesStudied: number;
  cardOrder: number; // used to derive the roman numeral
  createdAt: string;
}

export type TimeMode = 'manual' | 'random';
export type SessionStatus = 'running' | 'paused' | 'completed' | 'abandoned';

export interface StudySession {
  id: string;
  subjectId: string;
  timeMode: TimeMode;
  targetMinutes: number;
  actualMinutes: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
}

export interface ActiveQuest {
  tier: number;
  targetMinutes: number;
  currentMinutes: number;
  rewardPoints: number;
  completedTimes: number;
}

export interface Profile {
  totalFlexPoints: number;
  streakDays: number;
  lastStudyDate: string | null;
  activeQuest: ActiveQuest;
}

export interface FlexCardData {
  totalFlexPoints: number;
  streakDays: number;
  mostStudiedSubjectTitle: string | null;
  quest: ActiveQuest;
  justCompletedQuest: boolean;
}

export interface SessionCompletionResult {
  session: StudySession;
  profile: Profile;
  questJustCompleted: boolean;
}

export const RANDOM_TIME_CHOICES = [15, 30, 45, 60, 75, 90, 120] as const;
export const RANDOM_BONUS_RATE = 0.15;
export const EARLY_EXIT_THRESHOLD = 0.8;
export const QUEST_BASE_TARGET_MINUTES = 300;
export const QUEST_TIER_REWARD = 1000;
