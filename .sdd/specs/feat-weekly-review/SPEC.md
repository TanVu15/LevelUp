# SPEC — Weekly Review ritual (tổng kết tuần)
# feat-weekly-review | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
Monthly review (ADR-010) tạo accountability ritual 1 lần/tháng — quá thưa cho habit
loop. Tuần là chu kỳ tự nhiên của lịch sống; review tuần = reflection moment + endowed
progress nhìn thấy được → retention (đề xuất E1 của UI/UX review 2026-06-11).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Pure logic (utils/weekly.ts, unit-tested)
- `getWeekStart(dateStr)`: thứ Hai (LOCAL) của tuần chứa dateStr — YYYY-MM-DD.
- `computeWeeklyReview({ logs, tasks, archivedTasks, transactions, routineCount, weekStart })`
  → `{ weekStart, weekEnd, current, previous }`, mỗi kỳ:
  `routineDone` (tổng tick routine), `routineTotal` (routineCount×7), `tasksCompleted`
  (completedAt trong kỳ, gộp tasks+archived), `spend` (EXPENSE trong kỳ).
  `current` = tuần [weekStart..weekStart+6], `previous` = tuần liền trước.
- `hasWeeklyActivity(period)`: routineDone>0 || tasksCompleted>0 || spend>0.

### REQ-02 — Trigger (App.tsx, effect riêng — KHÔNG đụng mount effect hiện có)
- Marker `ironwill_weekly_review_done` = weekStart của tuần ĐÃ xử lý.
- Khi mount: nếu `onboardingDone` && marker !== getWeekStart(today) → tính review
  cho TUẦN TRƯỚC (weekStart = getWeekStart(today) − 7). Nếu tuần trước có activity
  → set state `weeklyReview` (mở modal). Dù hiện hay không, set marker =
  getWeekStart(today) (user mới/tuần trống không bị hỏi lại).
- KHÔNG cộng XP (reflection không phải nguồn XP — tránh mở surface exploit mới).

### REQ-03 — WeeklyReviewModal
- Style theo MonthlyReviewModal/LevelUpModal (dark, font-mono, orange).
- Nội dung: "// WEEKLY DEBRIEF" + khoảng ngày; 3 hàng so sánh tuần trước vs tuần
  trước nữa (routine X/Y + %, nhiệm vụ hoàn thành, tổng chi) với mũi tên ↑/↓/→ màu
  theo chiều TỐT (routine/task: tăng=emerald; chi tiêu: giảm=emerald, tăng=rose).
- 1 nút đóng "Bắt đầu tuần mới →". Không backdrop-dismiss (ritual — nhưng cho đóng
  bằng nút là đủ, không ép nhập gì).

## 3. Unwanted Patterns
- ❌ Sửa mount date-reset effect hiện có (rủi ro cao — effect riêng độc lập).
- ❌ XP reward (xem REQ-02).
- ❌ Sync marker lên Firestore (như last_open_date — local là đủ, tệ nhất hiện lại 1 lần trên máy khác).

## 4. Edge Cases
- User mới (không activity tuần trước): không modal, marker vẫn set.
- Mở app lần đầu giữa tuần sau nhiều tuần nghỉ: review tuần liền trước (có thể trống → skip) — không dồn nhiều tuần.
- routineCount hiện tại áp cho quá khứ (routine có thể đã thêm/xóa): chấp nhận, % chỉ là tham chiếu.
- Đụng MonthlyReviewModal đầu tháng (1 ngày vừa đầu tuần vừa đầu tháng): cả 2 cùng render → Weekly z-index thấp hơn/render TRƯỚC Monthly trong DOM để Monthly đè (ưu tiên ritual tháng); user đóng Monthly thì thấy Weekly.

## 5. Definition of Done
- [x] utils/weekly.ts + 8 unit tests (getWeekStart Mon/Sun/tháng; compute 2 kỳ; activity check).
- [x] WeeklyReviewModal + trigger effect + marker; e2e/screenshot scripts seed marker để không nhiễu.
- [x] lint + test (46) + build + e2e (3) pass. Screenshot xác nhận modal.
