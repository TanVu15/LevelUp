# SPEC — Tách JSX trang trí ra AppChrome (bước đệm giảm App.tsx)
# feat-app-chrome-extraction | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
`App.tsx` 871 dòng (ENG-02 giới hạn 400). Một phần lớn là JSX TRANG TRÍ thuần tĩnh
(background glow, 2 side panel "SYSTEM S-RANK"/"YOUR WHY", header, footer) — không chứa state,
chỉ nhận vài giá trị hiển thị. Bóc ra component presentational là thay đổi AN TOÀN (zero behavior),
bước đệm trước khi refactor state bằng custom hooks.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — components/AppChrome.tsx
THE system SHALL có `src/components/AppChrome.tsx` export 3 component presentational thuần:
- `AppBackdrop({ themeStyle })` — background glow + left panel + right panel (toàn bộ lớp `fixed/absolute` trang trí, `pointer-events-none`).
- `AppHeader({ themeStyle, hunterName, level })` — khối `<header>` logo + "PROJECT: DISCIPLINED LIFE" + Operator/Level + SERVER STATE.
- `AppFooter()` — `<footer>` tĩnh (SYS_STABLE / DATA_SYNC / khẩu hiệu).

Type dùng chung: `type ThemeStyle = 'discipline' | 'motivation'`.

### REQ-02 — App.tsx dùng các component, markup KHÔNG đổi
THE `App.tsx` SHALL thay 3 khối JSX tương ứng bằng `<AppBackdrop>`, `<AppHeader>`, `<AppFooter>`.
Markup (class Tailwind, text, icon) giữ NGUYÊN 100% — chỉ đổi vị trí, không đổi giao diện.
Import lucide không còn dùng trong App.tsx (`Zap`, `Shield`, `Compass`) chuyển sang AppChrome.

### REQ-03 — Không đổi hành vi
KHÔNG đụng state/effect/handler. `themeStyle`, `hunterName`, `level` vẫn truyền từ App.tsx xuống.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Đổi class Tailwind / text / layout (đây là di chuyển thuần, giao diện phải y hệt).
- ❌ Đọc state/localStorage trong AppChrome (ARCH-02) — chỉ nhận props hiển thị.
- ❌ Thêm logic, handler, effect vào AppChrome.
- ❌ Dùng template literal cho class động kiểu `bg-${x}` (Tailwind v4 purge — giữ full class string như cũ).
- ❌ `any`.

## 4. Edge Cases
- `themeStyle` chỉ có 2 giá trị — class điều kiện giữ nguyên cặp `discipline`/`motivation` đầy đủ (không nội suy).

## 5. Definition of Done
- [x] `components/AppChrome.tsx` (AppBackdrop, AppHeader, AppFooter).
- [x] `App.tsx` dùng 3 component, gỡ JSX cũ + import lucide thừa (871 → 797 dòng).
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass. Giao diện không đổi.
- [x] Ghi nhận: bước 1/2 của việc giải quyết god-component (bước 2 = custom hooks, SPEC riêng).

## 6. ADR liên quan
- Hướng tới ENG-02 (<400 dòng). ARCH-02 (component nhận props, không đọc state).
