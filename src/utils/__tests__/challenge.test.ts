import { describe, it, expect } from 'vitest';
import { getDailyChallenge, checkChallengeCondition, DAILY_CHALLENGES } from '../challenge';
import { Task, TaskTier } from '../../types';

const TODAY = '2026-06-07';

function task(tier: TaskTier, completed: boolean, claimedAt?: string): Task {
  return {
    id: `t_${Math.random()}`,
    title: 't',
    tier,
    completed,
    createdAt: TODAY,
    ...(claimedAt ? { claimedAt } : {}),
  };
}

const noRoutines = { eat: false, pray: false, train: false, study: false, work: false, sleep: false };
const allRoutines = { eat: true, pray: true, train: true, study: true, work: true, sleep: true };

describe('getDailyChallenge', () => {
  it('is deterministic for a given date', () => {
    expect(getDailyChallenge(TODAY)).toBe(getDailyChallenge(TODAY));
  });

  it('returns one of the defined challenges', () => {
    for (const d of ['2026-01-01', '2026-06-07', '2026-12-31', '']) {
      expect(DAILY_CHALLENGES).toContain(getDailyChallenge(d));
    }
  });
});

describe('checkChallengeCondition', () => {
  it('routines_min counts completed routines', () => {
    const ch = { id: 'x', title: '', desc: '', xp: 0, type: 'routines_min' as const, threshold: 3 };
    const three = { ...noRoutines, eat: true, pray: true, train: true };
    expect(checkChallengeCondition(ch, three, [], TODAY)).toBe(true);
    expect(checkChallengeCondition(ch, { ...noRoutines, eat: true, pray: true }, [], TODAY)).toBe(false);
  });

  it('routines_all requires all 6', () => {
    const ch = { id: 'x', title: '', desc: '', xp: 0, type: 'routines_all' as const, threshold: 6 };
    expect(checkChallengeCondition(ch, allRoutines, [], TODAY)).toBe(true);
    expect(checkChallengeCondition(ch, { ...allRoutines, sleep: false }, [], TODAY)).toBe(false);
  });

  it('boss_task counts only BOSS tasks completed AND claimed today', () => {
    const ch = { id: 'x', title: '', desc: '', xp: 0, type: 'boss_task' as const, threshold: 1 };
    expect(checkChallengeCondition(ch, noRoutines, [task('BOSS', true, TODAY)], TODAY)).toBe(true);
    expect(checkChallengeCondition(ch, noRoutines, [task('BOSS', true, '2026-06-06')], TODAY)).toBe(false); // claimed another day
    expect(checkChallengeCondition(ch, noRoutines, [task('BOSS', false, TODAY)], TODAY)).toBe(false);       // not completed
    expect(checkChallengeCondition(ch, noRoutines, [task('DUNGEON', true, TODAY)], TODAY)).toBe(false);      // wrong tier
  });

  it('dungeon_tasks_min counts DUNGEON tasks', () => {
    const ch = { id: 'x', title: '', desc: '', xp: 0, type: 'dungeon_tasks_min' as const, threshold: 2 };
    const tasks = [task('DUNGEON', true, TODAY), task('DUNGEON', true, TODAY)];
    expect(checkChallengeCondition(ch, noRoutines, tasks, TODAY)).toBe(true);
    expect(checkChallengeCondition(ch, noRoutines, [tasks[0]], TODAY)).toBe(false);
  });

  it('any_tasks_min counts all completed-today tasks regardless of tier', () => {
    const ch = { id: 'x', title: '', desc: '', xp: 0, type: 'any_tasks_min' as const, threshold: 3 };
    const tasks = [task('BOSS', true, TODAY), task('DUNGEON', true, TODAY), task('MANA', true, TODAY)];
    expect(checkChallengeCondition(ch, noRoutines, tasks, TODAY)).toBe(true);
    expect(checkChallengeCondition(ch, noRoutines, tasks.slice(0, 2), TODAY)).toBe(false);
  });
});
