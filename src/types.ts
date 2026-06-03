export type TaskTier = 'BOSS' | 'DUNGEON' | 'MANA';

export interface Task {
  id: string;
  title: string;
  tier: TaskTier;
  completed: boolean;
  createdAt: string;
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

export interface DayLog {
  date: string; // YYYY-MM-DD
  routines: Record<string, boolean>; // routineId -> completed
  note: string;
  weight?: number; // Optional gym status weight
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: string; // Emoji or short symbol
  unlockedAt: string | null;
}
