# SPEC — Focus timer: đếm theo đồng hồ thật + cap XP/ngày
# feat-focus-timer-hardening | Status: IN-PROGRESS | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
UI/UX review 2026-06-11 phát hiện 2 lỗi ở CHRONO ARENA (QuestBoard):
1. **Lỗ hổng XP duy nhất còn lại:** timer +25 XP không gate qua DayLog (mọi nguồn khác
   đều có — ADR-009). Treo tab chạy timer lặp = XP vô hạn "hợp lệ".
2. **Đếm bằng `setInterval` tick 1s:** mobile khóa màn hình/chuyển app → interval bị
   throttle/suspend → phiên 25' đứng hình. Bản chất phiên focus là cất điện thoại đi
   → tính năng hỏng đúng ở use-case chính của nó.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Đếm theo timestamp
- State: `endsAt: number | null` (epoch ms; null = không chạy) + `remainingSec`.
- Start/Resume: `endsAt = Date.now() + remainingSec*1000`. Pause: tính lại
  `remainingSec = max(0, ceil((endsAt-now)/1000))`, `endsAt = null`.
- Interval (500ms, chỉ để re-render): `remaining = ceil((endsAt-now)/1000)` từ đồng
  hồ thật — KHÔNG trừ dần state. Background bị suspend → quay lại tick kế tiếp tự
  đúng giờ; hết giờ trong lúc nền → hoàn thành ngay khi quay lại (visibilitychange
  không cần listener riêng — tick đầu khi visible đã tính từ Date.now()).
- Hoàn thành: sound + `onFocusComplete()` + reset remaining = preset.

### REQ-02 — Cap XP focus theo ngày
- `utils/xp.ts`: `FOCUS_XP = 25`, `DAILY_FOCUS_CAP = 4` (100 XP/ngày — ngang 1 BOSS).
- `DayLog.focusSessionsClaimed?: number` (types.ts) — đếm phiên ĐÃ NHẬN XP hôm nay,
  KHÔNG reset (nằm trong logs, tự sync/export như mọi DayLog field).
- App.tsx `handleFocusComplete(): boolean` — đọc count từ DayLog hôm nay; `< cap` →
  `addXP(FOCUS_XP)` + tăng count, return true; ngược lại return false (timer vẫn
  chạy được — vẫn là công cụ tập trung, chỉ hết XP).
- QuestBoard props: BỎ `addXP`, THÊM `onFocusComplete: () => boolean` +
  `focusSessionsToday: number`.

### REQ-03 — UI minh bạch cap
- Dưới timer: "Phiên +XP hôm nay: X/4". Khi X ≥ 4: "Đã đạt giới hạn XP — phiên vẫn
  được tính giờ." (giọng trung tính, không phạt).

## 3. Unwanted Patterns
- ❌ setInterval trừ dần state (lý do sửa).
- ❌ Side-effect trong functional updater.
- ❌ Field mới ở GameState/BackupData (focusSessionsClaimed nằm TRONG DayLog → tự đi theo logs).

## 4. Edge Cases
- Hết giờ khi đang nền: tick đầu khi quay lại visible → remaining ≤ 0 → complete +
  award. KHÔNG complete 2 lần (endsAt set null ngay khi complete).
- Đổi preset khi đang chạy: nút preset disabled khi running (giữ nguyên hành vi cũ).
- Pause ngay sát 0s: remaining clamp ≥ 0.
- 23:59 bắt đầu, 00:20 kết thúc: count ghi vào DayLog của ngày HOÀN THÀNH (getTodayDateString lúc complete) — đơn giản, chấp nhận.

## 5. Definition of Done
- [ ] QuestBoard timer timestamp-based; App handler + props mới; types + xp constants.
- [ ] UI hiển thị X/4.
- [ ] `npm run lint` + `npm test` + `npm run build` + `npm run test:e2e` pass.

## 6. ADR liên quan
- ADR-009 (anti-exploit XP) — đóng lỗ hổng cuối.
