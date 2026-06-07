# SPEC — Export / Import JSON Backup
# feat-export-import | Status: BUGFIX | Owner: @tanvu15 | 2026-06-07
# (Hồi tố cho ADR-012; tạo do phát hiện Import bị mồ côi)

## 1. Bối cảnh
ADR-012 định nghĩa Export/Import JSON backup. UI Import ban đầu nằm trong `JourneyLogs.tsx`.
Khi tab JOURNEY được refactor sang `Timeline.tsx`, `JourneyLogs` bị bỏ import (dead code) →
**Import không còn truy cập được** dù `handleImportRequest`/`ImportConfirmModal`/`handleImportConfirm`
vẫn tồn tại trong App.tsx. Export vẫn hoạt động (Timeline có `onExport`).

## 2. Bug (REQ)
### BUG-01 — Import mồ côi
- `JourneyLogs.tsx` không được import ở bất kỳ đâu (dead code).
- `handleImportRequest` (App.tsx) không bao giờ được truyền làm prop.
- `Timeline` không có `onImportRequest` → không có nút/flow Import.

### FIX (SHALL)
- THE `Timeline` SHALL nhận prop `onImportRequest: (backup: BackupData) => void`.
- THE `Timeline` SHALL có nút "Import Backup" + `<input type="file">` ẩn, đọc file JSON,
  `validateBackup()` rồi gọi `onImportRequest` (mở `ImportConfirmModal`).
- File lỗi → hiện `importError` inline (KHÔNG `alert()`).
- THE App.tsx SHALL truyền `onImportRequest={handleImportRequest}` vào `Timeline`.
- Reset `input.value` sau mỗi lần chọn để chọn lại cùng file được.

## 3. Unwanted Patterns
- ❌ Để `handleImportRequest` định nghĩa nhưng không wire (dead handler).
- ❌ Dùng `alert()`/`confirm()` cho lỗi import hoặc xác nhận (ADR-005 → dùng ImportConfirmModal).
- ❌ Đọc/ghi localStorage trực tiếp trong Timeline (ARCH-02).
- ❌ Giữ `JourneyLogs.tsx` làm dead code gây nhầm lẫn (sẽ ghi chú; xoá là tuỳ chọn ngoài scope).

## 4. Edge Cases
- File không phải JSON / sai schema → `validateBackup` throw string → hiện inline error.
- Backup cũ thiếu `archivedTasks` → import OK, default `[]` (đã xử lý ở handleImportConfirm).
- Import xong → `ImportConfirmModal` hiện summary, user confirm/cancel.

## 5. Definition of Done
- [x] `Timeline.tsx`: prop + nút Import + file input + error.
- [x] `App.tsx`: truyền `onImportRequest`.
- [x] Playwright: import file backup hợp lệ → ImportConfirmModal mở; file rác → error; confirm áp dụng state + archivedTasks.
- [x] `tsc --noEmit` + build pass.
- [x] Ghi chú JourneyLogs là dead code trong CLAUDE.md.
