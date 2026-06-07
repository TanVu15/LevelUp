# SPEC — Extract Pure Game Logic to utils/
# feat-pure-logic-extraction | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Toàn bộ logic game thuần (XP curve, rank, daily caps, daily challenge, streak rollover)
đang bị nhốt trong `App.tsx` (940 dòng — vi phạm ENG-02 < 400 dòng) → không thể unit-test,
khó đọc. Tách các hàm THUẦN (không phụ thuộc React/state/localStorage) ra `src/utils/`
để mở đường cho Vitest (Task tiếp theo) và giảm kích thước `App.tsx`.

Chỉ tách phần THUẦN. State, setState, side-effect, JSX vẫn ở `App.tsx`.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — utils/xp.ts
THE system SHALL có `src/utils/xp.ts` export (giữ NGUYÊN giá trị hiện tại — không đổi behavior):
- `type Rank = 'E-Rank' | 'D-Rank' | 'C-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank'`.
- `getRankForLevel(level: number): Rank` — ngưỡng 6/11/21/36/51 (ADR-008).
- `getXpNeeded(level: number): number` — piecewise ×120/×100/×80/×65/×50 (ADR-008).
- `DAILY_TASK_XP_CAP = 150`.
- `DAILY_TIER_CAPS: Record<TaskTier, number> = { BOSS: 2, DUNGEON: 4, MANA: 5 }` (ADR-009).

### REQ-02 — utils/challenge.ts
THE system SHALL có `src/utils/challenge.ts` export `DailyChallenge` interface,
`DAILY_CHALLENGES` array (7 challenge giữ nguyên), `getDailyChallenge(dateStr): DailyChallenge`
(hash deterministic theo ngày), `checkChallengeCondition(challenge, dailyRoutines, tasks, today): boolean`.
Behavior giữ NGUYÊN.

### REQ-03 — utils/streak.ts
THE system SHALL có `src/utils/streak.ts` export:
- `getStreakMilestoneMsg(n: number): string` (giữ nguyên 7/14/21/28 + default).
- `computeStreakRollover(prevStreak, prevShields, yesterdayScore, daysDiff): StreakResult` — hàm THUẦN
  tái hiện CHÍNH XÁC logic streak trong mount effect:
  - `daysDiff === 1` & `score >= 3`: streak+1; nếu streak mới `% 7 === 0` → `shields = min(2, prev+1)`, `milestoneReached = true`.
  - `daysDiff === 1` & `score < 3` & `prevShields > 0`: `shields = prev-1` (shield cứu streak, streak giữ nguyên).
  - `daysDiff === 1` & `score < 3` & `prevShields === 0`: `streak = 0` (reset).
  - `daysDiff !== 1` (bỏ nhiều ngày): `streak = 0` (reset).
  - `StreakResult = { streak, shields, milestoneReached, reset }`.

### REQ-04 — App.tsx dùng util, mount effect refactor
THE `App.tsx` SHALL import các hàm trên thay cho định nghĩa inline, và mount date-reset effect
SHALL dùng `computeStreakRollover` rồi apply kết quả qua setState. Side-effect (toast khi
`milestoneReached`, unlock `ach1` khi `streak >= 7`) vẫn nằm ở App.tsx, dựa trên `StreakResult`.

### REQ-05 — Khử trùng lặp DAILY_TIER_CAPS ở QuestBoard
THE `QuestBoard.tsx` SHALL import `DAILY_TIER_CAPS` từ `utils/xp.ts` thay vì định nghĩa bản sao (xoá comment "Mirror of App.tsx").

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Đổi giá trị XP curve / rank thresholds / caps / challenge (đây là refactor THUẦN, không đổi behavior).
- ❌ Đưa setState / localStorage / React hook vào file `utils/*` (phải pure).
- ❌ Để lại định nghĩa trùng lặp trong `App.tsx` / `QuestBoard.tsx` sau khi đã export ra util.
- ❌ Sửa luôn bug `addXP` `if`→`while` ở task NÀY (thuộc task sau, tránh trộn scope).
- ❌ `any`.

## 4. Edge Cases
- `computeStreakRollover` với `daysDiff <= 0` (clock lùi): rơi vào nhánh `daysDiff !== 1` → reset (giữ đúng hành vi `else` hiện tại).
- Shields đã ở mức 2 mà tới mốc %7: `min(2, prev+1)` giữ 2 nhưng `milestoneReached = true` (toast vẫn hiện — giống hành vi cũ).
- `getDailyChallenge` cùng `dateStr` luôn trả cùng challenge (deterministic) — bất biến cần giữ.

## 5. Definition of Done
- [x] `utils/xp.ts`, `utils/challenge.ts`, `utils/streak.ts` tạo mới, pure, có return type.
- [x] `App.tsx` import + mount effect dùng `computeStreakRollover`; xoá định nghĩa inline đã chuyển đi (940→847 dòng).
- [x] `QuestBoard.tsx` import `DAILY_TIER_CAPS` từ util.
- [x] `npm run lint` pass, không `any`. Behavior không đổi.
- [x] Update CLAUDE.md: Task 3 ✅.

## 6. ADR liên quan
- Hỗ trợ ADR-008 (XP formula) + ADR-009 (anti-exploit caps) — giữ nguyên giá trị, chỉ đổi vị trí.
