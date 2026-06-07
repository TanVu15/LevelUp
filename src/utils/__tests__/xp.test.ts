import { describe, it, expect } from 'vitest';
import { getRankForLevel, getXpNeeded, applyXpGain, DAILY_TASK_XP_CAP, DAILY_TIER_CAPS } from '../xp';

describe('getRankForLevel', () => {
  it('maps levels to ranks at the ADR-008 thresholds', () => {
    expect(getRankForLevel(1)).toBe('E-Rank');
    expect(getRankForLevel(5)).toBe('E-Rank');
    expect(getRankForLevel(6)).toBe('D-Rank');
    expect(getRankForLevel(10)).toBe('D-Rank');
    expect(getRankForLevel(11)).toBe('C-Rank');
    expect(getRankForLevel(20)).toBe('C-Rank');
    expect(getRankForLevel(21)).toBe('B-Rank');
    expect(getRankForLevel(35)).toBe('B-Rank');
    expect(getRankForLevel(36)).toBe('A-Rank');
    expect(getRankForLevel(50)).toBe('A-Rank');
    expect(getRankForLevel(51)).toBe('S-Rank');
    expect(getRankForLevel(99)).toBe('S-Rank');
  });
});

describe('getXpNeeded', () => {
  it('follows the piecewise curve (ADR-008)', () => {
    expect(getXpNeeded(1)).toBe(120);
    expect(getXpNeeded(10)).toBe(1200);   // ×120
    expect(getXpNeeded(11)).toBe(1100);   // ×100
    expect(getXpNeeded(20)).toBe(2000);
    expect(getXpNeeded(21)).toBe(1680);   // ×80
    expect(getXpNeeded(35)).toBe(2800);
    expect(getXpNeeded(36)).toBe(2340);   // ×65
    expect(getXpNeeded(50)).toBe(3250);
    expect(getXpNeeded(51)).toBe(2550);   // ×50
  });
});

describe('applyXpGain', () => {
  it('stays on the same level when the gain is below the threshold', () => {
    expect(applyXpGain(0, 1, 30)).toEqual({ xp: 30, level: 1, levelsGained: 0 });
  });

  it('rolls a single level and keeps the remainder', () => {
    // L1 needs 120; 0+150 -> level 2 with 30 leftover
    expect(applyXpGain(0, 1, 150)).toEqual({ xp: 30, level: 2, levelsGained: 1 });
  });

  it('rolls multiple levels from one large reward', () => {
    // L1 needs 120, L2 needs 240. 0 + 400 -> -120 (L2, 280) -> -240 (L3, 40)
    expect(applyXpGain(0, 1, 400)).toEqual({ xp: 40, level: 3, levelsGained: 2 });
  });

  it('lands exactly on a level boundary', () => {
    expect(applyXpGain(0, 1, 120)).toEqual({ xp: 0, level: 2, levelsGained: 1 });
  });

  it('accounts for pre-existing xp toward the level', () => {
    // already 100/120 at L1, +50 -> 150 -> level 2 with 30
    expect(applyXpGain(100, 1, 50)).toEqual({ xp: 30, level: 2, levelsGained: 1 });
  });
});

describe('caps', () => {
  it('exposes the anti-exploit caps (ADR-009)', () => {
    expect(DAILY_TASK_XP_CAP).toBe(150);
    expect(DAILY_TIER_CAPS).toEqual({ BOSS: 2, DUNGEON: 4, MANA: 5 });
  });
});
