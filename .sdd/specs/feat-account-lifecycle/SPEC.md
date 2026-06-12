# SPEC — Account lifecycle: reset password, xóa tài khoản, privacy policy
# feat-account-lifecycle | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
Chuẩn bắt buộc trước khi public (GĐ3 kế hoạch pre-public):
1. **Không có "Quên mật khẩu"** — user Email/Password quên pass là mất tài khoản vĩnh viễn.
2. **Không có xóa tài khoản trong app** — đã cho tạo tài khoản thì phải cho xóa
   (Google Play / App Store bắt buộc; GDPR right-to-erasure; dữ liệu nhạy cảm:
   tài chính + cân nặng + ảnh cơ thể).
3. **Không có Privacy Policy** — app thu thập dữ liệu cá nhân lên Firestore mà không
   có trang chính sách công khai.
4. Phát hiện kèm: user ĐÃ đăng nhập bị ẩn nút Export/Import (Timeline chỉ render ở
   nhánh guest) — trong khi ảnh KHÔNG sync cloud → user đăng nhập không backup ảnh được.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Quên mật khẩu (AuthModal)
- Tab Đăng nhập SHALL có link "Quên mật khẩu?" → `sendPasswordResetEmail(auth, email)`.
- Cần email đã nhập; nếu trống → lỗi "Nhập email trước khi đặt lại mật khẩu."
- Thành công HOẶC `auth/user-not-found` → cùng một thông báo trung tính
  "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi." (chống dò email).
- Lỗi khác map qua `getFriendlyError` hiện có. Thông báo info màu emerald (không phải đỏ).

### REQ-02 — Xóa tài khoản
- `DeleteAccountModal.tsx` (ADR-005, style ImportConfirmModal): cảnh báo đỏ, liệt kê
  hậu quả (xóa vĩnh viễn cloud + tài khoản + dữ liệu máy này), input gõ đúng chữ
  **XOA** mới enable nút xác nhận, loading state, hiển thị lỗi trả về.
- `handleDeleteAccount` (App.tsx) thứ tự: (1) `deleteDoc(users/{uid})` khi còn auth,
  (2) `currentUser.delete()`, (3) clear localStorage `ironwill_*` + `clearAllImages()`
  (IndexedDB) + `window.location.reload()`.
- `auth/requires-recent-login` → lỗi thân thiện: "Vì bảo mật, hãy đăng xuất, đăng nhập
  lại rồi thử xóa lần nữa." KHÔNG xóa local khi cloud/account chưa xóa xong.
- Nếu (2) fail sau khi (1) xong: chấp nhận — debounced sync còn user sẽ tự đẩy doc
  lại, không mất dữ liệu, user thử lại.
- Entry point: widget "Cloud Sync Active" trong Timeline (vùng quản lý dữ liệu),
  link đỏ nhỏ "Xóa tài khoản & toàn bộ dữ liệu". Prop optional `onDeleteAccount`.
- `imageDB.ts` thêm `clearAllImages()` (clear 2 object store).

### REQ-03 — Privacy Policy
- `public/privacy.html` — trang tĩnh tiếng Việt (KHÔNG thêm routing — anti-pattern),
  dark theme inline, nội dung: dữ liệu nào lưu ở đâu (localStorage/IndexedDB local;
  Firestore khi đăng nhập; ảnh KHÔNG lên cloud), không bán/chia sẻ, không analytics
  bên thứ ba, cách xóa (trong app), liên hệ. Ngày hiệu lực.
- Link từ: (a) AuthModal — dòng "Tiếp tục nghĩa là bạn đồng ý Chính sách quyền riêng tư",
  (b) cả 2 nhánh widget dữ liệu trong Timeline. `target="_blank"`.

### REQ-04 — Export/Import cho user đã đăng nhập (Timeline)
- Nhánh `isLoggedIn` SHALL thêm nút Export + Import (dùng chung input file + validate
  hiện có) — lý do hiển thị cho user: "ảnh chỉ nằm trong file backup, chưa lên cloud".

## 3. Unwanted Patterns
- ❌ Routing/react-router cho trang privacy (dùng file tĩnh public/).
- ❌ `confirm()`/`alert()`.
- ❌ Xóa local data trước khi cloud + account xóa thành công (mất dữ liệu nếu fail giữa chừng).
- ❌ Thông báo lộ email tồn tại hay không (user enumeration).
- ❌ `any`.

## 4. Edge Cases
- Google-only user bấm xóa: không cần password — `user.delete()` vẫn chạy; nếu
  requires-recent-login → cùng thông báo re-login.
- Offline khi xóa: deleteDoc fail → báo lỗi mạng, không xóa gì cả (an toàn).
- Import khi đang login: luồng cũ (validate → ImportConfirmModal) giữ nguyên — sau
  import, debounced sync tự đẩy state mới lên cloud.

## 5. Definition of Done
- [x] AuthModal: quên mật khẩu + info message + privacy line.
- [x] DeleteAccountModal + handleDeleteAccount + clearAllImages + wire Timeline.
- [x] Timeline: Export/Import ở nhánh logged-in + privacy links (cả 2 nhánh).
- [x] public/privacy.html.
- [x] `npm run lint` + `npm test` (38) + `npm run build` pass.

## 6. ADR liên quan
- ADR-005 (custom modal), ADR-011 (Firebase auth), ADR-012 (Export/Import).
