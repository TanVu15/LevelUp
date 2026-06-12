# SPEC — Sync hardening: chống mất dữ liệu cloud sync
# feat-sync-hardening | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
Audit pre-public (GĐ0) xác nhận 3 lỗ hổng mất dữ liệu thật:
1. **Last-write-wins mù:** `useFirebaseSync` áp cloud state thẳng khi login, không so
   timestamp. Login máy B (hoặc guest có dữ liệu rồi mới login) → cloud GHI ĐÈ local
   kể cả khi local mới hơn. Mất dữ liệu không cảnh báo.
2. **Debounce 3s không flush:** tick quest xong đóng tab/app bị kill trong 3s → thay
   đổi không bao giờ lên cloud. Mobile rất hay gặp (browser kill tab nền).
3. **Storage eviction:** localStorage/IndexedDB có thể bị browser dọn (nhất là iOS
   Safari 7-day ITP cho guest) → guest user mất TOÀN BỘ dữ liệu. Chưa từng gọi
   `navigator.storage.persist()`.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — updatedAt timestamp
- `GameState` SHALL có field optional `updatedAt?: number` (epoch ms).
- `saveGameState` SHALL stamp `updatedAt: Date.now()` vào doc khi ghi Firestore.
- Local: key `ironwill_updated_at` (epoch ms) SHALL được ghi mỗi khi `gameState`
  memo đổi identity SAU lần render đầu (skip mount — mount không phải thay đổi dữ liệu).
- Helpers thuần trong `src/utils/syncMeta.ts`: `readLocalUpdatedAt()`,
  `touchLocalUpdatedAt(now?)`, `decideCloudAction(cloudUpdatedAt, localUpdatedAt)`.

### REQ-02 — Conflict detection khi login
- `decideCloudAction(cloud, local): 'apply' | 'conflict'` — PURE, unit-tested:
  - `conflict` ⇔ `localUpdatedAt > (cloudUpdatedAt ?? 0)` (cloud legacy thiếu stamp = 0).
  - Ngược lại (cloud mới hơn / bằng / local chưa từng có thay đổi = 0) → `apply`.
- `useFirebaseSync` nhận thêm `onConflict?: (cloud: GameState) => void`. Khi login:
  - Không có cloud doc → push local (giữ nguyên first-login hiện tại).
  - Có cloud + `decideCloudAction === 'apply'` → `applyState(cloud)` (giữ nguyên).
  - Có cloud + `'conflict'` → KHÔNG apply, gọi `onConflict(cloud)`.

### REQ-03 — SyncConflictModal
- Component mới `src/components/SyncConflictModal.tsx` (style theo ImportConfirmModal):
  hiện 2 phương án cạnh nhau — **Cloud** (level/streak/số nhiệm vụ/số giao dịch/thời điểm
  `updatedAt`) vs **Máy này** (cùng các số đó từ state hiện tại + `ironwill_updated_at`).
  Timestamp format `vi-VN` dễ đọc; legacy cloud thiếu stamp hiện "không rõ".
- Chọn "Dùng bản Cloud" → `applyGameState(cloud)`. Chọn "Giữ bản máy này" →
  `saveGameState(uid, gameStateHiệnTại)` (đẩy đè lên cloud). Cả 2 đóng modal.
- KHÔNG có nút X / Escape đóng-mà-không-chọn (bắt buộc quyết định — tránh trạng thái
  nửa vời 2 nguồn lệch nhau). Body scroll lock như các modal khác.

### REQ-04 — Flush khi rời trang
- `useFirebaseSync` SHALL lắng nghe `visibilitychange` (→ hidden) + `pagehide` khi đã
  login: nếu có thay đổi chưa sync (dirty flag ref, set khi `state` đổi, clear sau save)
  → gọi `saveGameState` ngay (best-effort, không await được trong pagehide — chấp nhận).
- Debounced save 3s giữ nguyên; debounce thành công cũng clear dirty.

### REQ-05 — Storage persistence
- `main.tsx` SHALL gọi `navigator.storage.persist()` fire-and-forget (try/catch,
  không crash trên browser không hỗ trợ). Không UI.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Auto-merge field-level (ngoài scope — quyết định người dùng, doc-level là đủ MVP).
- ❌ Đổi key localStorage hiện có / đổi shape field hiện có của GameState (chỉ THÊM optional).
- ❌ `confirm()` / `alert()` (ADR-005).
- ❌ Đưa `updatedAt` vào BackupData/Export-Import — nó là metadata sync, không phải dữ
  liệu game; import xong sẽ stamp mới tự nhiên khi state đổi. (Ghi chú rõ để không
  dính bài học `routineDescs` — đây là CHỦ ĐÍCH, không phải quên.)
- ❌ Side-effect trong functional updater / reducer.
- ❌ `any`.

## 4. Edge Cases
- **Legacy cloud doc chưa có updatedAt** + local có thay đổi → conflict modal 1 lần
  (an toàn hơn ghi đè im lặng); sau lần save đầu cloud có stamp, hết hỏi.
- **Máy mới tinh login** (local chưa thay đổi gì, `ironwill_updated_at` không tồn tại
  = 0) → apply cloud im lặng như cũ. Không modal.
- **Returning user cùng máy:** cloud.updatedAt ≈ local + 3s (save sau debounce) →
  apply im lặng. Modal CHỈ hiện khi phiên trước có thay đổi chưa kịp sync — đúng lúc
  cần cứu dữ liệu.
- **applyGameState xong** → state đổi → touch local stamp + debounced save đẩy lại
  cloud với stamp mới hơn. Vòng lặp lành tính, hội tụ.
- **Chọn "Giữ máy này"** khi offline: saveGameState catch lỗi im lặng, debounce/flush
  sau sẽ retry với cùng dữ liệu — không mất gì.

## 5. Definition of Done
- [x] `utils/syncMeta.ts` + unit tests cho `decideCloudAction` (legacy 0, local 0, hơn/kém/bằng).
- [x] `firestoreSync.ts` stamp updatedAt; `GameState.updatedAt?: number`.
- [x] `useFirebaseSync` — onConflict + dirty flag (skip mount) + flush visibilitychange/pagehide.
- [x] `SyncConflictModal.tsx` + wire trong App.tsx (state `syncConflict`).
- [x] Effect touch `ironwill_updated_at` (skip mount) trong App.tsx.
- [x] `navigator.storage.persist()` trong main.tsx.
- [x] `npm run lint` + `npm test` (38) + `npm run build` pass.

## 6. ADR liên quan
- ADR-011 (Firebase sync) — mở rộng, không đổi luồng guest/first-login.
- ADR-005 (custom modal) — SyncConflictModal.
