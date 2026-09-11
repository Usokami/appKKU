import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import {
  StudySession,
  Subject,
  QUEST_BASE_TARGET_MINUTES,
  QUEST_TIER_REWARD,
} from '../shared/types';

/**
 * Flat-file JSON store. Deliberately dependency-free: the app ships as a
 * portable .exe, so anything requiring a native build (and therefore a
 * compiler on the machine doing the packaging) is off the table.
 * The whole dataset is a few hundred rows at most, so holding it in
 * memory and rewriting the file on each mutation is comfortably fast.
 */

export interface ProfileRecord {
  totalFlexPoints: number;
  streakDays: number;
  lastStudyDate: string | null;
  questTier: number;
  questTargetMinutes: number;
  questCurrentMinutes: number;
  questRewardPoints: number;
  questCompletedTimes: number;
}

export interface StoreData {
  subjects: Subject[];
  sessions: StudySession[];
  profile: ProfileRecord;
}

function defaultProfile(): ProfileRecord {
  return {
    totalFlexPoints: 0,
    streakDays: 0,
    lastStudyDate: null,
    questTier: 1,
    questTargetMinutes: QUEST_BASE_TARGET_MINUTES,
    questCurrentMinutes: 0,
    questRewardPoints: QUEST_TIER_REWARD,
    questCompletedTimes: 0,
  };
}

function defaultStore(): StoreData {
  return { subjects: [], sessions: [], profile: defaultProfile() };
}

let store: StoreData | undefined;
let storePath: string | undefined;

function getStorePath(): string {
  if (!storePath) {
    storePath = path.join(app.getPath('userData'), 'tarot-study.json');
  }
  return storePath;
}

/**
 * Merges the parsed file over the defaults so a save file written by an
 * older build (missing a field added later) still loads instead of
 * producing `undefined` arithmetic downstream.
 */
function hydrate(parsed: unknown): StoreData {
  const base = defaultStore();
  if (!parsed || typeof parsed !== 'object') return base;

  const raw = parsed as Partial<StoreData>;
  return {
    subjects: Array.isArray(raw.subjects) ? raw.subjects : base.subjects,
    sessions: Array.isArray(raw.sessions) ? raw.sessions : base.sessions,
    profile:
      raw.profile && typeof raw.profile === 'object'
        ? { ...base.profile, ...raw.profile }
        : base.profile,
  };
}

export function getStore(): StoreData {
  if (store) return store;

  const file = getStorePath();
  if (!fs.existsSync(file)) {
    store = defaultStore();
    save();
    return store;
  }

  try {
    store = hydrate(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch (err) {
    // A truncated or hand-edited file would otherwise make the app
    // unlaunchable. Keep the bad copy aside so the data is recoverable,
    // and start clean rather than refusing to open.
    const backup = `${file}.corrupt-${Date.now()}`;
    try {
      fs.renameSync(file, backup);
      console.error(`Could not read save file, moved it to ${backup}`, err);
    } catch (renameErr) {
      console.error('Could not read or preserve the save file', renameErr);
    }
    store = defaultStore();
    save();
  }

  return store;
}

/**
 * Write-to-temp-then-rename, so a crash mid-write cannot leave a
 * half-written save file behind.
 */
export function save(): void {
  if (!store) return;

  const file = getStorePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}
