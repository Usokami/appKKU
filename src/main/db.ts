import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';
import { QUEST_BASE_TARGET_MINUTES, QUEST_TIER_REWARD } from '../shared/types';

let db: Database.Database;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'tarot-study.sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      colorHex TEXT NOT NULL,
      icon TEXT NOT NULL,
      inRoulettePool INTEGER NOT NULL DEFAULT 1,
      totalMinutesStudied INTEGER NOT NULL DEFAULT 0,
      cardOrder INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      subjectId TEXT NOT NULL REFERENCES subjects(id),
      timeMode TEXT NOT NULL,
      targetMinutes INTEGER NOT NULL,
      actualMinutes INTEGER NOT NULL DEFAULT 0,
      basePoints INTEGER NOT NULL DEFAULT 0,
      bonusPoints INTEGER NOT NULL DEFAULT 0,
      totalPoints INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      startedAt TEXT NOT NULL,
      completedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      totalFlexPoints INTEGER NOT NULL DEFAULT 0,
      streakDays INTEGER NOT NULL DEFAULT 0,
      lastStudyDate TEXT,
      questTier INTEGER NOT NULL DEFAULT 1,
      questTargetMinutes INTEGER NOT NULL DEFAULT ${QUEST_BASE_TARGET_MINUTES},
      questCurrentMinutes INTEGER NOT NULL DEFAULT 0,
      questRewardPoints INTEGER NOT NULL DEFAULT ${QUEST_TIER_REWARD},
      questCompletedTimes INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.prepare(
    `INSERT OR IGNORE INTO profile (id, totalFlexPoints, streakDays, questTier, questTargetMinutes, questRewardPoints)
     VALUES (1, 0, 0, 1, ?, ?)`,
  ).run(QUEST_BASE_TARGET_MINUTES, QUEST_TIER_REWARD);

  return db;
}
