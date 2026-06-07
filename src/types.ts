export type TaskTier = 'BOSS' | 'DUNGEON' | 'MANA';

export type WhyCardType = 'PAIN' | 'FAILURE' | 'GOAL';

export interface WhyCard {
  id: string;
  type: WhyCardType;
  title: string;
  story: string;
}

export interface Task {
  id: string;
  title: string;
  tier: TaskTier;
  completed: boolean;
  xpClaimed?: boolean;  // true once XP awarded — prevents re-earn on re-toggle
  claimedAt?: string;   // YYYY-MM-DD — tracks which day XP was claimed (used for daily cap)
  completedAt?: string; // YYYY-MM-DD — day task was marked done; cleared on un-complete (today-counter + history grouping)
  createdAt: string;
  dueDate?: string;
}

export type ExpenseCategory =
  | 'Gym & Nutrition'
  | 'Work & Gear'
  | 'Books & Growth'
  | 'Rent & Utilities'
  | 'Unnecessary Leaks';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: ExpenseCategory | 'Income Source';
  date: string;
}

export interface DailyRoutineSetting {
  id: string;
  name: string;
  iconName: string;
  label: string;
}

// Customizable daily routine ("Đường Ray Kỷ Luật"). Single source of truth for the
// routine set; dailyRoutines / DayLog stay keyed by `id`. See feat-custom-routines.
export interface RoutineDef {
  id: string;
  label: string;
  desc: string;
  iconName: string; // key into ROUTINE_ICONS (data/routines.ts)
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  routines: Record<string, boolean>;
  routineXpClaimed?: Record<string, boolean>; // routineId → XP already given today
  overdriveXpClaimed?: boolean;               // OVERDRIVE bonus already given today
  taskXpEarned?: number;                      // cumulative task XP earned today (cap enforcement — survives task deletion)
  taskCountByTier?: Partial<Record<TaskTier, number>>; // XP-earning completions per tier today (per-tier cap enforcement)
  dailyChallengeClaimed?: boolean;            // true once today's challenge XP is claimed
  note: string;
  weight?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: string;
  unlockedAt: string | null;
}
