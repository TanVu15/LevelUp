import { describe, it, expect } from 'vitest';
import { getWeekStart, computeWeeklyReview, hasWeeklyActivity } from '../weekly';
import { Task, Transaction, DayLog } from '../../types';

describe('getWeekStart', () => {
  it('thứ Hai trả về chính nó', () => {
    expect(getWeekStart('2026-06-08')).toBe('2026-06-08'); // Mon
  });
  it('giữa tuần trả về thứ Hai cùng tuần', () => {
    expect(getWeekStart('2026-06-11')).toBe('2026-06-08'); // Thu
  });
  it('Chủ nhật thuộc tuần bắt đầu từ thứ Hai TRƯỚC đó', () => {
    expect(getWeekStart('2026-06-14')).toBe('2026-06-08'); // Sun
  });
  it('qua ranh giới tháng', () => {
    expect(getWeekStart('2026-06-02')).toBe('2026-06-01'); // Tue → Mon 01/06
    expect(getWeekStart('2026-05-31')).toBe('2026-05-25'); // Sun cuối tháng 5
  });
});

describe('computeWeeklyReview', () => {
  const mkLog = (date: string, done: number): DayLog => ({
    date,
    routines: { a: done > 0, b: done > 1, c: done > 2 },
    note: '',
  });
  const mkTask = (completedAt: string): Task => ({
    id: completedAt, title: 't', tier: 'MANA', completed: true, completedAt, createdAt: completedAt,
  });
  const mkTr = (date: string, amount: number): Transaction => ({
    id: date + amount, title: 'x', amount, type: 'EXPENSE', category: 'Gym & Nutrition', date,
  });

  it('tách đúng 2 kỳ tuần và cộng đúng số liệu', () => {
    const review = computeWeeklyReview({
      // tuần review: 01–07/06; tuần trước đó: 25–31/05
      weekStart: '2026-06-01',
      logs: [mkLog('2026-06-01', 3), mkLog('2026-06-07', 1), mkLog('2026-05-25', 2), mkLog('2026-06-08', 3)],
      tasks: [mkTask('2026-06-03')],
      archivedTasks: [mkTask('2026-05-26'), mkTask('2026-06-07')],
      transactions: [mkTr('2026-06-02', 100), mkTr('2026-05-31', 50), mkTr('2026-06-08', 999)],
      routineCount: 3,
    });
    expect(review.current).toMatchObject({
      start: '2026-06-01', end: '2026-06-07',
      routineDone: 4, routineTotal: 21, tasksCompleted: 2, spend: 100,
    });
    expect(review.previous).toMatchObject({
      start: '2026-05-25', end: '2026-05-31',
      routineDone: 2, tasksCompleted: 1, spend: 50,
    });
  });

  it('task chưa completed hoặc thiếu completedAt không được đếm', () => {
    const review = computeWeeklyReview({
      weekStart: '2026-06-01',
      logs: [], transactions: [], archivedTasks: [],
      tasks: [{ id: '1', title: 't', tier: 'BOSS', completed: false, completedAt: '2026-06-02', createdAt: '2026-06-02' },
              { id: '2', title: 't', tier: 'BOSS', completed: true, createdAt: '2026-06-02' }],
      routineCount: 6,
    });
    expect(review.current.tasksCompleted).toBe(0);
  });
});

describe('hasWeeklyActivity', () => {
  const base = { start: '2026-06-01', end: '2026-06-07', routineDone: 0, routineTotal: 42, tasksCompleted: 0, spend: 0 };
  it('tuần trống → false', () => expect(hasWeeklyActivity(base)).toBe(false));
  it('có routine/task/chi tiêu → true', () => {
    expect(hasWeeklyActivity({ ...base, routineDone: 1 })).toBe(true);
    expect(hasWeeklyActivity({ ...base, tasksCompleted: 1 })).toBe(true);
    expect(hasWeeklyActivity({ ...base, spend: 1 })).toBe(true);
  });
});
