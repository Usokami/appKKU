import { getDb } from '../db';
import { ActiveQuest, Profile, QUEST_TIER_REWARD } from '../../shared/types';

interface ProfileRow {
  totalFlexPoints: number;
  streakDays: number;
  lastStudyDate: string | null;
  questTier: number;
  questTargetMinutes: number;
  questCurrentMinutes: number;
  questRewardPoints: number;
  questCompletedTimes: number;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    totalFlexPoints: row.totalFlexPoints,
    streakDays: row.streakDays,
    lastStudyDate: row.lastStudyDate,
    activeQuest: {
      tier: row.questTier,
      targetMinutes: row.questTargetMinutes,
      currentMinutes: row.questCurrentMinutes,
      rewardPoints: row.questRewardPoints,
      completedTimes: row.questCompletedTimes,
    },
  };
}

export function getProfile(): Profile {
  const row = getDb().prepare('SELECT * FROM profile WHERE id = 1').get() as ProfileRow;
  return rowToProfile(row);
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function isYesterday(lastIso: string, todayIso: string): boolean {
  const last = new Date(lastIso.slice(0, 10));
  const today = new Date(todayIso.slice(0, 10));
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000);
  return diffDays === 1;
}

function updateStreak(row: ProfileRow, todayIso: string): number {
  if (!row.lastStudyDate) return 1;
  if (isSameDay(row.lastStudyDate, todayIso)) return row.streakDays;
  if (isYesterday(row.lastStudyDate, todayIso)) return row.streakDays + 1;
  return 1;
}

/**
 * Adds points and (if the session counted) minutes toward the quest.
 * Crossing the quest's target minutes awards the tier's reward points,
 * advances to the next tier (target grows by another 5h block), and
 * carries any minute surplus into the new tier.
 */
export function applySessionResult(
  pointsEarned: number,
  minutesForQuest: number,
): { profile: Profile; questJustCompleted: boolean } {
  const db = getDb();
  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get() as ProfileRow;
  const todayIso = new Date().toISOString();

  const streakDays = minutesForQuest > 0 ? updateStreak(row, todayIso) : row.streakDays;
  const lastStudyDate = minutesForQuest > 0 ? todayIso : row.lastStudyDate;

  let totalFlexPoints = row.totalFlexPoints + pointsEarned;
  let questCurrentMinutes = row.questCurrentMinutes + minutesForQuest;
  let questTier = row.questTier;
  let questCompletedTimes = row.questCompletedTimes;
  let questTargetMinutes = row.questTargetMinutes;
  let questJustCompleted = false;

  if (questCurrentMinutes >= questTargetMinutes) {
    questJustCompleted = true;
    totalFlexPoints += row.questRewardPoints;
    questCompletedTimes += 1;
    questCurrentMinutes -= questTargetMinutes;
    questTier += 1;
    questTargetMinutes = questTier * 300; // Tier 1: 300, Tier 2: 600 (10h total), ...
  }

  db.prepare(
    `UPDATE profile SET
       totalFlexPoints = ?, streakDays = ?, lastStudyDate = ?,
       questTier = ?, questTargetMinutes = ?, questCurrentMinutes = ?,
       questRewardPoints = ?, questCompletedTimes = ?
     WHERE id = 1`,
  ).run(
    totalFlexPoints,
    streakDays,
    lastStudyDate,
    questTier,
    questTargetMinutes,
    questCurrentMinutes,
    QUEST_TIER_REWARD,
    questCompletedTimes,
  );

  return { profile: getProfile(), questJustCompleted };
}
