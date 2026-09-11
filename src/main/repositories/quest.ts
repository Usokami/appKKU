import { getStore, save, ProfileRecord } from '../db';
import { Profile, QUEST_TIER_REWARD } from '../../shared/types';

function toProfile(record: ProfileRecord): Profile {
  return {
    totalFlexPoints: record.totalFlexPoints,
    streakDays: record.streakDays,
    lastStudyDate: record.lastStudyDate,
    activeQuest: {
      tier: record.questTier,
      targetMinutes: record.questTargetMinutes,
      currentMinutes: record.questCurrentMinutes,
      rewardPoints: record.questRewardPoints,
      completedTimes: record.questCompletedTimes,
    },
  };
}

export function getProfile(): Profile {
  return toProfile(getStore().profile);
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

function updateStreak(record: ProfileRecord, todayIso: string): number {
  if (!record.lastStudyDate) return 1;
  if (isSameDay(record.lastStudyDate, todayIso)) return record.streakDays;
  if (isYesterday(record.lastStudyDate, todayIso)) return record.streakDays + 1;
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
  const record = getStore().profile;
  const todayIso = new Date().toISOString();

  if (minutesForQuest > 0) {
    record.streakDays = updateStreak(record, todayIso);
    record.lastStudyDate = todayIso;
  }

  record.totalFlexPoints += pointsEarned;
  record.questCurrentMinutes += minutesForQuest;

  let questJustCompleted = false;
  if (record.questCurrentMinutes >= record.questTargetMinutes) {
    questJustCompleted = true;
    record.totalFlexPoints += record.questRewardPoints;
    record.questCompletedTimes += 1;
    record.questCurrentMinutes -= record.questTargetMinutes;
    record.questTier += 1;
    record.questTargetMinutes = record.questTier * 300; // Tier 1: 300, Tier 2: 600 (10h total), ...
    record.questRewardPoints = QUEST_TIER_REWARD;
  }

  save();
  return { profile: getProfile(), questJustCompleted };
}
