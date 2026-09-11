import { randomUUID } from 'node:crypto';
import { getStore, save } from '../db';
import { StudySession, TimeMode, SessionCompletionResult } from '../../shared/types';
import { calculateAbandonedPoints, calculateCompletedPoints } from '../../shared/points';
import { addMinutesToSubject } from './subjects';
import { applySessionResult } from './quest';

export function startSession(subjectId: string, targetMinutes: number, timeMode: TimeMode): StudySession {
  const session: StudySession = {
    id: randomUUID(),
    subjectId,
    timeMode,
    targetMinutes,
    actualMinutes: 0,
    basePoints: 0,
    bonusPoints: 0,
    totalPoints: 0,
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  getStore().sessions.push(session);
  save();
  return session;
}

/**
 * Ends a session, either because the timer ran out naturally (`completed`)
 * or the user cancelled early (`abandoned`). `actualMinutes` is the real
 * elapsed time as tracked by the renderer's timer, not the target.
 */
export function finishSession(
  sessionId: string,
  actualMinutes: number,
  outcome: 'completed' | 'abandoned',
): SessionCompletionResult {
  const session = getStore().sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const calc = outcome === 'completed'
    ? calculateCompletedPoints(actualMinutes, session.timeMode)
    : calculateAbandonedPoints(actualMinutes, session.targetMinutes);

  session.actualMinutes = actualMinutes;
  session.basePoints = calc.basePoints;
  session.bonusPoints = calc.bonusPoints;
  session.totalPoints = calc.totalPoints;
  session.status = outcome;
  session.completedAt = new Date().toISOString();
  save();

  if (calc.countsTowardQuest && actualMinutes > 0) {
    addMinutesToSubject(session.subjectId, actualMinutes);
  }

  const { profile, questJustCompleted } = applySessionResult(
    calc.totalPoints,
    calc.countsTowardQuest ? actualMinutes : 0,
  );

  return { session: { ...session }, profile, questJustCompleted };
}
