# SPEC — Fix theo kết quả test thiết bị thật (iPhone, 2026-06-11)
# feat-device-feedback-fixes | Status: IMPLEMENTED (chờ user deploy rules + authDomain + retest) | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why) — từ DEVICE_TEST.md round 1
1. **Âm thanh ma khi background/foreground (iOS):** mọi sound schedule vào AudioContext;
   iOS suspend context khi app vào nền → node treo → context resume (mở lại app /
   warmupAudio ở nút Google) → burst "xoẹt". 
2. **Keyboard tự bật che nửa màn hình:** OnboardingModal input có autoFocus.
3. **Xóa tài khoản bị TỪ CHỐI:** firestore.rules `allow write: ... request.resource.data.size()<200`
   — DELETE có `request.resource = null` → rule fail → deny. Bug rules.
4. **Google sign-in trong PWA standalone iOS:** signInWithPopup không quay về app sau 2FA.
5. **Đăng ký email không xác minh.**
6. Xóa quest không có cảnh báo (yêu cầu UX).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Audio: diệt âm thanh ma
- `audio.ts`: listener `visibilitychange` (đăng ký 1 lần) — khi `hidden`:
  `audioCtx.close()` + set null (mọi node đang treo chết hẳn, không burst khi resume);
  reset `zapLoading` nếu chưa xong (promise gắn ctx cũ). `zapBuffer` đã decode giữ lại
  (AudioBuffer độc lập context).
- Mọi hàm `play*` + `warmupAudio`: guard `document.hidden` → return sớm (không schedule khi ẩn).
- Context mới được tạo lại lazy ở lần play/warmup kế tiếp (luôn từ user gesture — OK autoplay policy).

### REQ-02 — Onboarding không bật keyboard
- 3 input trong OnboardingModal: `autoFocus` chỉ trên pointer mịn —
  `autoFocus={!isCoarsePointer}` với `matchMedia('(pointer: coarse)')` đọc 1 lần.
  (Các autoFocus khác — inline edit sau cú chạm chủ đích — giữ nguyên.)

### REQ-03 — firestore.rules cho phép DELETE của chủ doc
```
allow read: if isOwner;
allow create, update: if isOwner && request.resource.data.size() < 200;
allow delete: if isOwner;
```
- Cần `npm run deploy:rules` (tay user) sau khi sửa.

### REQ-04 — Google sign-in: redirect flow cho standalone
- AuthModal: nếu `display-mode: standalone` (hoặc `navigator.standalone === true`) →
  `signInWithRedirect`; ngược lại giữ popup. Sau redirect, `onAuthStateChanged`
  (useFirebaseSync) nhận user → đóng auth gate như cũ.
- Đi kèm (tay user): đổi `VITE_FIREBASE_AUTH_DOMAIN=levelup-4ba63.web.app` để redirect
  same-origin (Safari ITP chặn cross-origin helper) + rebuild deploy.

### REQ-05 — Email verification sau đăng ký
- Sau `createUserWithEmailAndPassword` → `sendEmailVerification(user)` fire-and-forget
  + info "Đã gửi email xác minh — kiểm tra hộp thư." KHÔNG chặn dùng app khi chưa verify.

### REQ-06 — Xóa quest 2 chạm
- QuestBoard: chạm 1 → nút chuyển trạng thái "Xóa?" (đỏ, 3 giây tự hủy); chạm 2 → xóa.
  Không modal (ADR-005 vẫn tôn trọng — không confirm(); 2 chạm đủ cho hành động nhỏ).

## 3. Unwanted Patterns
- ❌ confirm()/alert(). ❌ `any` (cast interface cho navigator.standalone).
- ❌ Redirect flow cho desktop (popup UX tốt hơn, chỉ standalone mới redirect).
- ❌ Chặn app khi email chưa verify (friction — app local-first).

## 4. Edge Cases
- Audio: close() đang pending khi user quay lại ngay → getAudioContext tạo ctx mới độc lập, không đụng ctx cũ.
- Hai chạm xóa: chạm nút xóa của task KHÁC khi đang armed → arm task mới (reset task cũ).
- Redirect sign-in: user hủy giữa chừng → quay về app không user — auth gate vẫn mở, không lỗi.

## Round 2 (cùng ngày, sau retest)
- **REQ-07 — SW nuốt Firebase Auth handler:** workbox navigateFallback trả app shell
  cho MỌI navigation, kể cả `/__/auth/handler` → redirect sign-in "quay về như khách"
  không lỗi gì. Fix: `navigateFallbackDenylist: [/^\/__\//, /^\/privacy\.html/]`
  (privacy.html cũng đang bị nuốt). ✅
- **REQ-08 — Zap lệch màn hình nhiễu:** hình chạy ngay khi mount, tiếng chờ resume+decode
  (100–300ms trên iPhone). Fix: BootIntro chờ `zapReady()` (race timeout 250ms) rồi start
  hình + tiếng cùng khung hình; trong lúc chờ render màn đen tĩnh. ✅
- **REQ-09 — getRedirectResult bắt lỗi ra console** (redirect fail không còn im lặng). ✅

## Round 3 (sau retest 2)
- **redirect_uri_mismatch:** SW fix ĐÃ ăn (đến được Google) — còn thiếu redirect URI của
  domain mới trong OAuth client. Tay user: Google Cloud Console → Credentials → Web client
  → thêm origin `https://levelup-4ba63.web.app` + redirect URI
  `https://levelup-4ba63.web.app/__/auth/handler`.
- **REQ-10 — Zap không bao giờ xếp hàng phát trễ:** reload không có gesture → resume bị iOS
  treo → lệnh phát chờ sẵn, bắn ra cùng tiếng tick ở cú chạm kế. Fix: cửa sổ 600ms —
  không resume được thì VỨT tiếng zap (intro chạy không tiếng, đúng kỳ vọng). ✅

## Round 4 (kết luận Google trên iOS standalone)
- OAuth URI đã đúng (desktop popup OK). iOS standalone: redirect → Google sập
  "Đã xảy ra lỗi" generic (storage tấm trình duyệt nhúng bị Apple cô lập — Google
  mất phiên giữa flow). ĐÃ THỬ CẢ popup (round 1) lẫn redirect (round 3-4) — đều
  chết. KẾT LUẬN: giới hạn nền tảng, không vòng được.
- **REQ-11 — Fallback UX:** iOS standalone (UA iPhone/iPad + display-mode standalone)
  → ẨN nút Google, hiện note "không khả dụng trong app đã cài trên iOS — dùng
  Email/Mật khẩu". Mọi nền tảng khác: popup (bỏ hẳn nhánh signInWithRedirect). ✅

## 5. Definition of Done
- [x] audio.ts (REQ-01), OnboardingModal (REQ-02), firestore.rules (REQ-03),
      AuthModal (REQ-04+05), QuestBoard (REQ-06).
- [x] lint + test (46) + build + e2e (3) pass.
- [ ] User: `npm run deploy:rules` + đổi `VITE_FIREBASE_AUTH_DOMAIN=levelup-4ba63.web.app`
      trong .env.local + `npm run deploy` + retest iPhone (mục 1, 4 của DEVICE_TEST.md).
