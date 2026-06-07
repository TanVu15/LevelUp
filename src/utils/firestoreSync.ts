import { isConfigured, loadFirebase } from '../firebase';
import { Task, Transaction, DayLog, Achievement, WhyCard, RoutineDef } from '../types';

export interface GameState {
  hunterName: string;
  level: number;
  xp: number;
  streak: number;
  shields: number;
  disciplineMode: boolean;
  soundEnabled: boolean;
  onboardingDone: boolean;
  routines?: RoutineDef[];                // custom routine set (feat-custom-routines) — source of truth
  routineLabels?: Record<string, string>; // legacy (pre-custom-routines) — read-only for migration
  routineDescs?: Record<string, string>;  // legacy — read-only for migration
  whyCards: WhyCard[];
  monthlyBudgets: Record<string, number>;
  dailyRoutines: Record<string, boolean>;
  tasks: Task[];
  archivedTasks?: Task[]; // tasks auto-dọn từ ngày cũ — giữ để đếm achievement + lịch sử
  transactions: Transaction[];
  weightLogs: { date: string; weight: number }[];
  logs: DayLog[];
  achievements: Achievement[];
  lastOpenDate: string;
}

function isValidGameState(data: unknown): data is GameState {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return typeof d.level === 'number' && typeof d.xp === 'number' && Array.isArray(d.tasks);
}

export async function loadGameState(uid: string): Promise<GameState | null> {
  if (!isConfigured) return null;
  try {
    const fb = await loadFirebase();
    if (!fb) return null;
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(fb.db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!isValidGameState(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveGameState(uid: string, state: GameState): Promise<void> {
  if (!isConfigured) return;
  try {
    const fb = await loadFirebase();
    if (!fb) return;
    const { doc, setDoc } = await import('firebase/firestore');
    await setDoc(doc(fb.db, 'users', uid), state);
  } catch {
    // Silently ignore — app works offline, next save will retry
  }
}
