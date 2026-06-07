# SPEC: Monthly Budget Challenge
# Status: IMPLEMENTED (retrospec) | Version: 1.0.0 | Date: 2026-06-04
# Feature ID: feat-monthly-budget
# Implemented in: src/App.tsx, src/components/TreasuryBoard.tsx, src/components/MonthlyReviewModal.tsx

---

## Context

Finance gamification có nguy cơ tạo ra sai behaviors:
- Reward per transaction → incentivize **nhiều giao dịch** = chi tiêu nhiều hơn (backwards)
- Reward nhập data → không liên quan đến **kết quả tài chính thực**

Monthly Budget Challenge giải quyết bằng cách reward **outcome** (tiết kiệm được bao nhiêu % so với budget), không phải **activity** (nhập bao nhiêu giao dịch).

---

## Problem Statement

Cần một mechanic tài chính tạo accountability loop hàng tháng mà incentivize tiết kiệm thực sự, đồng thời dùng coaching tone (không shame) khi user vượt budget.

---

## Requirements (EARS format)

### REQ-B1: Monthly Budget Setting
THE system SHALL cho phép user set một budget (VND) cho mỗi tháng.
Budget được lưu theo key `YYYY-MM` trong `ironwill_monthly_budgets` (Record<string, number>).

### REQ-B2: One Budget Per Month
THE system SHALL chỉ cho phép 1 budget per tháng-năm combination.
WHEN user thay đổi budget giữa tháng, giá trị mới SHALL overwrite giá trị cũ cho cùng YYYY-MM key.

### REQ-B3: Budget Display in Treasury
THE system SHALL hiển thị budget panel trong TreasuryBoard phía trên danh sách giao dịch:
- Budget tháng hiện tại (VND)
- Chi tiêu thực tế tháng này (VND)
- Số tiền còn lại hoặc vượt quá
- Progress bar màu: xanh lá (< 70%) → amber (70–90%) → đỏ (> 90%)

### REQ-B4: Inline Budget Edit
WHEN budget đã được set, THE system SHALL hiển thị giá trị + pencil icon.
WHEN user clicks pencil, THE system SHALL chuyển sang inline edit mode với:
- Input nhập số VND
- Enter hoặc checkmark để save
- Escape hoặc click ngoài để cancel

### REQ-B5: Month Transition Detection
WHEN user mở app và `lastOpenDate.slice(0,7) !== today.slice(0,7)` (tháng mới), THE system SHALL trigger MonthlyReviewModal.

### REQ-B6: Monthly Review Modal
MonthlyReviewModal SHALL hiển thị:
- Tiêu đề: tháng vừa qua (YYYY-MM format human-readable)
- Chi tiêu thực tế vs budget
- Progress bar với % đã dùng
- Phần tiết kiệm (VND + %) hoặc phần vượt (VND + %)
- XP reward badge (nếu tiết kiệm được)
- Input budget cho tháng mới (pre-filled từ budget tháng trước nếu có)
- Button "Bắt đầu tháng mới →"

### REQ-B7: XP Rewards (Savings Milestones)
WHEN sang tháng mới và tháng trước có budget được set, THE system SHALL trao XP theo savings rate:
```
savings% = (budget - actual_expense) / budget × 100

savings% ≥ 30%  → +200 XP
savings% 15–29% → +120 XP
savings% 1–14%  → +60 XP
savings% ≤ 0%   → 0 XP (vượt budget, không phạt)
```

### REQ-B8: XP Calculation from Expense
THE system SHALL tính `actual_expense` chỉ từ transactions type `EXPENSE` trong tháng trước (không bao gồm INCOME).

### REQ-B9: No Budget Punishment
WHEN user vượt budget, THE system SHALL hiển thị kết quả với coaching tone, KHÔNG hiển thị warning đỏ aggressive hay shaming language.
Ngôn ngữ mẫu: "Tháng này vượt X VND. Tháng mới là cơ hội mới." (không phải "Bạn đã thất bại!")

### REQ-B10: Pre-fill New Budget
WHEN MonthlyReviewModal mở, THE system SHALL pre-fill budget input với giá trị budget tháng trước (nếu tồn tại).
User có thể thay đổi trước khi confirm.

### REQ-B11: Modal One-Time Per Transition
THE system SHALL chỉ trigger MonthlyReviewModal 1 lần per month-transition event.
WHEN user đóng modal ("Bắt đầu tháng mới →"), THE system SHALL lưu budget tháng mới và KHÔNG trigger lại modal trong tháng đó.

### REQ-B12: Budget Without Transaction Data
WHEN không có transactions nào trong tháng trước, THE system SHALL hiển thị modal với actual_expense = 0 (100% tiết kiệm → +200 XP).

---

## Unwanted Patterns

- THE system SHALL NOT trao XP per transaction nhập (tránh incentivize data volume)
- THE system SHALL NOT phạt user bằng streak loss, shield loss, hay XP âm khi vượt budget
- THE system SHALL NOT dùng ngôn ngữ shame/judge trong budget feedback
- THE system SHALL NOT hiển thị MonthlyReviewModal nhiều hơn 1 lần per month-transition
- THE system SHALL NOT dùng `Date.now()` cho month detection — luôn dùng `today.slice(0,7)` vs `lastOpenDate.slice(0,7)` để tránh timezone issues

---

## Definition of Done (as implemented)

- [x] `monthlyBudgets: Record<string, number>` state trong App.tsx
- [x] `ironwill_monthly_budgets` localStorage key
- [x] Budget panel trong TreasuryBoard: display + progress bar + inline edit
- [x] Month transition detection trong mount effect
- [x] `MonthlyReviewModal` component tồn tại trong `src/components/`
- [x] MonthlyReviewModal: kết quả tháng trước + XP badge + budget input mới
- [x] XP reward logic cho 3 tiers savings (60/120/200 XP)
- [x] `MonthlyReviewState` type exported từ MonthlyReviewModal
- [x] `monthlyReview` state trong App.tsx trigger modal
- [x] Coaching tone trong TreasuryBoard spending review (không đỏ aggressive)
- [x] `npx tsc --noEmit` clean

---

## Data Flow

```
App mount
  → compare lastOpenDate.slice(0,7) vs today.slice(0,7)
  → if new month: calculate savings for prev month
      → compute actual_expense from transactions where date.startsWith(prevYM)
      → compute savings% from monthlyBudgets[prevYM]
      → determine XP tier
      → setMonthlyReview({ prevYM, budget, actual, xp }) → trigger modal

MonthlyReviewModal submit
  → setMonthlyBudgets(prev => ({ ...prev, [currentYM]: newBudget }))
  → if xp > 0: addXP(xp)
  → setMonthlyReview(null) → close modal
```

---

## Psychological Rationale

**Outcome vs Activity Rewards:**
Reward activity (logging transactions) → user logs more, spends more carelessly.
Reward outcome (% saved) → user is incentivized to actually spend less.

**Monthly Ritual (Accountability Moment):**
Month-transition modal creates a forced reflection point — không thể bỏ qua khi mở app.
User phải đối diện với kết quả tháng trước trước khi tiếp tục.
This is **implementation intention** nudge: "Bắt đầu tháng mới →" framing.

**Coaching vs Shame:**
Loss Aversion research (Kahneman): người ta cảm thấy mất mát gấp 2× gain.
Shame → avoidance behavior → user stop tracking → app abandoned.
Coaching → reflection → continued use → behavior improvement over time.
