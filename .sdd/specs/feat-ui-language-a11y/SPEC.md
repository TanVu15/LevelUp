# SPEC — Quy ước ngôn ngữ (category VI) + a11y labels
# feat-ui-language-a11y | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
1. Ngôn ngữ trộn không quy ước: category hiển thị RAW giá trị lưu tiếng Anh
   ("Gym & Nutrition", "Unnecessary Leaks" bị cắt cụt trên mobile) ở allocation list
   + breakdown chips + ledger, trong khi select đã có nhãn VI (mỗi nơi một kiểu).
2. Toàn app chỉ có 1 `aria-label` — mọi nút icon-only (X, thùng rác, loa, đăng xuất,
   bút chì) vô hình với screen reader.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Quy ước ngôn ngữ (ghi vào CLAUDE.md)
**Heading/flavor RPG = tiếng Anh** (STRENGTH PROGRESSION, CHRONO ARENA…) —
**nội dung user cần hiểu để dùng app = tiếng Việt** (category, mô tả, nút, thông báo).

### REQ-02 — Category labels một nguồn
- `src/data/categories.ts`: `EXPENSE_CATEGORIES` (thứ tự hiển thị) +
  `CATEGORY_LABELS: Record<ExpenseCategory | 'Income Source', string>` +
  `getCategoryLabel()`. Giá trị LƯU (Transaction.category) KHÔNG đổi — chỉ đổi hiển thị.
- Nhãn: Gym & Dinh dưỡng · Công việc & Thiết bị · Sách & Phát triển · Nhà ở & Sinh
  hoạt · Chi tiêu tùy ý (rò rỉ) · Nguồn thu nhập.
- TreasuryBoard dùng map ở: select options, allocation list, breakdown chips, ledger.

### REQ-03 — aria-label cho icon-only buttons
Mọi button chỉ có icon SHALL có `aria-label` tiếng Việt: đóng modal (X), xóa giao
dịch/task/ảnh, sound toggle, đăng xuất, sửa routine, lightbox.

## 3. Unwanted Patterns
- ❌ Đổi giá trị lưu của category (vỡ data cũ + filter 'Unnecessary Leaks' trong logic).
- ❌ i18n framework (app 1 ngôn ngữ — chỉ cần quy ước).

## 4. Edge Cases
- Logic so sánh `=== 'Unnecessary Leaks'` (achievement ach3, isLeak styling) giữ nguyên — so trên giá trị lưu.
- Backup cũ import lại: category cũ vẫn là giá trị lưu hợp lệ → label áp tự động.

## 5. Definition of Done
- [x] data/categories.ts + TreasuryBoard dùng map (select/allocation/chips/ledger).
- [x] aria-label: TreasuryBoard, ProfileModal, ImportConfirmModal, StatusHeader (sound+signout),
      Timeline lightbox, AuthModal, TimelineEntry, QuestBoard (5 nút).
- [x] Quy ước ngôn ngữ ghi vào CLAUDE.md (PATTERNS).
- [x] lint + test pass.
