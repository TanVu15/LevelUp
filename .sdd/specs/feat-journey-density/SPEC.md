# SPEC — JOURNEY mobile: timeline thu gọn + widgets lên trên
# feat-journey-density | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
UI/UX review 2026-06-11 (screenshot mobile, dữ liệu 30 ngày): timeline render TOÀN BỘ
ngày (~6.700px) → Huy Chương, Weight Trend, widget Bảo Vệ Tiến Trình (nút đăng nhập!)
bị chôn dưới đáy — không ai cuộn tới. Nút "Thêm ảnh ngày này" lặp ở mọi ngày = noise.
Desktop 2 cột không bị (right column hiển thị song song).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Timeline thu gọn
- Mặc định hiện **7 entry** đầu (mới nhất). Nút "Xem thêm 7 ngày (còn N)" tăng dần
  +7; ẩn khi hết. State local, reset mỗi lần vào tab (không persist).

### REQ-02 — Thứ tự mobile
- Mobile (1 cột): Quick log + Streak Map → **Achievements → Weight/Backup widgets**
  → Timeline (cuối, vì dài vô hạn).
- Desktop (lg): GIỮ NGUYÊN bố cục 2 cột hiện tại (left 8: log+streak+timeline,
  right 4: widgets) — đạt bằng cách tách left column thành 2 grid item
  (left-top: col-span-8; timeline: col-span-8 col-start-1) + right (col-span-4
  row-span-2 col-start-9). DOM order = left-top, right, timeline → mobile tự đúng.

### REQ-03 — Nút thêm ảnh chỉ ngày gần
- TimelineEntry nhận `canUploadPhoto: boolean`. Nút upload ("Check body hôm nay" /
  "Thêm ảnh ngày này") CHỈ render khi true. Timeline pass true cho entry trong vòng
  7 ngày gần nhất. Ảnh ĐÃ CÓ của ngày cũ vẫn hiển thị + xóa được (không đổi).

## 3. Unwanted Patterns
- ❌ Đổi bố cục desktop (review chỉ phát hiện vấn đề mobile).
- ❌ Virtualization library (overkill — slice là đủ).
- ❌ Persist visibleCount.

## 4. Edge Cases
- entries ≤ 7 → không có nút Xem thêm.
- entries.length đếm "mốc" hiển thị ở badge — giữ tổng số (không đổi theo slice).
- Empty state (≤1 entry) giữ nguyên.

## 5. Definition of Done
- [x] Slice + Xem thêm; 3 grid item với order/col classes; canUploadPhoto.
- [x] Screenshot mobile xác nhận thứ tự mới + timeline 7 ngày; desktop không đổi.
- [x] lint + build pass.

## 6. ADR liên quan
- Tinh thần feat-mobile-density (giảm lướt tới chức năng chính).
