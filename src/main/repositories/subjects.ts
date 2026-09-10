import { randomUUID } from 'node:crypto';
import { getDb } from '../db';
import { Subject, TarotIcon } from '../../shared/types';

interface SubjectRow {
  id: string;
  title: string;
  colorHex: string;
  icon: TarotIcon;
  inRoulettePool: number;
  totalMinutesStudied: number;
  cardOrder: number;
  createdAt: string;
}

function rowToSubject(row: SubjectRow): Subject {
  return { ...row, inRoulettePool: row.inRoulettePool === 1 };
}

export function createSubject(title: string, colorHex: string, icon: TarotIcon): Subject {
  const db = getDb();
  const { count } = db.prepare('SELECT COUNT(*) as count FROM subjects').get() as { count: number };
  const subject: Subject = {
    id: randomUUID(),
    title,
    colorHex,
    icon,
    inRoulettePool: true,
    totalMinutesStudied: 0,
    cardOrder: count + 1,
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO subjects (id, title, colorHex, icon, inRoulettePool, totalMinutesStudied, cardOrder, createdAt)
     VALUES (@id, @title, @colorHex, @icon, 1, @totalMinutesStudied, @cardOrder, @createdAt)`,
  ).run(subject);
  return subject;
}

export function getUserSubjects(): Subject[] {
  const rows = getDb().prepare('SELECT * FROM subjects ORDER BY cardOrder ASC').all() as SubjectRow[];
  return rows.map(rowToSubject);
}

export function togglePoolStatus(subjectId: string, inPool: boolean): Subject {
  const db = getDb();
  db.prepare('UPDATE subjects SET inRoulettePool = ? WHERE id = ?').run(inPool ? 1 : 0, subjectId);
  const row = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) as SubjectRow;
  return rowToSubject(row);
}

export function spinSubject(): Subject {
  const pool = getUserSubjects().filter((s) => s.inRoulettePool);
  if (pool.length === 0) {
    throw new Error('Roulette pool is empty: select at least one subject before spinning.');
  }
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

export function addMinutesToSubject(subjectId: string, minutes: number): void {
  getDb().prepare('UPDATE subjects SET totalMinutesStudied = totalMinutesStudied + ? WHERE id = ?')
    .run(minutes, subjectId);
}

export function getMostStudiedSubjectTitle(): string | null {
  const row = getDb()
    .prepare('SELECT title FROM subjects ORDER BY totalMinutesStudied DESC LIMIT 1')
    .get() as { title: string } | undefined;
  return row?.title ?? null;
}
