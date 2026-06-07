import { describe, it, expect } from 'vitest';
import { toISODate, addDays, getCurrentYearMonth, getTodayDateString } from '../date';

describe('toISODate', () => {
  it('formats a local date as YYYY-MM-DD with zero-padding', () => {
    // Construct via local Date(year, monthIndex, day) so no UTC drift in the test itself.
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 11, 31))).toBe('2026-12-31');
    expect(toISODate(new Date(2026, 8, 9))).toBe('2026-09-09');
  });
});

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-06-07', 1)).toBe('2026-06-08');
    expect(addDays('2026-06-07', 5)).toBe('2026-06-12');
  });

  it('rolls across a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('subtracts days with a negative argument', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-06-07', -7)).toBe('2026-05-31');
  });

  it('handles leap year', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // 2024 is a leap year
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01'); // 2026 is not
  });

  it('rolls across a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('getCurrentYearMonth', () => {
  it('is the first 7 chars of today', () => {
    expect(getCurrentYearMonth()).toBe(getTodayDateString().slice(0, 7));
  });

  it('matches YYYY-MM shape', () => {
    expect(getCurrentYearMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});
