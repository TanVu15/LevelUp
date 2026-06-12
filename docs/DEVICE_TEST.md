# Checklist test tay trên thiết bị thật — LevelUp v0.4.0

> Chuẩn bị: `npm run deploy` → mở **https://levelup-4ba63.web.app** trên điện thoại.
> Mỗi mục: ✅ pass / ❌ fail (ghi chú lại). Mục có ⚠️ là điểm nghi ngờ cần soi kỹ.

## 1. iPhone — Safari (quan trọng nhất, hành vi khác biệt nhiều nhất)

### Cài đặt PWA
- [ ] Mở site lần đầu: font chữ hiện đúng (JetBrains Mono / Space Grotesk), không FOUT kéo dài
- [ ] Share → **Thêm vào MH chính**: icon chữ "L" cam hiện đúng (KHÔNG phải ảnh trắng/screenshot)
- [ ] Mở từ home screen: chạy **standalone** (không có thanh URL Safari)
- [ ] Tai thỏ/Dynamic Island: header không bị che; bottom tab không bị home-indicator đè (safe-area)

### Chức năng cốt lõi
- [ ] Tick 1 routine → có âm thanh (sau cú chạm đầu tiên), XP tăng
- [ ] ⚠️ **Focus timer**: bấm AWAKEN → **khóa màn hình 2–3 phút** → mở lại: đồng hồ nhảy đúng số phút đã trôi (không đứng hình)
- [ ] ⚠️ **Input không bị zoom**: chạm vào ô "Cân nặng hôm nay" / ô thêm quest — màn hình KHÔNG tự phóng to (iOS zoom khi font input <16px; nếu bị → báo lại để sửa font-size input)
- [ ] Thêm quest, tick hoàn thành, xóa quest — mượt, không lệch layout

### Offline & dữ liệu
- [ ] Bật **chế độ máy bay** → mở app từ home screen: vẫn load đủ, font đúng, icon đúng
- [ ] Tick quest khi offline → tắt máy bay → dữ liệu còn nguyên
- [ ] Đóng app NHANH ngay sau khi tick (swipe up trong vòng 3 giây) → mở lại: thay đổi còn (flush sync)

### Tài khoản (đăng nhập trên web Safari TRƯỚC, rồi mới test trong PWA)
- [ ] ⚠️ **Đăng nhập Google trong PWA standalone**: bấm "Tiếp tục với Google" — popup có quay về app không? (iOS PWA hay nuốt popup; nếu treo/trắng → báo lại, sẽ chuyển sang redirect flow)
- [ ] Đăng nhập Email/Password bình thường
- [ ] "Quên mật khẩu?" → nhận email (kiểm tra cả spam)
- [ ] Đăng xuất → đăng nhập lại → dữ liệu về đúng

## 2. Android — Chrome

- [ ] Banner/prompt cài đặt hiện (hoặc menu ⋮ → "Cài đặt ứng dụng")
- [ ] Icon sau cài: hình tròn/squircle **không bị cắt mất chữ L** (maskable)
- [ ] Mở standalone, theme màu cam ở status bar
- [ ] Nút Back vật lý: không thoát app giữa chừng khi đang ở modal
- [ ] Focus timer + khóa màn hình (như iPhone)
- [ ] Offline mode (như iPhone)

## 3. Cross-device (chống mất dữ liệu — quan trọng nhất trước public)

Cần 2 thiết bị (hoặc điện thoại + máy tính), cùng 1 tài khoản:
- [ ] Máy A tick 2 routine → đợi ~5 giây → mở máy B (refresh): thấy 2 routine đã tick
- [ ] Máy B đang TẮT MẠNG, tick thêm 1 quest → bật mạng, refresh máy A: quest xuất hiện
- [ ] **Kịch bản conflict**: máy A offline, tick vài thứ → trong lúc đó máy B online tick thứ khác → máy A online lại, đăng nhập/refresh → **SyncConflictModal hiện ra cho chọn Cloud/Máy này** (không ghi đè im lặng)
- [ ] Chọn "Giữ bản máy này" → máy B refresh thấy đúng bản của A

## 4. Vòng đời tài khoản (dùng tài khoản TEST, không dùng tài khoản thật)

- [ ] Tạo tài khoản test → nhập ít dữ liệu → Hành Trình → "Xóa tài khoản & toàn bộ dữ liệu" → gõ XOA → app reload về trạng thái mới tinh
- [ ] Đăng nhập lại bằng tài khoản vừa xóa → báo sai (tài khoản không còn)
- [ ] Firestore console: doc `users/{uid}` đã biến mất

## 5. Qua ngày & đầu tuần (test dài hơi — làm trong lúc beta)

- [ ] Để qua 0h (hoặc đổi giờ máy +1 ngày): routine reset, task hôm qua vào Lịch sử, streak cập nhật
- [ ] Sáng thứ Hai: WEEKLY DEBRIEF hiện đúng số tuần trước, đóng lại không hiện lần 2
- [ ] Đầu tháng: Monthly Review hiện (nếu trùng thứ Hai: Monthly đè Weekly, đóng Monthly thấy Weekly)

---
Kết quả: ghi ❌ + mô tả ngắn (máy gì, iOS/Android version, bước nào) rồi đưa lại cho Claude sửa.
