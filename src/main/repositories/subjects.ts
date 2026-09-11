import { randomUUID } from 'node:crypto';
import { getStore, save } from '../db';
import { Subject, TarotIcon } from '../../shared/types';

export function createSubject(title: string, colorHex: string, icon: TarotIcon): Subject {
  const store = getStore();
  const subject: Subject = {
    id: randomUUID(),
    title,
    colorHex,
    icon,
    inRoulettePool: true,
    totalMinutesStudied: 0,
    cardOrder: store.subjects.length + 1,
    createdAt: new Date().toISOString(),
  };
  store.subjects.push(subject);
  save();
  return subject;
}

export function getUserSubjects(): Subject[] {
  return [...getStore().subjects].sort((a, b) => a.cardOrder - b.cardOrder);
}

export function deleteSubject(subjectId: string): void {
  const store = getStore();
  store.sessions = store.sessions.filter((s) => s.subjectId !== subjectId);
  store.subjects = store.subjects.filter((s) => s.id !== subjectId);
  save();
}

export function deleteAllSubjects(): void {
  const store = getStore();
  store.sessions = [];
  store.subjects = [];
  save();
}

export function togglePoolStatus(subjectId: string, inPool: boolean): Subject {
  const subject = getStore().subjects.find((s) => s.id === subjectId);
  if (!subject) throw new Error(`Subject ${subjectId} not found`);
  subject.inRoulettePool = inPool;
  save();
  return subject;
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
  const subject = getStore().subjects.find((s) => s.id === subjectId);
  if (!subject) return;
  subject.totalMinutesStudied += minutes;
  save();
}

export function getMostStudiedSubjectTitle(): string | null {
  const subjects = getStore().subjects;
  if (subjects.length === 0) return null;
  const top = subjects.reduce((best, s) =>
    s.totalMinutesStudied > best.totalMinutesStudied ? s : best);
  return top.title;
}
