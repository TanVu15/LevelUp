import { Task, Transaction, DayLog } from '../types';
import { toISODate, addDays } from './date';

// Weekly review — pure logic (feat-weekly-review). Không React/state/localStorage.

/** Thứ Hai (LOCAL) của tuần chứa dateStr — YYYY-MM-DD. */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - dow);
  return toISODate(d);
}

export interface WeeklyPeriod {
  start: string;          // YYYY-MM-DD (thứ Hai)
  end: string;            // YYYY-MM-DD (Chủ nhật)
  routineDone: number;    // tổng tick routine trong kỳ
  routineTotal: number;   // routineCount × 7
  tasksCompleted: number; // task completedAt trong kỳ (tasks + archived)
  spend: number;          // tổng EXPENSE trong kỳ (VND)
}

export interface WeeklyReviewData {
  current: WeeklyPeriod;  // tuần được review (tuần TRƯỚC tuần hiện tại)
  previous: WeeklyPeriod; // tuần liền trước đó (để so sánh)
}

function inRange(date: string | undefined, start: string, end: string): boolean {
  return !!date && date >= start && date <= end;
}

function computePeriod(
  start: string,
  logs: DayLog[],
  allTasks: Task[],
  transactions: Transaction[],
  routineCount: number,
): WeeklyPeriod {
  const end = addDays(start, 6);
  const routineDone = logs
    .filter(l => inRange(l.date, start, end))
    .reduce((sum, l) => sum + Object.values(l.routines).filter(Boolean).length, 0);
  const tasksCompleted = allTasks.filter(t => t.completed && inRange(t.completedAt, start, end)).length;
  const spend = transactions
    .filter(t => t.type === 'EXPENSE' && inRange(t.date, start, end))
    .reduce((sum, t) => sum + t.amount, 0);
  return { start, end, routineDone, routineTotal: routineCount * 7, tasksCompleted, spend };
}

export function computeWeeklyReview(args: {
  logs: DayLog[];
  tasks: Task[];
  archivedTasks: Task[];
  transactions: Transaction[];
  routineCount: number;
  weekStart: string; // thứ Hai của tuần được review
}): WeeklyReviewData {
  const allTasks = [...args.tasks, ...args.archivedTasks];
  return {
    current: computePeriod(args.weekStart, args.logs, allTasks, args.transactions, args.routineCount),
    previous: computePeriod(addDays(args.weekStart, -7), args.logs, allTasks, args.transactions, args.routineCount),
  };
}

/** Tuần có gì đáng review không — tuần trống thì khỏi hiện modal. */
export function hasWeeklyActivity(p: WeeklyPeriod): boolean {
  return p.routineDone > 0 || p.tasksCompleted > 0 || p.spend > 0;
}
