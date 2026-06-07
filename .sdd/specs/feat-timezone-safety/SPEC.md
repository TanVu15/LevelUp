# SPEC — Timezone-Safe Local Dates
# feat-timezone-safety | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Mọi "ngày" trong app được tính bằng `new Date().toISOString().split('T')[0]` → trả về ngày
theo **UTC**, không phải lịch **local** của user. Với user VN (UTC+7), trong khung
**00:00–07:00 sáng** giờ địa phương, `toISOString()` vẫn trả về ngày HÔM QUA.

Hệ quả (ảnh hưởng cơ chế cốt lõi):
- `ironwill_last_open_date` so sánh sai → date-reset effect chạy nhầm ngày → streak tăng/reset sai,
  routine reset sai thời điểm, auto-archive nhầm.
- Daily XP cap / per-tier cap key theo ngày sai → cap reset lệch.
- `transaction.date`, `task.createdAt`, `DayLog.date` lệch 1 ngày trong khung sáng sớm.

Logic date còn bị **lặp** ở 6 file (`App.tsx`, `QuestBoard.tsx`, `TreasuryBoard.tsx`,
`Timeline.tsx`, `schema.ts`, `JourneyLogs.tsx`), mỗi nơi tự định nghĩa → khó sửa nhất quán.
`Timeline.tsx` thậm chí mâu thuẫn nội bộ: có `toISO` (local-safe) nhưng `getTodayDateString` vẫn UTC.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Module date tập trung
THE system SHALL có `src/utils/date.ts` export các hàm thuần, tính theo **local calendar**:
- `toISODate(date: Date): string` → `YYYY-MM-DD` theo getFullYear/getMonth/getDate (local).
- `getTodayDateString(): string` → `toISODate(new Date())`.
- `getCurrentYearMonth(): string` → `YYYY-MM` local.
- `addDays(iso: string, days: number): string` → parse `iso` ở local midnight (`iso + 'T00:00:00'`),
  cộng/trừ ngày, trả `YYYY-MM-DD`. Hỗ trợ `days` âm.

Mọi hàm có return type rõ ràng (ENG-01). KHÔNG dùng `toISOString()` để lấy phần ngày.

### REQ-02 — Thay thế toàn bộ usage UTC
THE system SHALL thay mọi `new Date().toISOString().split('T')[0]` và
`new Date().toISOString().slice(0,7)` (lấy ngày/tháng hiện tại) bằng hàm từ `date.ts`:
- `App.tsx`: bỏ định nghĩa local `getTodayDateString`, import từ util. `slice(0,7)` → `getCurrentYearMonth()`.
- `QuestBoard.tsx`: `newDueDate` default, `getTodayStr`, `getTomorrowStr`, `getEndOfWeekStr` dùng `getTodayDateString`/`addDays`.
- `TreasuryBoard.tsx`: `currentYMNow`, `last4Months` dùng `getCurrentYearMonth`/`addDays` (hoặc Date local) — KHÔNG `toISOString().slice`.
- `Timeline.tsx`: bỏ `getTodayDateString` UTC + `toISO` trùng lặp → import `getTodayDateString`/`toISODate` từ util; giữ `subDays`/`fmtDate` (presentation/Date-helper).
- `schema.ts`: `exportBackup` dùng `getTodayDateString()` cho `exportedAt` + tên file.

### REQ-03 — Backward-compatible, không đổi key
DATA-01: KHÔNG đổi tên localStorage key. Format chuỗi ngày vẫn `YYYY-MM-DD` / `YYYY-MM`
→ dữ liệu cũ vẫn đọc/so sánh được như chuỗi.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Dùng `toISOString()` để lấy phần ngày/tháng hiện tại (UTC bug). Chỉ được dùng cho timestamp đầy đủ nếu thật sự cần UTC.
- ❌ Để lại định nghĩa `getTodayDateString` trùng lặp trong từng file.
- ❌ Parse `YYYY-MM-DD` bằng `new Date(iso)` (UTC midnight) khi cần local — phải `new Date(iso + 'T00:00:00')`.
- ❌ Đổi tên / format localStorage key (DATA-01).
- ❌ Đọc localStorage trong child component (ARCH-02).
- ❌ `any`.

## 4. Edge Cases
- **One-time transition**: user UTC+7 mở app trong 00:00–07:00 ngay lần đầu sau fix →
  `lastOpenDate` (lưu kiểu UTC cũ) so với `today` (local mới) có thể lệch 1 → một lần rollover
  thêm (streak +1 hoặc reset / archive). Chấp nhận được, chỉ xảy ra 1 lần & chỉ trong khung sáng sớm.
  Đa số user mở ban ngày (UTC+7 daytime = cùng calendar day UTC) nên không bị.
- `addDays` qua mốc tháng/năm: dựa vào `Date` nên tự xử lý đúng.
- User ở UTC hoặc UTC- : local == hoặc sớm hơn UTC → fix vẫn đúng (local là chuẩn).

## 5. Definition of Done
- [x] `src/utils/date.ts` mới với `toISODate`, `getTodayDateString`, `getCurrentYearMonth`, `addDays`.
- [x] `App.tsx`, `QuestBoard.tsx`, `TreasuryBoard.tsx`, `Timeline.tsx`, `schema.ts` dùng util, bỏ UTC.
- [x] `npm run lint` (tsc --noEmit) pass, không `any`, không còn `toISOString().split`/`.slice` cho ngày hiện tại (trừ JourneyLogs.tsx dead-code sẽ xoá ở task sau).
- [x] Update CLAUDE.md: Task 6 ✅, ghi ADR/known-issue resolved.

## 6. ADR liên quan
- Liên quan Task 6 (Timezone safety) + đặt nền cho Task 3 (tách pure logic `utils/date.ts`).
