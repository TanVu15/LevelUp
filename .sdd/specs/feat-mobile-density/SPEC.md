# SPEC — Tăng mật độ mobile (giảm lướt tới chức năng chính)
# feat-mobile-density | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Trên mobile phải lướt quá nhiều mới tới chức năng chính (task): header trang trí + thẻ Status to,
rồi QuestBoard xếp Routine → Focus Timer → WHY → Challenge → Add → Task tiers. Task bị chôn sau Timer/WHY.

Hướng đã chốt (multi): (a) sắp lại thứ tự QuestBoard, (b) thu gọn đầu trang, (c) thẻ Status thu gọn-mở rộng.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Ẩn header trang trí trên mobile
THE `AppHeader` (logo + PROJECT + SERVER STATE) SHALL `hidden md:flex` → mất trên mobile (info name/level
đã có ở StatusHeader + bottom nav). Desktop giữ nguyên.

### REQ-02 — StatusHeader thu gọn-mở rộng trên mobile
THE StatusHeader mobile (mặc định) SHALL chỉ hiện: avatar + tên + LVL + thanh EXP. Ẩn (mở khi bấm): rank badge,
subtitle "Ascendant Sovereignty", khối MINDSET TUNING, 3 ô counter (streak/shields/cleared).
- Nút toggle (chevron, `md:hidden`): "Chi tiết" ▾ / "Thu gọn" ▴, mặc định đóng.
- Trên `md:`+ hiện TẤT CẢ bất kể trạng thái toggle (desktop không đổi).

### REQ-03 — Sắp lại QuestBoard (Timer + WHY xuống cuối)
THE QuestBoard SHALL chuyển **Focus Timer** + **WHY Panel** từ cột trái xuống CUỐI cột phải (sau Task tiers).
→ Thứ tự mobile: Routine → Daily Challenge → Add quest → Task tiers → Focus Timer → WHY.
Desktop: cột trái = Routine; cột phải = Challenge + Add + Tiers + Timer + WHY (vẫn 2 cột, chấp nhận lệch chiều cao).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Ẩn EXP bar / tên / level khi thu gọn (đó là thông tin chính cần thấy ngay).
- ❌ Ẩn nội dung trên desktop (chỉ thu gọn ở mobile, `md:` luôn hiện).
- ❌ Đổi logic state/handler (chỉ bố cục + 1 state UI `detailsOpen`).
- ❌ Phá layout desktop QuestBoard (vẫn 2 cột).
- ❌ `any`.

## 4. Edge Cases
- Desktop: toggle ẩn (`md:hidden`), mọi mục hiện.
- Đang sửa tên (isEditingName) khi thu gọn: vẫn ở phần luôn-hiện (avatar/name) → OK.
- Timer đang chạy khi nằm cuối trang: vẫn hoạt động (chỉ đổi vị trí DOM).

## 5. Definition of Done
- [x] `AppChrome.tsx`: AppHeader `hidden md:flex`.
- [x] `StatusHeader.tsx`: state `detailsOpen` + gate rank/subtitle/mindset/counters trên mobile + nút toggle "Chi tiết/Thu gọn".
- [x] `QuestBoard.tsx`: tách Timer + WHY thành cột `order-last` → mobile xuống cuối, desktop vẫn 2 cột.
- [x] `npm run lint` + `npm test` (34) + `npm run build` pass.

## 6. ADR liên quan
- Tiếp nối feat-mobile-readiness-v1 + feat-bottom-tab-nav (mobile-first). Không đổi ADR.
