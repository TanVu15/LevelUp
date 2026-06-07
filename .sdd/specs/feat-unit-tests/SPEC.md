# SPEC — Unit Tests (Vitest) cho Pure Game Logic
# feat-unit-tests | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Logic phức tạp & rủi ro cao nhất (XP curve, daily caps, streak rollover, daily challenge,
date timezone) giờ đã là hàm THUẦN trong `src/utils/` (feat-pure-logic-extraction +
feat-timezone-safety) nhưng CHƯA có test → mỗi lần sửa dễ hồi quy. Thêm Vitest + test suite
khóa hành vi (regression guard).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Vitest setup
THE project SHALL có `vitest` (devDependency) + script `"test": "vitest run"` và `"test:watch": "vitest"`.
Test chạy môi trường `node` (logic thuần, không cần DOM). KHÔNG cần config file nếu default đủ;
nếu cần thì `vitest.config.ts` tối thiểu.

### REQ-02 — Test utils/date.ts
- `toISODate` format local YYYY-MM-DD, pad 2 chữ số.
- `addDays` cộng/trừ qua mốc tháng & năm đúng (vd `2026-01-31` +1 = `2026-02-01`, `2026-03-01` -1 = `2026-02-28`).
- `getCurrentYearMonth` = `getTodayDateString().slice(0,7)`.

### REQ-03 — Test utils/xp.ts
- `getRankForLevel` đúng ngưỡng: 5→E, 6→D, 11→C, 21→B, 36→A, 51→S (ADR-008).
- `getXpNeeded` đúng piecewise: L10=1200, L11=1100, L20=2000, L21=1680, L35=2800, L36=2340, L50=3250, L51=2550.
- `DAILY_TASK_XP_CAP === 150`, `DAILY_TIER_CAPS` = BOSS2/DUNGEON4/MANA5.

### REQ-04 — Test utils/streak.ts (quan trọng nhất)
`computeStreakRollover` cover mọi nhánh (ADR-006):
- `daysDiff===1` & score≥3 → streak+1, reset=false.
- streak mới chạm bội số 7 → `milestoneReached=true`, shields+1 (cap 2).
- shields đã =2 & chạm mốc 7 → shields giữ 2 nhưng `milestoneReached=true`.
- score<3 & shields>0 → shields-1, streak giữ nguyên, reset=false.
- score<3 & shields=0 → streak=0, reset=true.
- `daysDiff>1` (bỏ ngày) → streak=0, reset=true (bất kể score/shields).
- `getStreakMilestoneMsg` trả đúng message 7/14/21/28 + default.

### REQ-05 — Test utils/challenge.ts
- `getDailyChallenge` deterministic (cùng dateStr → cùng challenge), index trong [0, len).
- `checkChallengeCondition` đúng cho từng `type` (routines_min, routines_all, boss_task, dungeon_tasks_min, any_tasks_min), chỉ đếm task `completed && claimedAt===today`.

### REQ-06 — Test suite pass
`npm test` SHALL pass toàn bộ. `npm run lint` vẫn pass.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Test phụ thuộc `Date.now()` thật cho assertion cố định (dùng input cố định / fake timers nếu cần `getTodayDateString`).
- ❌ Test chạm localStorage / React / DOM (đây là pure-logic test).
- ❌ Sửa logic `src/utils/*` để "vừa" test (test phải phản ánh behavior hiện tại; nếu phát hiện bug thật → ghi vào SPEC, xử lý ở task tương ứng).
- ❌ `any` trong test.

## 4. Edge Cases
- `addDays` qua năm nhuận / cuối năm.
- `computeStreakRollover` với `daysDiff <= 0` → nhánh reset (giống `daysDiff!==1`).
- `getDailyChallenge('')` không crash.

## 5. Definition of Done
- [x] `vitest` cài, script `test`/`test:watch` trong package.json.
- [x] `src/utils/__tests__/` : `date.test.ts`, `xp.test.ts`, `streak.test.ts`, `challenge.test.ts`.
- [x] `npm test` pass (28 tests), `npm run lint` pass.
- [x] Update CLAUDE.md: Task 4 ✅.

## 6. ADR liên quan
- Khóa hành vi ADR-006 (streak/shield), ADR-008 (XP), ADR-009 (caps).
