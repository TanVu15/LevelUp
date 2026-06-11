import { TaskTier } from '../types';

// Pure XP / rank / cap logic. No React, no state, no localStorage.
// Values mirror ADR-008 (XP curve) and ADR-009 (anti-exploit caps) — do not change
// without updating those ADRs.

export type Rank = 'E-Rank' | 'D-Rank' | 'C-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank';

export function getRankForLevel(level: number): Rank {
  if (level >= 51) return 'S-Rank';
  if (level >= 36) return 'A-Rank';
  if (level >= 21) return 'B-Rank';
  if (level >= 11) return 'C-Rank';
  if (level >= 6)  return 'D-Rank';
  return 'E-Rank';
}

// Piecewise XP curve — calibrated to psychological habit formation milestones (ADR-008):
// E+D rank: ~18 days, ~66 days (Lally habit threshold) at 100 XP/day
// C: ~7 months · B: ~1.5 years · A: ~2.7 years · S: ongoing
export function getXpNeeded(level: number): number {
  if (level <= 10) return level * 120;
  if (level <= 20) return level * 100;
  if (level <= 35) return level * 80;
  if (level <= 50) return level * 65;
  return level * 50;
}

export interface XpGainResult {
  xp: number;          // leftover XP toward the next level
  level: number;       // level after applying the gain
  levelsGained: number;
}

/**
 * Pure XP application. Adds `amount` and rolls over as many levels as the total
 * allows (a large reward can span multiple levels). Terminates because every
 * iteration subtracts getXpNeeded(lvl) > 0 and raises the level.
 */
export function applyXpGain(xp: number, level: number, amount: number): XpGainResult {
  let curXp = xp + amount;
  let lvl = level;
  let levelsGained = 0;
  while (curXp >= getXpNeeded(lvl)) {
    curXp -= getXpNeeded(lvl);
    lvl += 1;
    levelsGained += 1;
  }
  return { xp: curXp, level: lvl, levelsGained };
}

export const DAILY_TASK_XP_CAP = 150;

// Per-tier daily completion caps — prevents single-tier quantity abuse (ADR-009).
export const DAILY_TIER_CAPS: Record<TaskTier, number> = { BOSS: 2, DUNGEON: 4, MANA: 5 };

// Focus timer (CHRONO ARENA): XP mỗi phiên hoàn thành + cap phiên-có-XP mỗi ngày.
// 4 × 25 = 100 XP/ngày — ngang 1 BOSS; quá cap timer vẫn chạy, chỉ không cộng XP (ADR-009).
export const FOCUS_XP = 25;
export const DAILY_FOCUS_CAP = 4;
