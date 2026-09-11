import {
  EARLY_EXIT_THRESHOLD,
  RANDOM_BONUS_RATE,
  RANDOM_TIME_CHOICES,
  TimeMode,
} from './types';

export function generateStudyTime(mode: TimeMode, manualMinutes?: number): number {
  if (mode === 'manual') {
    if (!manualMinutes || manualMinutes <= 0 || !Number.isFinite(manualMinutes)) {
      throw new Error('manualMinutes must be a positive number for manual mode');
    }
    return Math.round(manualMinutes);
  }
  const idx = Math.floor(Math.random() * RANDOM_TIME_CHOICES.length);
  return RANDOM_TIME_CHOICES[idx];
}

/** True once actualMinutes reaches the anticheat threshold (80% of target). */
export function meetsEarlyExitThreshold(actualMinutes: number, targetMinutes: number): boolean {
  return actualMinutes >= targetMinutes * EARLY_EXIT_THRESHOLD;
}

export interface PointCalculation {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  countsTowardQuest: boolean;
}

/**
 * Full session finished its target duration: full points, bonus applies for random mode.
 */
export function calculateCompletedPoints(actualMinutes: number, timeMode: TimeMode): PointCalculation {
  const basePoints = Math.round(actualMinutes);
  const bonusPoints = timeMode === 'random' ? Math.round(basePoints * RANDOM_BONUS_RATE) : 0;
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    countsTowardQuest: true,
  };
}

/**
 * Session was abandoned before the target duration finished.
 * Per skill.txt §5: below the 80% threshold, no bonus points and the minutes
 * are not added to the 5-hour quest. At/above 80%, minutes count but the
 * random-mode bonus is still withheld since the target was never reached.
 */
export function calculateAbandonedPoints(
  actualMinutes: number,
  targetMinutes: number,
): PointCalculation {
  const passedThreshold = meetsEarlyExitThreshold(actualMinutes, targetMinutes);
  const basePoints = passedThreshold ? Math.round(actualMinutes) : 0;
  return {
    basePoints,
    bonusPoints: 0,
    totalPoints: basePoints,
    countsTowardQuest: passedThreshold,
  };
}
