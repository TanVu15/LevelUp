# SPEC — Mobile UI fixes (từ feedback ảnh thật)
# feat-mobile-ui-fixes | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Test trên iPhone phát hiện các lỗi giao diện:
1. StatusHeader: avatar/tên/rank chen chúc, `[RENAME]` vỡ dòng, subtitle "Ascendant Sovereignty" tràn mép, badge LVL lệch.
2. Ô nhập số tiền giao dịch không ngăn cách hàng nghìn kiểu VN.
3. AuthModal không che hết màn → lộ nội dung app phía sau.
4. Chọn độ khó (tier) bằng `<select>` native iOS trông thô.
5. Date picker native (giữ — xem mục 5).

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — StatusHeader responsive
THE StatusHeader top row SHALL không tràn trên màn ~360–390px:
- padding `p-5 sm:p-8`, gap `gap-3 sm:gap-5`; avatar + rank `w-14 h-14 sm:w-16 sm:h-16`.
- Khối tên: `min-w-0 flex-1`; tên `text-xl sm:text-2xl` + cho xuống dòng (không ép tràn).
- Hàng tên + `[RENAME]` + badge `LVL`: `flex-wrap items-center` → wrap gọn thay vì vỡ.
- Subtitle wrap bình thường (không bị cắt).

### REQ-02 — Định dạng tiền VN cho ô Amount
THE ô nhập Amount (TreasuryBoard) SHALL hiển thị ngăn cách hàng nghìn kiểu vi-VN (1.000.000),
`inputMode="numeric"`, lưu digits-only vào state (parse khi submit đã strip non-digit). (Budget input đã có sẵn — đồng bộ amount theo.)

### REQ-03 — AuthModal che hết màn
THE AuthModal SHALL render ở cấp root (cùng cụm modal khác, KHÔNG lồng trong content wrapper),
overlay đủ đậm để không lộ app: `bg-black/95 backdrop-blur-md`, `fixed inset-0 z-50`.

### REQ-04 — Chọn tier bằng segmented control (bỏ native select)
THE form thêm quest SHALL thay `<select>` tier bằng nhóm 3 nút (BOSS/DUNGEON/MANA) dạng segmented
(`grid-cols-3`), nút active tô màu theo tier, hiện tên + độ khó + XP. Native select popup không CSS được → bỏ hẳn.

### REQ-05 — Date picker: giữ native
THE date input GIỮ `<input type="date">` native (UX ngày tháng native trên mobile là kỳ vọng + tốt hơn tự chế).
Đã có sẵn quick-pick "Hôm nay/Ngày mai/Tuần này" nên user hiếm khi cần mở picker. Chỉ giữ, không thay.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Cố CSS popup của `<select>`/`<input type=date>` native (bất khả thi) — thay control hoặc giữ native.
- ❌ Đổi logic: tier vẫn set `newTaskTier`; amount vẫn parse digits ở submit; auth không đổi luồng.
- ❌ Phá layout desktop (dùng breakpoint `sm:` cho thay đổi mobile).
- ❌ `user-scalable=no`.
- ❌ `any`.

## 4. Edge Cases
- Tên rất dài (max 20) → wrap/scale, không tràn.
- Amount rỗng → hiện placeholder; chỉ format khi có digit.
- AuthModal trên màn cao có notch → overlay `inset-0` phủ cả safe-area (đúng ý "che hết").
- Tier mặc định vẫn 'DUNGEON'.

## 5. Definition of Done
- [x] StatusHeader: layout mobile (padding/gap/size/min-w-0/flex-wrap).
- [x] TreasuryBoard: amount format vi-VN + inputMode numeric + digits-only state.
- [x] AuthModal: chuyển render lên root + overlay đậm (bg-black/95 + blur-md).
- [x] QuestBoard: segmented tier control thay select.
- [x] Date picker: giữ native (quyết định REQ-05).
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass.

## 6. ADR liên quan
- Nối tiếp feat-mobile-readiness-v1 (PWA app-feel). Không đổi ADR hiện có.
