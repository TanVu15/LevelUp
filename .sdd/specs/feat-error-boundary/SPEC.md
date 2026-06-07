# SPEC — Error Boundary (chống trắng app)
# feat-error-boundary | Status: IN PROGRESS | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Hiện một lỗi render bất kỳ (localStorage JSON hỏng, data lạ từ import/cloud, bug runtime) sẽ
unmount toàn bộ React → **trắng màn hình**, user không có lối thoát và có nguy cơ tưởng mất dữ liệu.
localStorage vẫn còn nguyên, nên cần một màn hình cứu hộ: tải lại + xuất backup thô.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — ErrorBoundary component
THE system SHALL có `src/components/ErrorBoundary.tsx` (class component, vì React error boundary
bắt buộc class) implement `getDerivedStateFromError` + `componentDidCatch`:
- Bắt lỗi render của cây con, hiển thị fallback thay vì trắng trang.
- `componentDidCatch` log `console.error` (không nuốt im lặng — để debug).

### REQ-02 — Fallback UI (đồng bộ phong cách dark/mono)
Fallback SHALL hiển thị:
- Thông báo trấn an: dữ liệu vẫn an toàn trong máy, chưa mất.
- Nút **"Tải lại"** → `window.location.reload()`.
- Nút **"Xuất dữ liệu (.json)"** → dump TẤT CẢ key `ironwill_` trong localStorage ra file
  `levelup-rescue-YYYY-MM-DD.json` (raw key→value, KHÔNG phụ thuộc schema/migrate — phải chạy được
  ngay cả khi app đang lỗi).
- (Tuỳ chọn) hiện `error.message` thu gọn cho người rành kỹ thuật.

### REQ-03 — Bọc App
THE `main.tsx` SHALL bọc `<App/>` trong `<ErrorBoundary>` (trong `StrictMode`).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Nuốt lỗi im lặng (phải `console.error`).
- ❌ Xuất backup phụ thuộc `exportBackup`/`migrate` (có thể chính nó lỗi) — dump raw localStorage.
- ❌ Dùng `alert()`/`confirm()` (ADR-005) — fallback là UI thật.
- ❌ Đụng/đổi key `ironwill_` (DATA-01) — chỉ đọc.
- ❌ `any` (dùng kiểu cho state/props; `componentDidCatch(error: Error, info: React.ErrorInfo)`).

## 4. Edge Cases
- localStorage rỗng → file xuất là `{}` (không crash).
- `URL.createObjectURL` không khả dụng (hiếm) → bọc try/catch, vẫn còn nút Tải lại.
- Lỗi lặp lại sau reload: user vẫn xuất được dữ liệu để cứu.

## 5. Definition of Done
- [ ] `src/components/ErrorBoundary.tsx`.
- [ ] `main.tsx` bọc `<App/>`.
- [ ] `npm run lint` + `npm test` (33) + `npm run build` pass.

## 6. ADR liên quan
- ENG-03 tinh thần "app không crash". DATA-01 (chỉ đọc key, không đổi).
