# SPEC — Avatar + Body Photos trong Export/Import backup
# feat-backup-photos | Status: IN PROGRESS | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Avatar + body photos chỉ lưu IndexedDB local (Known Issue CLAUDE.md "Phase 2 task"). Export/Import
JSON KHÔNG bao gồm ảnh → user export backup tưởng đầy đủ, wipe storage / cài lại / import →
**mất sạch ảnh tiến trình**. Đưa ảnh vào file backup để Export/Import bảo toàn trọn vẹn.

Out of scope: sync ảnh lên Firestore (giới hạn 1MB/doc → cần Firebase Storage = bài toán riêng).
Ảnh chỉ đi vào file backup JSON thủ công.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — BackupData chứa ảnh
THE `BackupData` (schema.ts) SHALL có optional:
- `avatarUrl?: string | null` (dataURL avatar, có thể null).
- `bodyPhotos?: Record<string, string>` (date → dataURL).
Optional → backup cũ thiếu field vẫn import được (DATA-01 backward compatible).

### REQ-02 — Export kèm ảnh
THE `handleExport` SHALL truyền `avatarUrl` + `bodyPhotos` (state hiện tại, nguồn IndexedDB đã load lúc mount) vào `exportBackup`.

### REQ-03 — Import khôi phục ảnh vào IndexedDB + state
THE `handleImportConfirm` SHALL:
- Nếu `s.avatarUrl` truthy → `saveAvatar(s.avatarUrl)` (IndexedDB) + `setAvatarUrl(s.avatarUrl)`.
- Nếu `s.bodyPhotos` → `setBodyPhotos(s.bodyPhotos)` + `saveBodyPhoto(date, url)` cho từng ảnh.
- Ghi IndexedDB là async fire-and-forget, bọc `.catch()` (không chặn / không crash nếu IndexedDB lỗi — ENG-03 tinh thần).

### REQ-04 — Validation guard
THE `validateBackup` SHALL chặn `bodyPhotos` quá nhiều (vd > 1000 ảnh) → throw thông báo, tránh file độc hại gây freeze.

### REQ-05 — Preview số ảnh
THE `ImportConfirmModal` SHALL hiển thị dòng "Số ảnh" = (avatar ? 1 : 0) + số body photos của backup.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Đưa ảnh vào `GameState`/Firestore (ngoài scope, Firestore 1MB limit).
- ❌ Chặn luồng import bằng `await` ghi ảnh tuần tự gây treo UI (fire-and-forget + catch).
- ❌ Crash khi backup không có ảnh (field optional → bỏ qua).
- ❌ Dùng `alert()`/`confirm()` (ADR-005).
- ❌ `any`.

## 4. Edge Cases
- Backup cũ không có `avatarUrl`/`bodyPhotos` → bỏ qua, giữ ảnh hiện có (không xoá).
- Import KHÔNG xoá ảnh local không có trong backup (overlay, non-destructive) — chấp nhận để tránh thao tác clear IndexedDB phức tạp; ghi chú rõ.
- `avatarUrl = null` trong backup → không ghi đè avatar hiện tại (chỉ ghi khi truthy).
- IndexedDB không khả dụng (Safari private) → `.catch()` nuốt, state vẫn cập nhật trong phiên.
- File backup có ảnh → kích thước lớn (vài MB) nhưng compressImage đã nén; chấp nhận cho backup thủ công.

## 5. Definition of Done
- [ ] `schema.ts`: `avatarUrl?`/`bodyPhotos?` trong BackupData + guard trong validateBackup.
- [ ] `App.tsx`: handleExport gắn ảnh; handleImportConfirm khôi phục ảnh (IndexedDB + state).
- [ ] `ImportConfirmModal.tsx`: dòng "Số ảnh".
- [ ] `npm run lint` + `npm test` (33) + `npm run build` pass.
- [ ] Cập nhật CLAUDE.md: Known Issue ảnh → resolved (Export/Import; cloud vẫn pending).

## 6. ADR liên quan
- Nối tiếp ADR-012 (Export/Import + schema versioning). Đóng một nửa Known Issue "IndexedDB photos không sync" (phần Export/Import).
