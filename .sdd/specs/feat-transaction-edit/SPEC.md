# SPEC — Sửa giao dịch + ẩn chart income khi chưa đủ dữ liệu
# feat-transaction-edit | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
1. Ledger chỉ có XÓA — gõ sai số tiền phải xóa nhập lại (UI/UX review D1).
2. INCOME TRAJECTORY render khi mới có 1 tháng dữ liệu → 1 cột đơn độc giữa khung
   lớn, nhìn như lỗi (review B3).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Sửa giao dịch
- App.tsx: `updateTransaction(id, patch: { title; amount; type; category })` —
  map qua transactions, KHÔNG cộng XP (sửa không phải log mới), không đổi `date`/`id`.
- TreasuryBoard: nút Pencil mỗi dòng ledger (aria-label) → load giá trị vào form
  LOG NEW CASH FLOW + `editingId`; form scroll into view. Khi editing: nút submit
  "CẬP NHẬT GIAO DỊCH" + nút "Hủy" (reset form + editingId). Submit gọi
  updateTransaction rồi reset.
- Đổi type khi đang sửa: effect type→category mặc định hiện có giữ nguyên (chấp nhận).

### REQ-02 — Chart income tối thiểu 2 tháng
- Điều kiện render `incomeMonths.length > 0` → `>= 2`. Khi có đúng 1 tháng: không
  render khung chart (số tổng thu đã có ở VALUE INFLOW — không mất thông tin).

## 3. Unwanted Patterns
- ❌ XP khi sửa (exploit: sửa qua lại farm XP — không bao giờ).
- ❌ Modal sửa riêng (form sẵn có đủ — ít code, ít state).
- ❌ Cho sửa `date` (giữ scope nhỏ; sai ngày thì xóa nhập lại — hiếm).

## 4. Edge Cases
- Đang sửa mà xóa đúng giao dịch đó (nút xóa vẫn hiện): editingId trỏ id không còn
  → submit `updateTransaction` map không match = no-op an toàn; nút Hủy luôn thoát được.
- Đang sửa rồi đổi tháng filter: form giữ nguyên (độc lập filter).

## 5. Definition of Done
- [x] updateTransaction (App) + edit mode TreasuryBoard + nút Hủy + Pencil/aria ledger.
- [x] Chart ẩn khi <2 tháng income.
- [x] lint + test pass.
