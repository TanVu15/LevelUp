# SPEC — useFirebaseSync hook (Bước 2b giảm god-component)
# feat-use-firebase-sync | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
`App.tsx` còn ~739 dòng. Phần Firebase (state `currentUser` + effect `onAuthStateChanged` +
effect debounced sync 3s + 2 lần dựng object `GameState`) ~70 dòng, biệt lập, có thể gom vào
1 hook `useFirebaseSync`. Đây là bước hook rủi-ro-thấp (không đụng handlers/anti-exploit).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Hook useFirebaseSync
THE system SHALL có `src/hooks/useFirebaseSync.ts`:
```
useFirebaseSync(opts: {
  state: GameState;                 // ảnh chụp state hiện tại để push
  applyState: (s: GameState) => void; // áp state từ cloud / first-login
  onUserChange?: (user: User | null) => void;
}): User | null
```
- Sở hữu `currentUser` (useState), trả về cho App.
- Effect `onAuthStateChanged` (chạy 1 lần): `setCurrentUser(user)`, gọi `onUserChange(user)`;
  nếu có user → `loadGameState`; có cloud → `applyState(cloud)`, không có → `saveGameState(state)` (first-login push).
- Effect debounced 3s: khi có `currentUser`, `setTimeout(saveGameState, 3000)`, clear khi cleanup.
- Dùng `ref` cho `state`/`applyState`/`onUserChange` trong effect-1-lần để tránh stale closure
  (push dữ liệu MỚI NHẤT lúc first-login thay vì mount-time — cải thiện so với bản cũ, không đổi luồng).
- No-op an toàn khi `!isConfigured || !auth`.

### REQ-02 — App.tsx dùng hook
THE `App.tsx` SHALL:
- Bỏ `useState currentUser`, 2 effect Firebase, 2 chỗ dựng `GameState` trùng lặp.
- Dựng `gameState` qua `useMemo<GameState>` (dep = đúng các field như dep array effect cũ) → identity chỉ đổi khi field đổi (giữ đúng nhịp debounce như cũ, không reset timer mỗi render).
- `const currentUser = useFirebaseSync({ state: gameState, applyState: applyGameState, onUserChange: u => { if (u) setShowAuthModal(false); } })`.
- Giữ `applyGameState` (callback dùng setters) ở App; `handleSignOut` giữ nguyên ở App.

### REQ-03 — Không đổi hành vi
Luồng login/guest/sync/first-login KHÔNG đổi. `currentUser?.email`, `!!currentUser` ở JSX giữ nguyên.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Đưa logic setters/anti-exploit/handlers vào hook (ngoài scope — chỉ auth + sync).
- ❌ Để debounce reset mỗi render (phải dùng useMemo cho gameState để identity ổn định).
- ❌ Gọi fetch/endpoint ngoài Firestore (ARCH-01).
- ❌ Đổi key localStorage / GameState shape (DATA-01).
- ❌ `any`.

## 4. Edge Cases
- `!isConfigured`: hook return `null`, không đăng ký listener (guest-only build).
- First-login push dùng `stateRef.current` (mới nhất) — nếu user thao tác trước khi auth resolve vẫn push đúng.
- `lastOpenDate` đọc từ localStorage trong useMemo: cập nhật khi field khác đổi (đủ tốt như cũ).
- Đăng xuất: `handleSignOut` vẫn reload trang (reset React state) — không phụ thuộc hook.

## 5. Definition of Done
- [x] `src/hooks/useFirebaseSync.ts`.
- [x] `App.tsx` dùng hook + `gameState` useMemo; gỡ currentUser useState + 2 effect + object trùng.
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass. Hành vi không đổi.
- [x] App.tsx 739 → 719 dòng (940 → 719 tính từ đầu). Dừng refactor hooks tại đây (handlers để dành).

## 6. ADR liên quan
- ADR-011 (Firebase Auth + Firestore sync) — gói gọn lại, không đổi hành vi. Bước 2b/cuối của đợt giảm god-component lần này.
