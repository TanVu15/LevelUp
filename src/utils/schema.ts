import { Task, DayLog, Transaction, Achievement, WhyCard } from '../types';
import { getTodayDateString } from './date';

// Bump this when the shape of BackupData changes.
// Migration table below must handle every version from 0 → SCHEMA_VERSION.
export const SCHEMA_VERSION = 1;

export interface BackupData {
  schemaVersion: number;
  exportedAt: string;          // YYYY-MM-DD
  hunterName: string;
  level: number;
  xp: number;
  streak: number;
  shields: number;
  disciplineMode: boolean;
  soundEnabled: boolean;
  onboardingDone: boolean;
  whyCards: WhyCard[];
  monthlyBudgets: Record<string, number>;
  routineLabels: Record<string, string>;
  routineDescs?: Record<string, string>; // custom routine descriptions — optional for backward compat
  dailyRoutines: Record<string, boolean>;
  tasks: Task[];
  archivedTasks?: Task[]; // tasks auto-dọn từ ngày cũ — giữ để đếm achievement + lịch sử
  transactions: Transaction[];
  weightLogs: { date: string; weight: number }[];
  logs: DayLog[];
  achievements: Achievement[];
  lastOpenDate: string;
}

// ── Migrations ──────────────────────────────────────────────────────────────

// v0 → v1: add xpClaimed=true to completed tasks that lack the field.
// Prevents double-earn if user had completed tasks before xpClaimed was added
// (Known Issue in CLAUDE.md — this migration makes the fix permanent).
function migrateV0toV1(d: BackupData): BackupData {
  return {
    ...d,
    schemaVersion: 1,
    tasks: (d.tasks ?? []).map(t =>
      t.completed && t.xpClaimed === undefined ? { ...t, xpClaimed: true } : t
    ),
  };
}

const MIGRATIONS: Array<(d: BackupData) => BackupData> = [
  migrateV0toV1, // 0 → 1
];

export function migrate(raw: unknown): BackupData {
  // Treat missing schemaVersion as v0 (pre-versioning era)
  const data = raw as BackupData;
  let version: number = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;

  let state = { ...data, schemaVersion: version } as BackupData;
  while (version < SCHEMA_VERSION) {
    state = MIGRATIONS[version](state);
    version++;
  }
  return state;
}

// ── Validation ───────────────────────────────────────────────────────────────
// Throws a descriptive string on invalid input; returns migrated BackupData on success.

export function validateBackup(raw: unknown): BackupData {
  if (!raw || typeof raw !== 'object') throw 'File không hợp lệ (không phải JSON object).';

  const d = raw as Record<string, unknown>;

  if (typeof d.hunterName !== 'string')    throw 'Thiếu trường "hunterName".';
  if (typeof d.level !== 'number')         throw 'Thiếu trường "level".';
  if (typeof d.xp !== 'number')            throw 'Thiếu trường "xp".';
  if (!Array.isArray(d.tasks))             throw 'Thiếu trường "tasks" (array).';
  if (!Array.isArray(d.transactions))      throw 'Thiếu trường "transactions" (array).';
  if (!Array.isArray(d.logs))              throw 'Thiếu trường "logs" (array).';

  // Guard against maliciously large imports causing OOM/freeze
  if (d.tasks.length > 10_000)        throw 'File không hợp lệ: quá nhiều tasks (>10,000).';
  if (d.transactions.length > 50_000) throw 'File không hợp lệ: quá nhiều transactions (>50,000).';
  if (d.logs.length > 3_650)          throw 'File không hợp lệ: quá nhiều logs (>3,650 ngày).';

  // schemaVersion is optional (legacy backups don't have it) — migrate() handles that
  return migrate(raw);
}

// ── Export ───────────────────────────────────────────────────────────────────

export function exportBackup(state: Omit<BackupData, 'schemaVersion' | 'exportedAt'>): void {
  const today = getTodayDateString();
  const payload: BackupData = { schemaVersion: SCHEMA_VERSION, exportedAt: today, ...state };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `levelup-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
