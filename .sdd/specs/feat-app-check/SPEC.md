# SPEC — Firebase App Check (reCAPTCHA v3)
# feat-app-check | Status: IN-PROGRESS | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
API key Firebase web là public theo thiết kế → ai cũng có thể gọi Firestore bằng key
đó (spam quota/tiền). App Check xác thực request đến từ app thật (reCAPTCHA v3
attestation). Mục "cần tay người" của pre-public sprint — code wire sẵn, user làm
console.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Khởi tạo có điều kiện
- `firebase.ts` (trong `loadFirebase`, sau `initializeApp`, TRƯỚC khi trả instance):
  nếu `import.meta.env.VITE_RECAPTCHA_SITE_KEY` tồn tại → dynamic import
  `firebase/app-check`, `initializeAppCheck(app, { provider: new ReCaptchaV3Provider(key),
  isTokenAutoRefreshEnabled: true })`. Không có key → bỏ qua (hành vi hiện tại,
  app vẫn chạy — App Check chưa enforce thì Firestore vẫn nhận request).
- Lỗi init App Check → catch im lặng (không chặn app; Firestore sẽ tự fail nếu enforce).

### REQ-02 — Debug token cho dev
- Khi `import.meta.env.DEV` → set `FIREBASE_APPCHECK_DEBUG_TOKEN = true` trên self
  trước khi init → SDK in token ra console để đăng ký trong Firebase console
  (App Check → Manage debug tokens). Không dùng `any` (cast qua interface).

### REQ-03 — Env
- `.env.example` thêm `VITE_RECAPTCHA_SITE_KEY` + hướng dẫn ngắn.

## 3. Unwanted Patterns
- ❌ Import app-check tĩnh (phá lazy-load — feat-lazy-firebase).
- ❌ Hardcode site key trong code (env only).
- ❌ Tự enforce trong code — enforce là việc console, làm SAU khi metrics sạch.

## 4. Edge Cases
- Guest không đăng nhập: loadFirebase không chạy → không tải reCAPTCHA script (giữ nguyên).
- Site key sai/domain chưa whitelist: console báo lỗi reCAPTCHA, app vẫn chạy local-first; sync fail chỉ khi enforce.

## 5. Definition of Done
- [ ] firebase.ts + .env.example; lint/build pass.
- [ ] User hoàn tất console: tạo key v3, đăng ký App Check, debug token, theo dõi metrics → enforce.
