# SPEC — Daily Task Auto-Archive & Decluttered Board
# feat-task-archive | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Quest Board tích tụ task của những ngày cũ → lộn xộn, mất cảm giác "fresh start" mỗi ngày.
Trước đây task ngày cũ được giữ lại với badge `CARRIED OVER`. Logic mới:
**Sang ngày mới, task của ngày cũ tự dọn khỏi board** — nhưng KHÔNG xóa hẳn (vẫn cần
đếm cho achievement + cho user xem lại lịch sử).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Auto-archive khi sang ngày mới
WHEN mount date-reset effect phát hiện `lastOpenDate !== today`,
THE system SHALL chuyển mọi task KHÔNG-còn-liên-quan-tới-hôm-nay từ `tasks` sang `archivedTasks`.
- **Giữ lại trên board** (relevant) ⇔ task `!completed` VÀ có `dueDate >= today` (deadline hôm nay/tương lai, chưa làm xong).
- **Archive** mọi task còn lại: đã completed (bất kể deadline), hoặc incomplete đã quá hạn / không có deadline.
- Task được archive được PREPEND vào `archivedTasks` (mới nhất lên đầu), KHÔNG bị xóa.

### REQ-02 — Persist & Sync archivedTasks
THE system SHALL lưu `archivedTasks` vào localStorage key `ironwill_archived_tasks`,
đồng bộ qua Firestore (`GameState.archivedTasks`), và bao gồm trong Export/Import JSON (`BackupData.archivedTasks`).
DATA-01: key mới, không đổi key cũ. Backup/cloud cũ thiếu field → default `[]`.

### REQ-03 — completedAt tracking
THE `Task` SHALL có field optional `completedAt?: string` (YYYY-MM-DD).
- Set khi task chuyển sang `completed: true`.
- Xóa (undefined) khi task bị un-complete.
- Dùng cho bộ đếm "Đã hoàn thành hôm nay" + nhóm theo ngày trong Lịch sử.

### REQ-04 — Board chỉ hiện việc còn-liên-quan
THE QuestBoard tier list (BOSS/DUNGEON/MANA) SHALL chỉ render task `!completed`.
Task đã hoàn thành trong ngày được fold vào một dòng collapse riêng.

### REQ-05 — Dòng "Đã hoàn thành: X hôm nay" (collapsible)
THE QuestBoard SHALL hiển thị một dòng nhỏ `✓ Đã hoàn thành: {X} hôm nay`,
mặc định collapse, click để xem danh sách task hoàn thành hôm nay
(`completed && (completedAt === today || claimedAt === today)`).

### REQ-06 — Link "Lịch sử"
THE QuestBoard SHALL có link "Lịch sử" mở modal read-only liệt kê `archivedTasks`
nhóm theo ngày (`completedAt || createdAt`), mới nhất trước, kèm tier + trạng thái done/chưa.
Modal đóng bằng nút X / click backdrop (KHÔNG dùng `confirm()`/`alert()`).

### REQ-07 — Achievement & counter đếm cả archived
THE system SHALL tính các thống kê tổng hợp trên `[...tasks, ...archivedTasks]`:
- `ach2` (5 BOSS completed).
- `totalTasksCompleted` (truyền vào StatusHeader).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Xóa hẳn task ngày cũ (mất số đếm achievement). Phải archive.
- ❌ Để task đã completed của ngày cũ vẫn hiện trên tier list.
- ❌ Archive task incomplete có `dueDate` tương lai (vẫn còn liên quan).
- ❌ Đọc/ghi localStorage trực tiếp trong QuestBoard (ARCH-02) — đi qua props/App.tsx.
- ❌ Dùng `confirm()`/`alert()` cho modal Lịch sử (ADR-005).
- ❌ Tính `totalTasksCompleted`/`ach2` chỉ từ `tasks` (sẽ tụt số sau khi archive).
- ❌ Dùng `any`.

## 4. Edge Cases
- User cũ có task `completed` thiếu `completedAt`: bộ đếm "hôm nay" fallback sang `claimedAt === today`; rollover kế tiếp sẽ archive chúng.
- Cross-device (Firebase login): `applyGameState` set thẳng `archivedTasks` từ cloud, KHÔNG chạy lại rollover (nhất quán với hành vi streak hiện tại — xem Known Issues CLAUDE.md).
- Import file cũ không có `archivedTasks` → `[]`.
- archivedTasks rỗng → modal Lịch sử hiện empty-state.
- **[BUG FIX 2026-06-07] React 19 StrictMode**: mount effect chạy 2 lần → archive bị nhân đôi (duplicate key). FIX: `setArchivedTasks` dedupe theo id + `setTasks(prev => prev.filter(...))` functional update (idempotent). Unwanted pattern: ❌ `setArchivedTasks(prev => [...toArchive, ...prev])` không dedupe.
- **[BUG FIX 2026-06-07] Migration effect ghi đè archive**: migration effect (`setTasks` đọc localStorage gốc) chạy SAU date-reset effect → resurrect task đã archive lên board. FIX: migration dùng `setTasks(prev => migrate({tasks: prev}).tasks)` (functional update trên state, không đọc lại localStorage). Unwanted pattern: ❌ migration `setTasks(JSON.parse(localStorage tasks))` ghi đè state.

## 5. Definition of Done
- [x] `types.ts`: thêm `completedAt?` vào `Task`.
- [x] `App.tsx`: state + persist + rollover archive + toggleTask completedAt + sync/export/import + counters.
- [x] `schema.ts` + `firestoreSync.ts`: field `archivedTasks?`.
- [x] `QuestBoard.tsx`: tier chỉ hiện incomplete + collapse "Đã hoàn thành" + nút Lịch sử.
- [x] `TaskHistoryModal.tsx`: modal read-only mới.
- [x] `tsc --noEmit` pass, không `any`.
- [x] Update CLAUDE.md (ADR mới) + shared_context.

## 6. ADR liên quan
- ADR-013 (mới): Daily Task Auto-Archive — board fresh mỗi ngày, archive thay vì delete để bảo toàn achievement count + lịch sử.
