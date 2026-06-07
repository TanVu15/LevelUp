# Shared Context — LevelUp
# Cập nhật: 2026-06-04

## Project Status
- **Phase:** v0.3.0 complete — WHY Cards, Monthly Budget, XP Anti-Exploit, Piecewise XP
- **In progress:** Daily Task Auto-Archive (ADR-013, `feat-task-archive`) — task ngày cũ tự dọn → `archivedTasks`, board chỉ hiện việc hôm nay, dòng "Đã hoàn thành: X hôm nay" + Lịch sử
- **Next milestone:** v0.4.0 (Export/Import JSON · PWA · Monthly Treasury filter)

## Completed Milestones
- v0.1.0: MVP — Quest Board, Treasury, Journey Logs, basic XP system
- v0.2.0: Psychology upgrade — Shield, Onboarding, Weekly comparison, Due dates, Weight chart, Coaching tone, 44 quotes
- v0.3.0: Motivation overhaul — WHY Cards (thay Ally system), Monthly Budget Challenge, XP anti-exploit triple gate, Piecewise XP formula, MonthlyReviewModal, CelebrationToast

## Active Decisions
- Tech stack locked: React 19 / Vite 6 / Tailwind v4 / localStorage
- No backend: intentional — privacy-first, no auth complexity
- Copyright-clean: rebrand hoàn tất (ADR-003 trong CLAUDE.md)
- UX philosophy: Self-Determination Theory + Loss Aversion prevention + coaching tone
- WHY Cards > Ally system: intrinsic motivation > extrinsic buffs (ADR-007)

## Key Architecture Points
- **State:** tất cả trong App.tsx, components stateless (props + callbacks)
- **localStorage prefix:** `ironwill_` — 18 keys, xem FEATURES.md § DATA PERSISTENCE
- **Date reset:** App mount effect, đọc `ironwill_last_open_date`, reset routines + update streak + month-transition check
- **XP formula:** Piecewise `getXpNeeded(lvl)` — L1-10: ×120, L11-20: ×100, L21-35: ×80, L36-50: ×65, L51+: ×50
- **XP anti-exploit:** Triple gate — xpClaimed/claimedAt (tasks), routineXpClaimed/overdriveXpClaimed (DayLog)
- **Daily task XP cap:** 150 XP/ngày, computed từ `tasks.filter(t => t.xpClaimed && t.claimedAt === today)` — KHÔNG dùng separate state (stale closure risk)

## Retrospec Files (v0.3.0)
Specs cho các features đã implement — dùng làm baseline cho future fixes:
- `.sdd/specs/feat-piecewise-xp/SPEC.md` — Level calibration
- `.sdd/specs/feat-xp-antiexploit/SPEC.md` — Triple gate anti-exploit
- `.sdd/specs/feat-why-cards/SPEC.md` — WHY Cards system
- `.sdd/specs/feat-monthly-budget/SPEC.md` — Monthly Budget Challenge

## Sync Points (nếu dùng multi-agent)
- Agent A (UI/Components): src/components/
- Agent B (Logic/State): src/App.tsx, src/types.ts
- Agent C (Content): src/data/quotes.ts
- Shared contract: src/types.ts — KHÔNG tự ý thêm/xóa field, phải hỏi trước
- localStorage keys: KHÔNG rename — backward compat với user data hiện tại
