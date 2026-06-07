import { Task } from '../types';

// Pure daily-challenge logic. No React, no state, no localStorage.

export interface DailyChallenge {
  id: string;
  title: string;
  desc: string;
  xp: number;
  type: 'routines_min' | 'routines_all' | 'boss_task' | 'dungeon_tasks_min' | 'any_tasks_min';
  threshold: number;
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'ch1', title: 'TRIPLE PROTOCOL',   desc: 'Hoàn thành ít nhất 3 Routines hôm nay',      xp: 25, type: 'routines_min',      threshold: 3 },
  { id: 'ch2', title: 'OVERDRIVE MODE',    desc: 'Hoàn thành cả 6 Routines trong ngày',         xp: 40, type: 'routines_all',       threshold: 6 },
  { id: 'ch3', title: 'BOSS RAID CLEARED', desc: 'Hoàn thành ít nhất 1 Boss Raid hôm nay',      xp: 35, type: 'boss_task',          threshold: 1 },
  { id: 'ch4', title: 'GRIND DAY',         desc: 'Hoàn thành ít nhất 3 nhiệm vụ bất kỳ',        xp: 20, type: 'any_tasks_min',      threshold: 3 },
  { id: 'ch5', title: 'DUNGEON CLEAR',     desc: 'Hoàn thành 2 Dungeon Gate hôm nay',           xp: 30, type: 'dungeon_tasks_min',  threshold: 2 },
  { id: 'ch6', title: 'IRON DISCIPLINE',   desc: 'Hoàn thành ít nhất 4 Routines hôm nay',       xp: 30, type: 'routines_min',      threshold: 4 },
  { id: 'ch7', title: 'BOSS RAID BLITZ',   desc: 'Hoàn thành 2 Boss Raid hôm nay',              xp: 50, type: 'boss_task',          threshold: 2 },
];

// Deterministic per-day pick: same dateStr always yields the same challenge.
export function getDailyChallenge(dateStr: string): DailyChallenge {
  const hash = [...dateStr].reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7);
  return DAILY_CHALLENGES[Math.abs(hash) % DAILY_CHALLENGES.length];
}

export function checkChallengeCondition(
  challenge: DailyChallenge,
  dailyRoutines: Record<string, boolean>,
  tasks: Task[],
  today: string,
): boolean {
  const completedRoutines = Object.values(dailyRoutines).filter(Boolean).length;
  const todayCompleted = tasks.filter(t => t.completed && t.claimedAt === today);
  switch (challenge.type) {
    case 'routines_min':      return completedRoutines >= challenge.threshold;
    case 'routines_all':      return completedRoutines >= 6;
    case 'boss_task':         return todayCompleted.filter(t => t.tier === 'BOSS').length >= challenge.threshold;
    case 'dungeon_tasks_min': return todayCompleted.filter(t => t.tier === 'DUNGEON').length >= challenge.threshold;
    case 'any_tasks_min':     return todayCompleted.length >= challenge.threshold;
    default:                  return false;
  }
}
