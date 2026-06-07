# SPEC — Custom Routines (Đường Ray Kỷ Luật tùy biến)
# feat-custom-routines | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
6 routine của "Đường Ray Kỷ Luật" đang cố định cứng (chỉ đổi được nhãn/mô tả). User muốn
tự thêm/xóa/sửa routine của riêng mình, nhưng giữ bộ 6 mặc định làm **template** để khôi phục.

Quyết định đã chốt: icon chọn từ bộ có sẵn (~12); tối đa 8 routine; "Khôi phục mẫu gốc" = thay
toàn bộ về 6 mặc định (có modal xác nhận).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Mô hình dữ liệu
THE `types.ts` SHALL có `RoutineDef { id: string; label: string; desc: string; iconName: string }`.
THE state `routines: RoutineDef[]` là **nguồn sự thật duy nhất** cho bộ routine (thay `routineLabels`/`routineDescs`).
- localStorage key `ironwill_routines` (json).
- `dailyRoutines` và `DayLog.routines`/`routineXpClaimed` GIỮ NGUYÊN dạng `Record<id, boolean>` keyed theo `id` → không mất chuỗi/XP cũ.

### REQ-02 — Icon registry + template mặc định
THE `src/data/routines.ts` SHALL export:
- `ROUTINE_ICONS: Record<string, { Icon, color }>` (~12 icon lucide + class màu).
- `DEFAULT_ROUTINES: RoutineDef[]` (6 routine gốc: eat/pray/train/study/work/sleep, iconName trỏ vào registry).
- `makeRoutineId()` tạo id duy nhất cho routine mới.

### REQ-03 — Migration (user cũ không mất dữ liệu)
WHEN không có `ironwill_routines`, THE App SHALL dựng `routines` từ `DEFAULT_ROUTINES` áp `routineLabels`/`routineDescs`
cũ (nếu có). Tương tự khi `applyGameState`/import mà thiếu `routines` → build từ legacy labels/descs.

### REQ-04 — Handlers
THE App SHALL có: `addRoutine(label, desc, iconName)` (chặn khi đã đủ 8), `updateRoutine(id, patch)`,
`deleteRoutine(id)` (xóa khỏi routines + dọn key trong dailyRoutines), `restoreDefaultRoutines()` (set = DEFAULT_ROUTINES).

### REQ-05 — Generalize "tất cả" + đếm theo N
THE logic phụ thuộc "6" SHALL tính theo số routine hiện tại N:
- OVERDRIVE (+50) fire khi HOÀN THÀNH TẤT CẢ routine hiện có (`routines.every(r => dailyRoutines[r.id])`), 1 lần/ngày (giữ `overdriveXpClaimed`).
- Reset routine hằng ngày (mount date-reset + applyGameState newday): set tất cả id hiện tại = false (không hardcode 6 id).
- "X / N CLEARED" hiển thị theo N.
- Daily challenge `routines_all`: đạt khi completedRoutines >= N (truyền N vào `checkChallengeCondition`).
- `routines_min` giữ ngưỡng (3/4) nhưng nếu N < ngưỡng thì điều kiện = hoàn thành hết.

### REQ-06 — Giới hạn 1..8
THE số routine SHALL trong [1, 8]. UI ẩn nút Thêm khi đã 8; không cho xóa routine cuối cùng (giữ ≥1).

### REQ-07 — UI Quest Board
THE QuestBoard SHALL: render routine từ `routines` prop; nút Thêm (nhập tên + mô tả + chọn icon từ grid ~12);
nút Xóa mỗi routine; sửa nhãn/mô tả tại chỗ (như cũ, nhưng cập nhật `routines`); nút "Khôi phục mẫu gốc"
mở modal xác nhận (KHÔNG `confirm()`), đồng ý → `restoreDefaultRoutines()`.

### REQ-08 — Sync mọi điểm
THE field `routines` SHALL có trong `GameState` (firestoreSync), `BackupData` (schema), `applyGameState`,
first-login push, debounced sync, `handleExport`, `handleImportConfirm`. `routineLabels`/`routineDescs`
giữ optional trong type cũ CHỈ để đọc legacy (ngừng ghi).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Đổi key `dailyRoutines`/`DayLog` sang index/label (phải giữ theo `id` → bảo toàn streak/XP).
- ❌ Hardcode số 6 trong logic OVERDRIVE/reset/đếm/challenge.
- ❌ Hai nguồn sự thật (vừa routines vừa labels/descs) — labels/descs chỉ để migrate đọc 1 lần.
- ❌ Cho >8 hoặc 0 routine.
- ❌ `confirm()`/`alert()` cho khôi phục mẫu (ADR-005) — dùng modal.
- ❌ Lưu component icon trong state — chỉ lưu `iconName` (string), map qua registry.
- ❌ Bỏ sót `routines` ở bất kỳ điểm sync/export/import (bài học routineDescs).
- ❌ `any`.

## 4. Edge Cases
- User cũ (có labels/descs, chưa có routines) → build từ template + overrides, giữ nguyên id cũ.
- Xóa routine đang dở dang trong ngày → key thừa trong dailyRoutines/DayLog vô hại (chỉ đọc theo routines hiện tại); dọn khỏi dailyRoutines để OVERDRIVE "all" không kẹt vì key cũ true.
- iconName không có trong registry (backup lạ) → fallback icon mặc định.
- Khôi phục mẫu gốc giữa ngày → dailyRoutines reset theo id mặc định; XP routine đã nhận hôm nay (routineXpClaimed theo id) không bị hoàn (chấp nhận).
- Import backup cũ không có routines → build từ legacy.

## 5. Definition of Done
- [x] `types.ts` RoutineDef; `data/routines.ts` registry + DEFAULT_ROUTINES + makeRoutineId + buildRoutinesFromLegacy.
- [x] `challenge.ts` nhận totalRoutines cho routines_all/routines_min.
- [x] `firestoreSync.ts` + `schema.ts`: field `routines?` (+ legacy optional).
- [x] `App.tsx`: state + migration + handlers + generalize reset/OVERDRIVE/đếm + sync mọi điểm; bỏ routineLabels/routineDescs state.
- [x] `QuestBoard.tsx`: render từ routines + thêm/xóa/sửa + icon picker + khôi phục mẫu (modal).
- [x] `npm run lint` + `npm test` (34) + `npm run build` pass; thêm test routines_all/min theo N.
- [x] Update CLAUDE.md (ADR-014: custom routines).

## 6. ADR liên quan
- ADR mới (custom routines, single source `routines`, template khôi phục). Giữ ADR-009 (cap số routine ≤8 chống lạm phát XP).
