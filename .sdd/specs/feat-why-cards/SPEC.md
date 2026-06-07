# SPEC: WHY Cards System
# Status: IMPLEMENTED (retrospec) | Version: 1.0.0 | Date: 2026-06-04
# Feature ID: feat-why-cards
# Implemented in: src/App.tsx, src/types.ts, src/components/QuestBoard.tsx, src/components/OnboardingModal.tsx

---

## Context

**Hệ thống Ally cũ (v0.2.0):**
- 3 nhân vật game pre-defined (Ally A, B, C), mỗi ally có stat buff khác nhau
- User chọn 1 ally active → buff được tính vào XP
- Vấn đề: tạo "optimal choice anxiety" (luôn chọn ally buff cao nhất), extrinsic motivation yếu → churn sau 2–3 tuần

**WHY Cards (v0.3.0):**
- User tự định nghĩa 3 thẻ động lực cá nhân (PAIN / FAILURE / GOAL)
- Không có buff số liệu — chỉ là anchor tâm lý
- Nguồn gốc: Self-Determination Theory (Deci & Ryan) — intrinsic motivation bền hơn extrinsic
- User's own WHY = anchor mạnh nhất, không thể thay thế bằng game character

---

## Problem Statement

Ally system tạo extrinsic motivation loop yếu và "optimal play" anxiety. Cần thay bằng intrinsic motivation system để tăng long-term retention.

---

## Requirements (EARS format)

### REQ-W1: WHY Card Types
THE system SHALL support 3 loại WHY card:
- `PAIN` (💔) — Điều người dùng không muốn tiếp diễn
- `FAILURE` (❌) — Điều người dùng muốn lật ngược
- `GOAL` (🔥) — Điều người dùng khao khát nhất

### REQ-W2: Maximum 3 Cards
THE system SHALL giới hạn tổng WHY cards ở **tối đa 3 thẻ** per user.

### REQ-W3: Sequential Slot Reveal
THE system SHALL chỉ hiển thị nút thêm card tiếp theo sau khi slot trước đó đã được điền.
(Slot 2 chỉ mở sau khi slot 1 có card; Slot 3 chỉ mở sau khi slot 2 có card)

### REQ-W4: Card Fields
Mỗi WHY card SHALL có:
- `id: string` — unique identifier
- `type: WhyCardType` — PAIN | FAILURE | GOAL
- `title: string` — tên ngắn của WHY (required, min 3 ký tự)
- `story: string` — chi tiết tuỳ chọn (có thể empty string)

### REQ-W5: Display Location
THE system SHALL hiển thị WHY cards trong Quest Board tab, trong panel "MY WHY / LÝ DO CỦA TÔI", bên dưới Focus Timer.

### REQ-W6: Inline Editing
WHEN user hover over a filled WHY card, THE system SHALL hiển thị pencil icon.
WHEN user clicks pencil icon, THE system SHALL chuyển card sang edit mode với:
- Type selector (3 nút PAIN / FAILURE / GOAL)
- Title input
- Story textarea
- Buttons: Lưu / Hủy / Xóa

### REQ-W7: Validation
THE system SHALL yêu cầu title ≥ 3 ký tự trước khi cho phép save.
THE system SHALL cho phép story là empty string.

### REQ-W8: Delete
WHEN user clicks Xóa trong edit mode, THE system SHALL xóa card khỏi whyCards array và đóng form.

### REQ-W9: Persistence
THE system SHALL lưu `whyCards` array vào `ironwill_why_cards` localStorage (JSON).
THE system SHALL load whyCards từ localStorage khi app khởi động.

### REQ-W10: Onboarding Integration
Bước 2 của OnboardingModal SHALL yêu cầu user tạo WHY card đầu tiên với:
- Type selector
- Title input (min 3 ký tự, validated trước khi Next)
- Story textarea (optional)
WHEN user hoàn thành onboarding, THE system SHALL lưu WHY card đầu tiên vào `whyCards` state.

### REQ-W11: Remove Ally System Completely
THE system SHALL NOT còn bất kỳ reference nào đến ally system:
- Không có `activeAllyId` state
- Không có ally buff calculations trong addXP
- Không có ally-related localStorage keys

---

## Unwanted Patterns

- THE system SHALL NOT tạo pre-defined WHY cards — user phải tự định nghĩa từ đầu
- THE system SHALL NOT có buff/bonus số liệu gắn với WHY card types (không tạo "optimal type")
- THE system SHALL NOT cho phép tạo quá 3 cards
- THE system SHALL NOT reset whyCards khi refresh app

---

## Definition of Done (as implemented)

- [x] `WhyCardType` type và `WhyCard` interface trong types.ts
- [x] `whyCards: WhyCard[]` state trong App.tsx (persist → localStorage)
- [x] `ironwill_why_cards` localStorage key
- [x] WHY panel trong QuestBoard: hiển thị 3 slots với sequential reveal
- [x] Inline edit mode: hover → pencil → form → Lưu/Hủy/Xóa
- [x] OnboardingModal step 2: WHY card creation form
- [x] `onComplete(name, task, whyCard)` callback trong OnboardingModal
- [x] `activeAllyId`, `bossRaidsCompleted` state bị xóa
- [x] Không còn ally buff trong addXP
- [x] `npx tsc --noEmit` clean

---

## Psychological Rationale

**Self-Determination Theory (Deci & Ryan, 1985):**
Intrinsic motivation (autonomy, mastery, purpose) → long-term engagement.
Extrinsic motivation (rewards, buffs) → short-term engagement, churn khi reward hết.

**Implementation insight:**
User's own PAIN/FAILURE/GOAL = strongest possible anchor vì:
1. Autonomy: user tự chọn, không bị áp đặt
2. Relatedness: kết nối với story cá nhân thực tế
3. Purpose: rõ ràng "Tôi làm điều này vì..."

WHY cards không give buff → không có optimal choice → không có anxiety → user focus vào meaning, không phải optimization.
