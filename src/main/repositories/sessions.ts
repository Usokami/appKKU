import { randomUUID } from 'node:crypto';
import { getDb } from '../db';
import { StudySession, TimeMode, SessionCompletionResult } from '../../shared/types';
import { calculateAbandonedPoints, calculateCompletedPoints } from '../../shared/points';
import { addMinutesToSubject } from './subjects';
import { applySessionResult } from './quest';

interface SessionRow {
  id: string;
  subjectId: string;
  timeMode: TimeMode;
  targetMinutes: number;
  actualMinutes: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  status: StudySession['status'];
  startedAt: string;
  completedAt: string | null;
}

export function startSession(subjectId: string, targetMinutes: number, timeMode: TimeMode): StudySession {
  const db = getDb();
  const session: SessionRow = {
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
  db.prepare(
    `INSERT INTO sessions (id, subjectId, timeMode, targetMinutes, actualMinutes, basePoints, bonusPoints, totalPoints, status, startedAt, completedAt)
     VALUES (@id, @subjectId, @timeMode, @targetMinutes, @actualMinutes, @basePoints, @bonusPoints, @totalPoints, @status, @startedAt, @completedAt)`,
  ).run(session);
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
  const db = getDb();
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRow;
  if (!row) throw new Error(`Session ${sessionId} not found`);

  const calc = outcome === 'completed'
    ? calculateCompletedPoints(actualMinutes, row.timeMode)
    : calculateAbandonedPoints(actualMinutes, row.targetMinutes);

  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE sessions SET actualMinutes = ?, basePoints = ?, bonusPoints = ?, totalPoints = ?, status = ?, completedAt = ?
     WHERE id = ?`,
  ).run(actualMinutes, calc.basePoints, calc.bonusPoints, calc.totalPoints, outcome, completedAt, sessionId);

  if (calc.countsTowardQuest && actualMinutes > 0) {
    addMinutesToSubject(row.subjectId, actualMinutes);
  }

  const { profile, questJustCompleted } = applySessionResult(
    calc.totalPoints,
    calc.countsTowardQuest ? actualMinutes : 0,
  );

  const session: StudySession = {
    ...row,
    actualMinutes,
    basePoints: calc.basePoints,
    bonusPoints: calc.bonusPoints,
    totalPoints: calc.totalPoints,
    status: outcome,
    completedAt,
  };

  return { session, profile, questJustCompleted };
}
