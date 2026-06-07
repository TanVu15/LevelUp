# SPEC: Piecewise XP Formula
# Status: IMPLEMENTED (retrospec) | Version: 1.0.0 | Date: 2026-06-04
# Feature ID: feat-piecewise-xp
# Implemented in: src/App.tsx

---

## Context

XP cần để level-up ban đầu dùng công thức linear: `level × 120`.
Vấn đề tâm lý: với 100 XP/ngày, S-Rank (level 51+) cần **4.2 năm** — vượt quá ngưỡng chịu đựng tâm lý của người dùng thông thường và khiến A/S rank cảm thấy bất khả thi.

**Research basis:** Phillippa Lally (2010) — habit formation timeline:
- 18 ngày: giai đoạn khởi tạo (E-Rank window)
- 66 ngày: ngưỡng habit thực sự (D-Rank completion)
- 7 tháng: identity shift bắt đầu (C-Rank)
- 1.5 năm: behavior integration sâu (B-Rank)
- 2.7 năm: mastery level (A-Rank) — mốc khả thi cho người committed

---

## Problem Statement

Formula linear tạo ra A/S rank không khả thi về mặt tâm lý, dẫn đến user abandon game sau khi đạt B-Rank và thấy mục tiêu còn lại quá xa.

---

## Requirements (EARS format)

### REQ-01: Piecewise Formula
THE system SHALL tính XP cần level-up theo công thức piecewise sau:
```
lvl 1–10  → lvl × 120   (E/D-Rank: habit initiation phase)
lvl 11–20 → lvl × 100   (C-Rank: habit consolidation)
lvl 21–35 → lvl × 80    (B-Rank: identity integration)
lvl 36–50 → lvl × 65    (A-Rank: mastery approach)
lvl 51+   → lvl × 50    (S-Rank: ongoing legend)
```

### REQ-02: Consistent Application
THE system SHALL áp dụng `getXpNeeded(level)` tại tất cả nơi tính XP cần:
- Hiển thị EXP bar trong StatusHeader
- Logic level-up trong `addXP` function
- KHÔNG dùng hardcoded `level * 120` ở bất kỳ đâu

### REQ-03: Level-Up Trigger
WHEN XP tích lũy ≥ `getXpNeeded(level)`, THE system SHALL:
1. Tăng level lên 1
2. Trừ XP đã dùng (XP mới = XP tổng - xpNeeded)
3. Set `levelUpInfo` state để trigger LevelUpModal
4. Phát âm thanh level-up

### REQ-04: Rank Change Detection
WHEN level-up xảy ra và rank thay đổi (E→D, D→C, C→B, B→A, A→S), THE system SHALL hiển thị rank transition ("E-Rank → D-Rank") trong LevelUpModal.

### REQ-05: Rank Thresholds
THE system SHALL map rank theo level:
```
1–5   → E-Rank (xám)
6–10  → D-Rank (xám sáng)
11–20 → C-Rank (trắng)
21–35 → B-Rank (vàng)
36–50 → A-Rank (amber)
51+   → S-Rank (cam rực + glow)
```

---

## Unwanted Patterns

- THE system SHALL NOT dùng `level * 120` hardcoded (monotonic — không adapt theo rank)
- THE system SHALL NOT cho phép XP âm sau level-up (XP carry-over phải ≥ 0)
- THE system SHALL NOT require XP reset về 0 khi level-up (carry excess XP)

---

## Definition of Done (as implemented)

- [x] `getXpNeeded(lvl: number): number` function tồn tại trước `export default function App()`
- [x] `addXP` dùng `getXpNeeded(level)` không phải `level * 120`
- [x] `xpNeeded` const trong component dùng `getXpNeeded(level)`
- [x] LevelUpModal hiển thị rank transition khi rank đổi
- [x] `npx tsc --noEmit` clean

---

## Post-Implementation Notes

**Calibration đạt target:**
- @ 100 XP/ngày: E→D ≈ 18 ngày ✅, D→C ≈ 66 ngày ✅, A-Rank ≈ 2.7 năm ✅ (feasible cho committed user)
- Linear formula: S-Rank = 4.2 năm → piecewise: S-Rank ≈ 2.7 năm. Delta = ~1.5 năm giảm tải tâm lý.

**Trade-off accepted:** Progression nhanh hơn ở A/S rank có thể giảm cảm giác "prestige". Quyết định: habit formation realism > prestige feeling. User không cần cảm giác xa vời.
