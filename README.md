# LevelUp — Ascent & Discipline Tracker

Một ứng dụng **quản lý công việc + chi tiêu** được game hóa (gamification) theo phong cách
RPG "Hệ Thống" (System) bóng tối — lấy **cảm hứng** từ thể loại tiến hóa sức mạnh đơn độc,
nhưng **toàn bộ tên gọi, nhân vật và hình ảnh đều là nguyên gốc** để an toàn bản quyền.

## Tính năng

- **Quest Board** — Daily Protocol (6 thói quen cốt lõi) + nhiệm vụ theo 3 cấp độ:
  `BOSS RAID` (mục tiêu lớn), `DUNGEON GATE` (việc trong ngày), `MANA FARM` (việc vặt).
- **Chrono Arena** — Focus timer (25/45/60 phút) thưởng EXP khi hoàn thành.
- **Treasury Ledger** — Quản lý thu/chi (VND), phát hiện "rò rỉ" (Unnecessary Leaks), biểu đồ phân bổ.
- **Journey & Streaks** — Lưới đóng góp 28 ngày, nhật ký cân nặng, huy chương thành tựu.
- **Level / Rank / EXP** — Hệ thống lên cấp E→S, streak, hai chế độ Mindset (Discipline / Motivation).
- Lưu trữ cục bộ bằng `localStorage`, hiệu ứng âm thanh tổng hợp bằng Web Audio API.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + lucide-react.

## Chạy local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm run lint     # type-check
```

## Lưu ý bản quyền

App này được thiết kế theo hướng *"inspired by"*: dùng các cơ chế RPG chung (level, quest,
chỉ số, đánh boss) — vốn không được bảo hộ bản quyền — và **tự đặt tên/nhân vật/hình ảnh riêng**.
Không sử dụng tên gọi, nhân vật, artwork hay lời thoại độc quyền của bất kỳ tác phẩm nào.
Avatar/đồng minh được render bằng gradient + icon, không phụ thuộc ảnh ngoài.
