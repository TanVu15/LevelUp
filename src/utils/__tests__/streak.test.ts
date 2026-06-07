import { describe, it, expect } from 'vitest';
import { computeStreakRollover, getStreakMilestoneMsg } from '../streak';

describe('computeStreakRollover', () => {
  it('increments streak when yesterday score >= 3 (daysDiff 1)', () => {
    const r = computeStreakRollover(3, 0, 4, 1);
    expect(r).toEqual({ streak: 4, shields: 0, milestoneReached: false, reset: false });
  });

  it('grants a shield and flags milestone on a 7-day boundary', () => {
    const r = computeStreakRollover(6, 0, 5, 1); // 6 -> 7
    expect(r.streak).toBe(7);
    expect(r.milestoneReached).toBe(true);
    expect(r.shields).toBe(1);
    expect(r.reset).toBe(false);
  });

  it('caps shields at 2 but still flags milestone', () => {
    const r = computeStreakRollover(13, 2, 6, 1); // 13 -> 14, milestone
    expect(r.streak).toBe(14);
    expect(r.milestoneReached).toBe(true);
    expect(r.shields).toBe(2); // min(2, 2+1)
  });

  it('consumes a shield when score < 3 and a shield is available', () => {
    const r = computeStreakRollover(10, 1, 2, 1);
    expect(r).toEqual({ streak: 10, shields: 0, milestoneReached: false, reset: false });
  });

  it('resets streak when score < 3 and no shields', () => {
    const r = computeStreakRollover(10, 0, 2, 1);
    expect(r).toEqual({ streak: 0, shields: 0, milestoneReached: false, reset: true });
  });

  it('resets streak when more than one day was skipped', () => {
    const r = computeStreakRollover(10, 2, 6, 3); // shields do not save a multi-day gap
    expect(r).toEqual({ streak: 0, shields: 2, milestoneReached: false, reset: true });
  });

  it('resets on non-positive daysDiff (clock moved backwards)', () => {
    const r = computeStreakRollover(5, 1, 6, 0);
    expect(r.reset).toBe(true);
    expect(r.streak).toBe(0);
  });

  it('treats exactly 3 routines as keeping the streak', () => {
    const r = computeStreakRollover(2, 0, 3, 1);
    expect(r.streak).toBe(3);
    expect(r.reset).toBe(false);
  });
});

describe('getStreakMilestoneMsg', () => {
  it('returns specific copy for known milestones', () => {
    expect(getStreakMilestoneMsg(7)).toContain('7 NGÀY');
    expect(getStreakMilestoneMsg(14)).toContain('14 NGÀY');
    expect(getStreakMilestoneMsg(21)).toContain('21 NGÀY');
    expect(getStreakMilestoneMsg(28)).toContain('28 NGÀY');
  });

  it('falls back to a generic message for other counts', () => {
    expect(getStreakMilestoneMsg(35)).toContain('35 NGÀY');
  });
});
