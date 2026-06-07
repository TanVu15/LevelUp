# SPEC — Mobile UI fixes #2 (AuthModal header + Mindset row)
# feat-mobile-ui-fixes-2 | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Feedback ảnh thật:
1. AuthModal: dòng "LevelUp" sát "Bắt đầu hành trình" (do `leading-none`, không khoảng cách).
2. StatusHeader khối MINDSET TUNING trên mobile sắp xếp xấu: nút âm thanh `ml-auto` trôi lẻ sang phải;
   link "Đăng nhập" có `border-l` thành vạch dọc lạc lõng khi xếp dọc.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Giãn header AuthModal
THE cụm tiêu đề AuthModal SHALL có khoảng cách hợp lý giữa "LevelUp" và "Bắt đầu hành trình"
(bỏ `leading-none`, thêm gap nhỏ).

### REQ-02 — Mindset row gọn trên mobile
THE khối MINDSET TUNING SHALL dùng `flex flex-wrap items-center gap-3` (thay `flex-col sm:flex-row items-start`):
- Nút âm thanh: BỎ `ml-auto sm:ml-0` (hết trôi lẻ) — nằm cạnh cụm toggle.
- Auth (Đăng nhập / chỉ báo email): viền trái + padding CHỈ từ `sm:` (`sm:border-l sm:pl-3`), và `sm:ml-auto`
  để trên desktop dạt phải, trên mobile wrap tự nhiên không có vạch dọc thừa.
- Hai nút Motivation/Discipline giữ nguyên.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ `ml-auto` cố định gây phần tử trôi lẻ trên mobile.
- ❌ `border-l`/`pl` hiện trên mobile (vạch dọc lạc lõng khi xếp dọc).
- ❌ Đổi logic toggle mode / sound / auth.
- ❌ `any`.

## 4. Edge Cases
- Chưa cấu hình Firebase → không có cụm auth (giữ nguyên điều kiện `isConfigured`).
- Đã đăng nhập → hiện email + nút đăng xuất (cùng quy tắc border `sm:`).
- Màn rất hẹp → các cụm wrap xuống dòng, canh trái gọn.

## 5. Definition of Done
- [x] `AuthModal.tsx`: giãn header (flex-col gap-1, bỏ leading-none).
- [x] `StatusHeader.tsx`: mindset row flex-wrap + bỏ ml-auto + border auth `sm:`.
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass.

## 6. ADR liên quan
- Nối tiếp feat-mobile-ui-fixes. Không đổi ADR.
