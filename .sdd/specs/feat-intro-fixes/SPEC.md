# SPEC — Fix BootIntro (AWAKEN) sound & timing
# feat-intro-fixes | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Test thật phát hiện:
- Đang ở màn login (chưa đăng nhập thành công / có lỗi), intro AWAKEN vẫn chạy + phát âm thanh.
- Âm thanh zap thỉnh thoảng lệch so với animation nhiễu.
- **(bổ sung 2026-06-07)** Nghe lẫn CẢ tiếng "xoẹt điện" synth CŨ lẫn sample mp3 mới.

Nguyên nhân:
1. `BootIntro` gọi `playElectricZap()` **vô điều kiện** — KHÔNG xét `soundEnabled` (tắt tiếng vẫn kêu).
2. Effect mount của BootIntro chạy 2 lần dưới React 19 StrictMode (dev) → zap phát 2 lần lệch nhau.
3. Render intro không loại trừ lúc `showAuthModal` mở → AWAKEN có thể hiện/kêu chồng lên màn login.
4. `playElectricZap` có 2 nguồn tiếng: sample `public/sfx/electric-zap.mp3` (mới) + `renderSparks()` synth (cũ, fallback). Có lúc nghe cả hai.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — BootIntro xét soundEnabled
THE `BootIntro` SHALL nhận prop `soundEnabled: boolean` và CHỈ `playElectricZap()` khi `soundEnabled === true`.

### REQ-02 — Zap chỉ phát 1 lần (StrictMode-safe)
THE `BootIntro` SHALL guard việc phát zap bằng `ref` để double-invoke effect (StrictMode dev) KHÔNG phát 2 lần.
Lưu ý: KHÔNG guard cả effect (timer `onDone` phải set lại mỗi lần để cleanup StrictMode không làm intro kẹt) — chỉ guard riêng phần phát âm thanh.

### REQ-03 — Không hiện intro khi auth modal mở
THE `App` SHALL chỉ render BootIntro khi `showIntro && !showAuthModal`.

### REQ-04 — Chỉ giữ 1 tiếng zap (mp3 mới nhất)
THE `playElectricZap` SHALL CHỈ phát sample `electric-zap.mp3`. Bỏ hẳn fallback synth `renderSparks`
(xoá function). Nếu sample chưa decode → đợi decode rồi phát; nếu load lỗi → im lặng (không tự chế tiếng cũ).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Phát âm thanh khi `soundEnabled = false`.
- ❌ Guard toàn bộ effect bằng ref (timer bị cleanup StrictMode xoá → intro kẹt).
- ❌ Hiện AWAKEN chồng màn login.
- ❌ Giữ lại `renderSparks` / phát đồng thời 2 nguồn tiếng.
- ❌ `any`.

## 4. Edge Cases
- mp3 load lỗi/offline lần đầu → không có tiếng (chấp nhận, đúng ý "chỉ giữ cái mới").
- AudioContext suspend (mobile) → `playElectricZap` đã resume-aware (giữ).
- `soundEnabled` đổi giữa chừng: intro đọc lúc mount.

## 5. Definition of Done
- [x] `BootIntro.tsx`: prop `soundEnabled`, ref-guard zap, giữ timer chạy bình thường.
- [x] `App.tsx`: truyền `soundEnabled`, render `showIntro && !showAuthModal`.
- [x] `audio.ts`: `playElectricZap` chỉ phát mp3; xoá `renderSparks`.
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass.

## 6. ADR liên quan
- ENG-03 (audio không crash) + tôn trọng toggle âm thanh. Không đổi ADR.
