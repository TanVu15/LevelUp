# SPEC: feat-quest-datepicker
Version: 1.0.0 | Status: APPROVED | Date: 2026-06-04

## Summary
Cải thiện UX form tạo quest: default date = hôm nay (không để trống),
thêm 3 quick-pick buttons (Hôm nay / Ngày mai / Tuần này) để chọn nhanh.

## Requirements

### REQ-QD1: Default due date = today
WHEN QuestBoard component mounts,
THE due date state SHALL initialize to today's ISO date string (YYYY-MM-DD).
Rationale: User thường tạo task cho hôm nay hoặc ngày gần; default empty gây friction.

### REQ-QD2: Native date picker
THE date input SHALL keep type="date" (native calendar picker — không thêm dependency).

### REQ-QD3: Quick buttons — Hôm nay
WHEN user clicks "Hôm nay",
THE system SHALL set newDueDate to today's ISO date.

### REQ-QD4: Quick buttons — Ngày mai
WHEN user clicks "Ngày mai",
THE system SHALL set newDueDate to tomorrow's ISO date (today + 1 day).

### REQ-QD5: Quick buttons — Tuần này
WHEN user clicks "Tuần này",
THE system SHALL set newDueDate to the Friday of the current calendar week.
- If today IS Friday, set to today.
- If today is Saturday or Sunday, set to the coming Friday (next week).
Rationale: "Tuần này" = end of current work week.

### REQ-QD6: Clear button retained
THE existing ✕ xóa button SHALL remain and reset newDueDate to empty string.

### REQ-QD7: min= attribute
The date input min= attribute SHALL remain getTodayStr() to prevent past dates.

## Unwanted Patterns
- KHÔNG hardcode date strings
- Quick button functions SHALL use the same getTodayStr() helper already in the file
- KHÔNG thêm external date library (day.js, date-fns, etc.)

## Definition of Done
- [ ] newDueDate default = today on mount
- [ ] "Hôm nay" button sets to today
- [ ] "Ngày mai" button sets to tomorrow
- [ ] "Tuần này" button sets to Friday of current week (or next Friday if weekend)
- [ ] Clear button resets to ''
- [ ] No TypeScript errors
