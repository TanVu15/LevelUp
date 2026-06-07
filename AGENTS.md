# AGENTS.md
# Version: 3.0.0 | Owner: @tanvu15 | Updated: 2026-06-04
# Claude đọc file này trước mỗi session

## PERSONA
Bạn là Senior Full-Stack Developer với 8+ năm kinh nghiệm.
Philosophy: correctness > performance > readability > terseness.
Câu hỏi trước khi code: "Có cách đơn giản hơn không?"

## EXPERTISE
- Primary: React 19, TypeScript, Vite, Tailwind v4
- Secondary: Web Audio API, localStorage, SVG, behavioral psychology UX

## TECH STACK (immutable trừ khi có RFC)
Language: TypeScript 5.8+
UI: React 19 + JSX
Styling: Tailwind CSS v4 (KHÔNG dùng Tailwind v3 class syntax)
Build: Vite 6
Icons: lucide-react
Storage: localStorage (prefix `ironwill_`)
Testing: tsc --noEmit (type check only)

## COMPONENT MAP (v0.3.0)
```
App.tsx               ← Root state, tất cả handlers, game logic
StatusHeader.tsx      ← Avatar, EXP bar, streak, shields, mindset toggle
QuestBoard.tsx        ← Routines, timer, WHY panel, quest tiers, due dates
TreasuryBoard.tsx     ← Finance tracker, budget bar, income SVG chart, coaching-tone spending review
Timeline.tsx          ← Tab JOURNEY: streak heatmap, weight chart, note, Export/Import (thay JourneyLogs đã xoá)
LevelUpModal.tsx      ← Animated modal thay alert() — export LevelUpInfo type
MonthlyReviewModal.tsx← Modal đầu tháng: kết quả tháng trước + set budget tháng mới — export MonthlyReviewState
OnboardingModal.tsx   ← Wizard 3 bước, gọi onComplete(name: string, task: string, whyCard: WhyCard)
CelebrationToast.tsx  ← Streak milestone toast, auto-close 4s
```

## NAMING CONVENTIONS
Files: PascalCase cho components, camelCase cho utils
Components: PascalCase (QuestBoard, LevelUpModal)
Functions: camelCase (addXP, toggleRoutine)
Types: PascalCase (Task, DayLog, WhyCard, MonthlyReviewState)
localStorage keys: snake_case với prefix `ironwill_`

## APPROVED PACKAGES
- react ^19 · react-dom ^19
- lucide-react ^0.546
- tailwindcss ^4 · @tailwindcss/vite
- vite ^6 · @vitejs/plugin-react
- typescript ~5.8

## BANNED PACKAGES (với lý do)
- axios / fetch — không có API backend
- zustand / redux — localStorage + useState đủ
- react-router — SPA không cần routing
- chart.js / recharts / d3 — SVG tự build đủ cho hiện tại
- shadcn / MUI / Radix — tự build components

## BUSINESS LOGIC — KHÔNG ĐƯỢC THAY ĐỔI
- **Copyright-clean:** KHÔNG dùng tên/concept từ Solo Leveling
  - Challenger (không phải Sung Jin-Woo)
  - AWAKEN (không phải ARISE)
  - APEX (không phải MONARCH)
- Không fetch external images — gradient CSS + lucide icons
- localStorage prefix `ironwill_` — không đổi key names khi upgrade
- **XP anti-exploit rules (QUAN TRỌNG):**
  - Task XP: chỉ trao khi `!task.xpClaimed`. Set `xpClaimed: true` + `claimedAt: today` khi claim
  - Daily task XP cap: 150 XP/ngày tổng từ tasks. Tính từ `tasks.filter(t => t.xpClaimed && t.claimedAt === today)`
  - Routine XP: chỉ trao nếu `!routineXpClaimed[routineId]`. Đọc từ `logs.find(l => l.date === today)?.routineXpClaimed`
  - OVERDRIVE: chỉ trao nếu `!overdriveXpClaimed`. Đọc từ `logs.find(l => l.date === today)?.overdriveXpClaimed`
  - Finance XP: +10 lần đầu/ngày. Weight XP: +5 lần đầu/ngày.
- **WHY card system:** User tự định nghĩa 3 WHY cards (PAIN/FAILURE/GOAL). Không có game character buffs.
- Achievement thresholds: ach1=7 ngày streak · ach2=5 raids · ach4=4 weight logs
- Treasury: coaching tone, không shame — ngôn ngữ constructive, không warning đỏ aggressive

## XP FORMULA (piecewise — không dùng linear `level * 120` nữa)
```typescript
const getXpNeeded = (lvl: number): number => {
  if (lvl <= 10) return lvl * 120;   // E+D rank
  if (lvl <= 20) return lvl * 100;   // C rank
  if (lvl <= 35) return lvl * 80;    // B rank
  if (lvl <= 50) return lvl * 65;    // A rank
  return lvl * 50;                    // S rank
};
```
Calibrated: E→D = 18 ngày · D→C = 66 ngày · A = 2.7 năm @ 100 XP/ngày.

## DECISION RULES
- **SPEC TRƯỚC, CODE SAU (bắt buộc):** Trước khi chạm vào bất kỳ file src/ nào, phải có .sdd/specs/ tương ứng đã được tạo hoặc cập nhật
- Bug fix cũng cần update spec: ghi nhận edge case mới phát hiện + unwanted pattern
- Exception duy nhất: single-file one-line fix không thay đổi behavior (typo, rename variable)
- Không chắc về architecture → hỏi, không assume
- Thấy violation constitution → báo cáo, không workaround
- Spec không cover edge case → dừng lại và hỏi
- Thêm feature không có trong spec → hỏi trước khi làm
- Sửa UX psychology-sensitive (streak, achievements, tone ngôn ngữ, XP values) → cân nhắc kỹ, tham chiếu FEATURES.md

## TOOLS BẠN ĐƯỢC PHÉP
Read/write: src/, .sdd/, FEATURES.md, CLAUDE.md, AGENTS.md
Execute: npm run lint, npm run build, git status, git diff
Screenshot: npx playwright screenshot
KHÔNG: delete source files, push main, thêm dependency mà không hỏi

## KHÔNG ĐƯỢC PHÉP (cần human confirm)
- Xóa bất kỳ file source nào
- Thêm package vào package.json
- Thay đổi vite.config.ts hoặc tsconfig.json
- Commit / push lên remote
- Thay đổi localStorage key names (backward compat)

## PHẢI LÀM (mandatory)
- **[TRƯỚC KHI CODE]** Tạo hoặc cập nhật .sdd/specs/feat-{name}/SPEC.md — không exception trừ one-line fix
- **[TRƯỚC KHI CODE]** Chạy PROC-01 checklist trong constitution self-check
- Chạy `npx tsc --noEmit` sau khi sửa TypeScript
- Không dùng `any` type — define proper types trong types.ts
- Không dùng `alert()` / `confirm()` — custom modal hoặc toast
- Khi sửa UX tone/ngôn ngữ: đảm bảo không shame/judge user
- Shadow Plan trước khi execute task mới > 3 files
- Cập nhật CLAUDE.md + FEATURES.md + AGENTS.md sau mỗi feature release
