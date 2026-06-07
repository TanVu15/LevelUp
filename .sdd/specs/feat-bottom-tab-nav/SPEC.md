# SPEC — Bottom tab navigation (mobile)
# feat-bottom-tab-nav | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Định hướng mobile-first. Thanh tab QUEST/TREASURY/JOURNEY đang nằm TRÊN (in-flow) — trên điện thoại
khó với ngón cái. App mobile thật đặt navigation ở ĐÁY. Cần thanh tab đáy cố định cho mobile,
giữ nav trên cho desktop (web rộng).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Bottom tab bar (mobile)
THE App SHALL có thanh tab cố định đáy CHỈ trên mobile (`md:hidden`, `fixed bottom-0 inset-x-0 z-40`):
- 3 tab QUEST/TREASURY/JOURNEY, mỗi tab icon + nhãn ngắn, xếp dọc (icon trên, chữ dưới).
- Tab active: màu cam (icon + chữ), icon hơi phóng to; inactive: zinc.
- Nền mờ tối + border-top; padding đáy theo `env(safe-area-inset-bottom)` (không đè thanh home).
- Bấm phát `playClickSound` nếu bật tiếng; set `activeTab`.

### REQ-02 — Top nav chỉ còn desktop
THE nav trên (in-flow) SHALL chỉ hiện từ `md:` (`hidden md:grid`). Mobile không hiện (đã có bar đáy).

### REQ-03 — Chừa chỗ cho bar
THE content wrapper SHALL có padding đáy đủ trên mobile để nội dung không bị bar che
(`pb-28 md:pb-8`); giữ safe-area-inset-top cho phần trên.

### REQ-04 — Không đè PWA install prompt
THE `PWAInstallPrompt` SHALL nâng vị trí đáy để không chồng lên thanh tab (clear chiều cao bar + safe-area).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Hiện cả 2 nav cùng lúc trên 1 breakpoint (mobile chỉ bar đáy, desktop chỉ nav trên).
- ❌ Bar đè thanh home iOS (phải dùng `env(safe-area-inset-bottom)`).
- ❌ Nội dung cuối trang bị bar che (thiếu padding đáy).
- ❌ z-index bar cao hơn modal (modal phải phủ được bar).
- ❌ Đổi logic tab / state `activeTab`.
- ❌ `any`.

## 4. Edge Cases
- Desktop: chỉ nav trên; không có bar → padding đáy bình thường (`md:pb-8`).
- Modal mở (Auth/LevelUp...) z cao hơn → phủ bar (đúng).
- Install prompt hiện trên mobile + bar → prompt nằm trên bar, không chồng.

## 5. Definition of Done
- [x] `App.tsx`: bottom tab bar (md:hidden) + top nav `hidden md:grid` + padding đáy `pb-28 md:pb-8`.
- [x] `PWAInstallPrompt.tsx`: nâng bottom (4.75rem + safe-area) để clear bar.
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass.

## 6. ADR liên quan
- Phục vụ định hướng mobile-first (sau feat-mobile-readiness-v1). Không đổi ADR.
