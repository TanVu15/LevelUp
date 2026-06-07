import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isConfigured } from '../firebase';
import { Task, Transaction, DayLog, Achievement, WhyCard } from '../types';

export interface GameState {
  hunterName: string;
  level: number;
  xp: number;
  streak: number;
  shields: number;
  disciplineMode: boolean;
  soundEnabled: boolean;
  onboardingDone: boolean;
  routineLabels: Record<string, string>;
  routineDescs?: Record<string, string>; // custom routine descriptions — optional for backward compat
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
  if (!isConfigured || !db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!isValidGameState(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function saveGameState(uid: string, state: GameState): Promise<void> {
  if (!isConfigured || !db) return;
  try {
    await setDoc(doc(db, 'users', uid), state);
  } catch {
    // Silently ignore — app works offline, next save will retry
  }
}
