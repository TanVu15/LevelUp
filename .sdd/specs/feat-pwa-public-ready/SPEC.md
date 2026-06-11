# SPEC — PWA public-ready: icons PNG, favicon, self-host fonts, meta
# feat-pwa-public-ready | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
Audit GĐ0 phát hiện:
1. Icon PWA chỉ có SVG — **iOS không hỗ trợ SVG cho apple-touch-icon** → icon home
   screen iPhone vỡ. Manifest icon SVG cũng kén launcher Android.
2. `includeAssets` khai `favicon.ico` nhưng file KHÔNG tồn tại trong `public/`.
3. Fonts load từ Google CDN, workbox không runtime-cache `gstatic.com` → offline lần
   sau font fallback xấu; thêm 2 round-trip DNS/TLS lúc first paint.
4. Manifest `lang: "en"` (app tiếng Việt); index.html thiếu description/OG tags.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Bộ icon PNG (sinh từ icon-512.svg, commit vào public/)
- `scripts/generate-icons.mjs` (Playwright, chạy tay khi icon đổi) SHALL sinh:
  `icon-192.png`, `icon-512.png` (cũng dùng làm maskable — SVG gốc full-bleed nền
  #0F0F12 nên an toàn safe-zone), `apple-touch-icon.png` (180×180), `favicon-32.png`,
  và `favicon.ico` (ICO bọc PNG 32×32 — đủ cho mọi browser còn đọc /favicon.ico).
- File PNG/ICO SHALL được commit (không sinh lúc build).

### REQ-02 — Manifest
- `lang: 'vi'`; icons: PNG 192 (any), PNG 512 (any), PNG 512 (maskable). Giữ SVG 512
  làm entry bổ sung (browser hiện đại chọn được). `includeAssets` liệt kê đúng file tồn tại.

### REQ-03 — index.html meta
- `apple-touch-icon` → `/apple-touch-icon.png`; thêm `<link rel="icon">` PNG 32.
- Thêm `meta description`, OG (title/description/image=/icon-512.png/type), twitter card.
- GỠ 3 thẻ link Google Fonts (preconnect ×2 + stylesheet).

### REQ-04 — Self-host fonts (@fontsource)
- Deps mới: `@fontsource/space-grotesk` (400/500/700), `@fontsource/jetbrains-mono`
  (400/600/700), `@fontsource/plus-jakarta-sans` (400/500/700/800).
- Import per-weight CSS trong `main.tsx` (trước `index.css`). Fontsource tự khai
  unicode-range (latin + vietnamese) → browser chỉ tải subset cần.
- woff2 ra `dist/assets` → globPatterns đã có `woff2` → SW precache → font offline 100%.

## 3. Unwanted Patterns
- ❌ Sinh icon lúc build (thêm Playwright vào build chain — chậm, fragile).
- ❌ Runtime-cache gstatic (giữ phụ thuộc CDN) — self-host triệt để hơn, đã chọn.
- ❌ Import cả family full (mọi weight) — chỉ import weight đang dùng.

## 4. Edge Cases
- ICO bọc PNG: hợp lệ từ Vista/IE9+, mọi browser hiện đại OK.
- Maskable: SVG gốc full-bleed (rect 512×512 nền) → vùng safe-zone 80% vẫn kín nền, không cần padding thêm.
- Font flash: woff2 local + preload tự nhiên qua bundle CSS — FOUT ngắn hơn CDN, chấp nhận `font-display: swap` mặc định của fontsource.

## 5. Definition of Done
- [x] 5 file icon mới trong public/, script sinh icon trong scripts/.
- [x] vite.config manifest cập nhật (lang vi + PNG icons), index.html meta + bỏ Google Fonts.
- [x] main.tsx import fontsource weights; npm deps thêm 3 package.
- [x] Build pass; dist KHÔNG còn reference fonts.googleapis.com; fonts trong precache
      (+globIgnores bỏ woff trùng/subset không dùng — precache 1.51MB, ngang trước khi thêm fonts).
- [x] Audit preview (scripts/audit-preview.mjs) không console error, manifest lang=vi + PNG icons.

## 6. ADR liên quan
- ADR-004 (Tailwind v4) — font-family vars trong index.css giữ nguyên tên family.
