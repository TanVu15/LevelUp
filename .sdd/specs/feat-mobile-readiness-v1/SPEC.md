# SPEC — Mobile-readiness v1 (PWA app-feel)
# feat-mobile-readiness-v1 | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Mục tiêu chính của sản phẩm là **mobile app** (web hiện tại để kiểm thử). Lộ trình rẻ nhất:
PWA installable → sau này Capacitor wrap (giữ 100% code). PWA baseline đã có (manifest, theme-color,
standalone, portrait) nhưng còn gap khiến app KHÔNG "ra dáng app" trên điện thoại:
- Thiếu `viewport-fit=cover` + safe-area → nội dung bị che bởi notch/thanh home (iOS standalone).
- Input chữ <16px → iOS auto-zoom khi focus.
- Nav tab label dài → chật/tràn màn hình hẹp.
- Còn "mùi web": tap-highlight xám, double-tap zoom delay, pull-to-refresh.
- `lang="en"` dù app tiếng Việt.

Phạm vi v1: CSS/HTML/nav — KHÔNG đụng game logic. (PNG icon cho iOS home screen + Capacitor là việc sau.)

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Viewport + lang
THE `index.html` SHALL: `<html lang="vi">`; viewport = `width=device-width, initial-scale=1.0, viewport-fit=cover`.
(KHÔNG dùng `user-scalable=no`/`maximum-scale=1` — giữ pinch-zoom cho accessibility.)

### REQ-02 — Safe-area insets
THE nội dung chính SHALL tránh notch/thanh home: content wrapper (`max-w-6xl`) padding-top/bottom
= `calc(2rem + env(safe-area-inset-*))`; `PWAInstallPrompt` bottom = `calc(1rem + env(safe-area-inset-bottom))`.
Nền tối vẫn full-bleed (đẹp dưới notch). Trên desktop/non-notch env()=0 → không đổi.

### REQ-03 — Chống iOS input-zoom (không tắt zoom toàn cục)
THE `index.css` SHALL: `@media (pointer: coarse) { input, textarea, select { font-size: 16px; } }`
→ iOS không auto-zoom khi focus input mà vẫn cho pinch-zoom thủ công.

### REQ-04 — App-feel touch
THE `index.css` SHALL:
- `* { -webkit-tap-highlight-color: transparent; }` (bỏ flash xám khi chạm).
- `button { touch-action: manipulation; }` (bỏ delay double-tap-zoom trên nút).
- `body { overscroll-behavior-y: none; }` (chặn pull-to-refresh kiểu trình duyệt).

### REQ-05 — Nav tab label responsive
THE nav 3 tab SHALL hiện label NGẮN trên màn hình hẹp, label đầy đủ từ `sm:` trở lên.
Ngắn: `QUEST` / `TREASURY` / `JOURNEY`. Đầy đủ: như cũ ("QUEST BOARD (Rèn luyện)"...).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ `user-scalable=no` / `maximum-scale=1` (giết pinch-zoom → hại accessibility).
- ❌ Đụng game logic / state / handlers (v1 chỉ CSS/HTML/markup hiển thị).
- ❌ Hardcode chiều cao status bar (dùng `env(safe-area-inset-*)`).
- ❌ Phá layout desktop (env()=0, label `sm:` trở lên giữ nguyên).
- ❌ `any`.

## 4. Edge Cases
- Trình duyệt cũ không hỗ trợ `env()` → coi như 0, layout như hiện tại (không vỡ).
- `pointer: coarse` cũng đúng cho tablet → input 16px ở đó, chấp nhận.
- Desktop hover vẫn hoạt động (chỉ thêm, không bỏ hover).

## 5. Definition of Done
- [x] `index.html`: lang=vi + viewport-fit=cover.
- [x] `index.css`: input 16px (coarse), tap-highlight, touch-action, overscroll.
- [x] `App.tsx`: content wrapper safe-area; nav label responsive.
- [x] `PWAInstallPrompt.tsx`: bottom safe-area.
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass.
- [x] Gap còn lại (việc sau): PNG icons (iOS home screen) + Capacitor (lên App Store/CH Play).

## 6. ADR liên quan
- Phục vụ định hướng sản phẩm: PWA-first → Capacitor. Không đổi ADR hiện có.
