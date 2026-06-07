// Pure streak rollover logic. No React, no state, no localStorage.

export function getStreakMilestoneMsg(n: number): string {
  if (n === 7)  return '🔥 7 NGÀY STREAK — Habit đang hình thành trong não bộ!';
  if (n === 14) return '⚡ 14 NGÀY — Hai tuần không gục ngã. Pattern mới đang cài đặt!';
  if (n === 21) return '👑 21 NGÀY — Mốc vàng của habit formation theo khoa học thần kinh!';
  if (n === 28) return '🏆 28 NGÀY — Một tháng kỷ luật tuyệt đối. Bạn đã chứng minh được!';
  return `🌟 ${n} NGÀY STREAK — Tiếp tục chiến đấu, không dừng lại!`;
}

export interface StreakResult {
  streak: number;
  shields: number;
  milestoneReached: boolean; // hit a 7-day boundary → show toast + (try to) gain a shield
  reset: boolean;            // streak fell back to 0
}

const MAX_SHIELDS = 2;
const ROUTINE_SCORE_THRESHOLD = 3; // >= 3 routines done yesterday keeps the streak alive

/**
 * Compute the streak/shield transition when the app opens on a new day.
 * Mirrors the original mount date-reset logic exactly (ADR-006 loss-aversion shields).
 *
 * @param prevStreak     streak before today
 * @param prevShields    shields before today
 * @param yesterdayScore routines completed yesterday (0..6)
 * @param daysDiff       calendar days between lastOpenDate and today
 */
export function computeStreakRollover(
  prevStreak: number,
  prevShields: number,
  yesterdayScore: number,
  daysDiff: number,
): StreakResult {
  // Skipped more than one day (or clock moved backwards) → streak resets.
  if (daysDiff !== 1) {
    return { streak: 0, shields: prevShields, milestoneReached: false, reset: true };
  }

  if (yesterdayScore >= ROUTINE_SCORE_THRESHOLD) {
    const streak = prevStreak + 1;
    const milestoneReached = streak % 7 === 0;
    const shields = milestoneReached ? Math.min(MAX_SHIELDS, prevShields + 1) : prevShields;
    return { streak, shields, milestoneReached, reset: false };
  }

  // Missed the threshold — a shield absorbs the loss, otherwise streak resets.
  if (prevShields > 0) {
    return { streak: prevStreak, shields: prevShields - 1, milestoneReached: false, reset: false };
  }
  return { streak: 0, shields: prevShields, milestoneReached: false, reset: true };
}
