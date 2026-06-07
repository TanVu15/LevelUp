# SPEC — Lazy-load Firebase (giảm bundle ban đầu)
# feat-lazy-firebase | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Bundle chính ~836 KB (gzip ~217 KB); Firebase SDK chiếm phần lớn và bị **nạp cho MỌI user
ngay từ đầu**, kể cả guest không bao giờ đăng nhập. Firebase chỉ cần khi: (a) có user đăng nhập
sẵn (auth state), (b) user mở AuthModal, (c) sync/sign-out. → Tách Firebase ra chunk động,
chỉ tải khi thật sự cần.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — firebase.ts không nạp SDK ở module top-level
THE `src/firebase.ts` SHALL:
- Export `isConfigured: boolean` (chỉ đọc `import.meta.env`, KHÔNG import SDK runtime).
- Export `loadFirebase(): Promise<FirebaseInstance> | null` — `null` khi `!isConfigured`; ngược lại
  `import()` động `firebase/app|auth|firestore`, `initializeApp` (idempotent qua `getApps()`),
  trả `{ app, auth, db }`. Kết quả **cache** (gọi nhiều lần → 1 init).
- Mọi import type từ `firebase/*` dùng `import type` (bị erase, không kéo runtime vào chunk chính).
- KHÔNG còn export `auth`/`db` tĩnh.

### REQ-02 — Consumers lấy Firebase qua loadFirebase/dynamic import
- `utils/firestoreSync.ts`: `loadGameState`/`saveGameState` `await loadFirebase()` rồi `await import('firebase/firestore')` cho `doc/getDoc/setDoc`. Guard `isConfigured` + `null` như cũ (offline-safe, try/catch nuốt lỗi → app vẫn chạy).
- `hooks/useFirebaseSync.ts`: effect async — `await loadFirebase()`, `await import('firebase/auth')` cho `onAuthStateChanged`; cleanup huỷ listener + cờ `cancelled`. `User` dùng `import type`.
- `App.tsx`: `handleSignOut` lấy `signOut` + `auth` qua `loadFirebase()`/dynamic import. Bỏ import `auth`/`signOut` tĩnh.
- `components/AuthModal.tsx`: lấy `auth` qua `loadFirebase()` (state, set khi resolve); guard `if (!auth) return` sẵn có vẫn đúng. Các hàm `signInWith*`/`GoogleAuthProvider` giữ import tĩnh (nằm trong chunk lazy của AuthModal).

### REQ-03 — AuthModal lazy
THE `App.tsx` SHALL `React.lazy(() => import('./components/AuthModal'))` + bọc `<React.Suspense fallback={null}>` quanh chỗ render → firebase/auth của AuthModal ra chunk động.

### REQ-04 — Bundle chứng minh
Sau build, chunk `index-*.js` chính SHALL nhỏ đi rõ rệt và xuất hiện chunk Firebase riêng (chỉ tải khi cần). `npm run build` không lỗi.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Bất kỳ `import ... from 'firebase/*'` **runtime** ở module nằm trong cây tĩnh của `App` (chỉ `import type`).
- ❌ Đổi hành vi auth/sync/guest (ADR-011) — chỉ đổi cách *nạp*.
- ❌ Crash khi `!isConfigured` (guest build) — `loadFirebase()` trả `null`, mọi nơi guard.
- ❌ Khởi tạo Firebase nhiều lần (phải cache promise + `getApps()`).
- ❌ `any` (dùng `import type` cho Auth/Firestore/FirebaseApp/User).

## 4. Edge Cases
- `!isConfigured`: `loadFirebase()` → `null`; useFirebaseSync return sớm; firestoreSync trả null; AuthModal không có auth (nhưng guest không mở luồng cần auth).
- Race: AuthModal mở rồi đóng trước khi `loadFirebase` resolve → setState sau unmount? dùng cờ/guard hoặc chấp nhận (React cảnh báo nhẹ); ưu tiên cờ `cancelled` trong useFirebaseSync; AuthModal set state có thể bọc check mounted.
- onAuthStateChanged chưa kịp đăng ký khi user thao tác: listener gắn sau khi SDK tải xong — trễ vài trăm ms, chấp nhận.
- Cache: gọi `loadFirebase()` ở nhiều nơi cùng lúc → cùng 1 promise.

## 5. Definition of Done
- [x] `firebase.ts` rewrite (isConfigured + loadFirebase cache, import type).
- [x] `firestoreSync.ts`, `useFirebaseSync.ts`, `App.tsx`, `AuthModal.tsx` chuyển sang lazy.
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass; main chunk giảm + có chunk firebase riêng.
- [x] Kích thước: index chính 836 KB → **364 KB** (-56%); Firebase ~695 KB + AuthModal 8.8 KB tách ra chunk lazy, chỉ tải khi cần.

## 6. ADR liên quan
- ADR-011 (Firebase Auth + Firestore) — giữ hành vi, đổi cách nạp (lazy). Liên quan Known Issue "bundle nặng".
