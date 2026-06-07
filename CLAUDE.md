# CLAUDE.md — Project Memory
# Version: 3.0.0 | Updated: 2026-06-04

## TL;DR (30 giây đọc)
**LevelUp** — app productivity + finance cá nhân được game hóa theo phong cách RPG.
Người dùng hoàn thành quests hàng ngày để lên level, track chi tiêu/tiết kiệm, giữ streak.
Không có backend — toàn bộ state lưu localStorage. **v0.3.0 đã hoàn chỉnh.**

Stack: React 19 + TypeScript + Vite 6 + Tailwind v4 + lucide-react
Kiến trúc: Single-page app, state tập trung ở App.tsx, components nhận props + emit callbacks

## KIẾN TRÚC

Pattern: Component-based, flat (không có routing)
Data flow: App.tsx (state + handlers) → props → child components → callback → App.tsx

```
src/
├── App.tsx                    # Root: toàn bộ state, game logic, localStorage I/O
├── types.ts                   # Shared TypeScript types
├── index.css                  # Tailwind v4 directives
├── main.tsx                   # Entry point
├── components/
│   ├── StatusHeader.tsx       # Avatar, rank, EXP bar, streak, shields, mindset toggle
│   ├── QuestBoard.tsx         # Daily routines, focus timer, WHY panel, quest tiers
│   ├── TreasuryBoard.tsx      # Finance tracker, budget tracking, income chart
│   ├── JourneyLogs.tsx        # Streak grid, weekly comparison, note, weight chart
│   ├── LevelUpModal.tsx       # Modal animated khi level-up (thay alert)
│   ├── MonthlyReviewModal.tsx # Modal hiện đầu tháng mới: kết quả tháng trước + set budget
│   ├── OnboardingModal.tsx    # Wizard 3 bước cho user mới (WHY card ở step 2)
│   └── CelebrationToast.tsx   # Toast streak milestone (7/14/21/28 ngày)
├── data/
│   └── quotes.ts              # 44 quotes (30 discipline + 14 motivation)
└── utils/
    └── audio.ts               # Web Audio API: click, success, levelup, timer
```

## KEY DATA STRUCTURES (xem types.ts)

```typescript
type TaskTier = 'BOSS' | 'DUNGEON' | 'MANA';
type WhyCardType = 'PAIN' | 'FAILURE' | 'GOAL';

interface WhyCard {
  id: string;
  type: WhyCardType;
  title: string;
  story: string;       // optional detail
}

interface Task {
  id: string;
  title: string;
  tier: TaskTier;
  completed: boolean;
  xpClaimed?: boolean;   // true once XP awarded — prevents re-earn on re-toggle
  claimedAt?: string;    // YYYY-MM-DD — for daily XP cap tracking
  completedAt?: string;  // YYYY-MM-DD — day marked done; cleared on un-complete (today-counter + history)
  createdAt: string;     // YYYY-MM-DD
  dueDate?: string;      // YYYY-MM-DD, optional
}

interface Transaction {
  id: string;
  title: string;
  amount: number;         // VND
  type: 'INCOME' | 'EXPENSE';
  category: ExpenseCategory | 'Income Source';
  date: string;           // YYYY-MM-DD
}

interface DayLog {
  date: string;                              // YYYY-MM-DD
  routines: Record<string, boolean>;         // routineId → done (UI state, resets daily)
  routineXpClaimed?: Record<string, boolean>;// routineId → XP already given today (NEVER resets)
  overdriveXpClaimed?: boolean;              // OVERDRIVE bonus already given today
  taskXpEarned?: number;                     // cumulative task XP earned today (NEVER resets — cap enforcement, survives task deletion)
  taskCountByTier?: Partial<Record<TaskTier, number>>; // XP-earning completions per tier today (BOSS≤2, DUNGEON≤4, MANA≤5)
  note: string;                              // daily reflection text
  weight?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: string;
  unlockedAt: string | null;
}
```

**App state chính (App.tsx):**
- `hunterName`, `level`, `xp`, `streak`, `shields` — player core stats
- `disciplineMode`, `soundEnabled` — user preferences
- `whyCards: WhyCard[]` — user's 3 motivational anchors (PAIN / FAILURE / GOAL)
- `monthlyBudgets: Record<string, number>` — YYYY-MM → budget VND
- `routineLabels` — custom labels cho 6 routine (Record<string, string>)
- `dailyRoutines`, `tasks`, `archivedTasks`, `transactions`, `weightLogs`, `logs`, `achievements` — game data
  - `archivedTasks`: task ngày cũ tự dọn khi sang ngày mới (không xóa — đếm achievement + Lịch sử). Xem ADR-013
- `levelUpInfo` — trigger LevelUpModal
- `toastMsg` — trigger CelebrationToast
- `monthlyReview` — trigger MonthlyReviewModal (đầu tháng mới)
- `onboardingDone` — ẩn/hiện OnboardingModal

## ARCHITECTURE DECISION RECORDS

### ADR-001: No Backend / localStorage Only
**Quyết định:** Dùng localStorage thay vì API + DB
**Lý do:** MVP nhanh, không cần auth, privacy-first
**Không chọn:** Supabase/Firebase — over-engineered cho v0.1-v0.3

### ADR-002: No State Library
**Quyết định:** useState + prop drilling thay vì Zustand/Redux
**Lý do:** App nhỏ, 1 level prop drilling là OK
**Không chọn:** Zustand — thêm dependency không cần thiết

### ADR-003: Copyright-Clean Rebrand
**Quyết định:** Gỡ toàn bộ references đến Solo Leveling manhwa
**Mapping:** Sung Jin-Woo → Challenger · ARISE → AWAKEN
**Không chọn:** Giữ nguyên — IP risk quá cao

### ADR-004: Tailwind v4
**Quyết định:** Dùng Tailwind v4 (@tailwindcss/vite plugin)
**Lý do:** Không cần tailwind.config.js, cấu hình trong CSS
**Lưu ý:** Một số class v3 không tồn tại — kiểm tra docs trước khi dùng class mới

### ADR-005: Custom Modal thay alert()
**Quyết định:** LevelUpModal React component thay browser `alert()`
**Lý do:** alert() block UI, trông không chuyên nghiệp, không tùy chỉnh được animation
**Không chọn:** Giữ alert — vi phạm UX quality bar

### ADR-006: Psychology-driven gamification
**Quyết định:** Thiết kế dựa trên tâm lý học hành vi (SDT, Habit Loop, Loss Aversion)
**Áp dụng:** Shield mechanic, coaching tone Treasury, endowed progress, milestone toasts, WHY anchors
**Không chọn:** Pure points-only system — dẫn đến churn sau tuần 2

### ADR-007: WHY Cards thay Ally System
**Quyết định:** 3 user-defined motivational cards (💔 Nỗi đau / ❌ Thất bại / 🔥 Mục tiêu) thay vì 3 pre-defined game characters
**Lý do:** Intrinsic motivation > extrinsic characters. User's own WHY = stronger motivational anchor. Removes gameplay buff inequality.
**Không chọn:** Giữ Ally system — buffs tạo "optimal choice anxiety", WHY là sáo rỗng nếu không phải của user

### ADR-008: Piecewise XP Formula
**Quyết định:** XP cần = piecewise (L1-10: ×120, L11-20: ×100, L21-35: ×80, L36-50: ×65, L51+: ×50)
**Lý do:** Calibrated theo habit formation research: E→D=18 ngày, D→C=66 ngày (Lally threshold), C→B=7 tháng, B→A=1.5 năm, A→S=2.7 năm ở 100 XP/ngày. Linear formula gây A/S rank không khả thi.
**Không chọn:** Linear `level×120` — S-Rank cần 4.2 năm → user abandon

### ADR-009: Anti-Exploit XP Design
**Quyết định:** 5-layer XP protection:
1. `xpClaimed` per task — toggle exploit (complete→uncomplete→complete)
2. `routineXpClaimed` + `overdriveXpClaimed` per day in DayLog — routine/OVERDRIVE farm
3. `taskXpEarned` in DayLog — overall daily task cap (150 XP, immune to delete exploit)
4. `taskCountByTier` in DayLog — per-tier daily caps: BOSS=2, DUNGEON=4, MANA=5 (quantity spam)
5. `claimedAt` trên task — metadata hiển thị, không dùng để enforce cap

**Lý do tier caps:** 15 MANA tasks (trivial) → 150 XP/ngày (toàn bộ cap chỉ từ tier thấp nhất). Với tier cap: MANA max 5×10=50 XP, phải kết hợp tiers chất lượng cao hơn để đạt 150 XP. BOSS cap=2 (2 big challenges/ngày đã là exceptional), DUNGEON cap=4 (4 medium tasks là solid day), MANA cap=5 (đủ cho small tasks thực sự).
**Không chọn:** Honor system — bất kỳ gameable loop nào sẽ bị abuse, phá vỡ progression psychology. Time-gate (createdAt vs completedAt penalty) — too much friction cho legit users.

### ADR-011: Firebase Auth + Firestore Sync
**Quyết định:** Firebase Auth (Google + Email/Password) + Firestore single-document sync (`users/{uid}`). Guest mode dùng `ironwill_guest_mode` localStorage flag.
**Lý do:** Cloud backup không cần backend riêng. Guest mode vẫn hoạt động offline. `window.location.reload()` sau sign-out để reset toàn bộ React state sạch sẽ.
**Không chọn:** Custom backend — over-engineered cho scale hiện tại

### ADR-012: Export/Import JSON Backup + Schema Versioning
**Quyết định:** Export toàn bộ state thành file `levelup-backup-YYYY-MM-DD.json`. Import validate rồi show confirm modal (không dùng `confirm()`). `SCHEMA_VERSION = 1` lưu trong localStorage + file. `migrate()` xử lý nâng cấp từng bước.
**Migration v0→v1:** Thêm `xpClaimed=true` cho completed tasks thiếu field → fix double-earn issue vĩnh viễn.
**Lý do:** localStorage là nguồn dữ liệu duy nhất, cần backup thủ công trước khi có cloud sync. Schema versioning bắt buộc khi có Export/Import để file backup cũ vẫn đọc được sau khi upgrade cấu trúc data.
**Không chọn:** Auto-backup to IndexedDB — không portable, không giải quyết rủi ro browser evict storage

### ADR-010: Monthly Budget Challenge
**Quyết định:** User set budget 1 lần/tháng, auto month-transition detection, XP reward khi tiết kiệm (60/120/200 XP theo %)
**Lý do:** Finance gamification cần outcome reward (tiết kiệm thực sự) không phải data entry reward. Month-transition modal tạo ritual đầu tháng = accountability moment.
**Không chọn:** Per-transaction XP volume → reward chi tiêu nhiều = backwards psychology

### ADR-013: Daily Task Auto-Archive
**Quyết định:** Sang ngày mới, task ngày cũ tự dọn khỏi board → đẩy vào `archivedTasks` (KHÔNG xóa hẳn). Board mặc định chỉ hiện việc còn-liên-quan-tới-hôm-nay (incomplete có `dueDate >= today`). Task hoàn thành trong ngày fold vào dòng collapse "Đã hoàn thành: X hôm nay". Nút "Lịch sử" mở `TaskHistoryModal` (read-only, nhóm theo ngày).
**Rollover rule (mount date-reset effect):** giữ lại ⇔ `!completed && dueDate >= today`; archive phần còn lại (completed bất kể deadline, hoặc incomplete quá hạn / không deadline).
**Lý do:** Board sạch tạo cảm giác fresh-start mỗi ngày (chống clutter). Archive thay vì delete để `totalTasksCompleted` + achievement (ach2 = 5 BOSS) vẫn đếm đúng — các counter này tính trên `[...tasks, ...archivedTasks]`. Thêm `Task.completedAt` để xác định "hoàn thành hôm nay" + nhóm lịch sử.
**Sync:** `archivedTasks?` có trong GameState (Firestore) + BackupData (Export/Import), default `[]`. localStorage key `ironwill_archived_tasks`.
**Không chọn:** Giữ task ngày cũ với badge CARRIED OVER (clutter dồn) · xóa hẳn (mất số đếm achievement). Cross-device: `applyGameState` set thẳng archivedTasks từ cloud, không chạy lại rollover (nhất quán streak — xem Known Issues).

## PATTERNS & CONVENTIONS

```tsx
// Pattern: State lifted lên App.tsx, component nhận props + callback
interface QuestBoardProps {
  addTask: (title: string, tier: TaskTier, dueDate?: string) => void;
  whyCards: WhyCard[];
  setWhyCards: (cards: WhyCard[]) => void;
  routineLabels: Record<string, string>;
  setRoutineLabel: (id: string, label: string) => void;
}

// Pattern: XP daily cap — đọc taskXpEarned từ DayLog, KHÔNG tính từ tasks array
// Lý do: tasks có thể bị xóa sau khi claim XP → earnedToday=0 → bypass cap (delete exploit)
// taskXpEarned trong DayLog tồn tại độc lập với tasks, không thể bị reset
const earnedToday = logs.find(l => l.date === today)?.taskXpEarned ?? 0;

// Pattern: Routine XP claim — đọc từ DayLog, không phải dailyRoutines
// dailyRoutines reset hàng ngày (UI), nhưng routineXpClaimed KHÔNG reset
const claimedRoutines = logs.find(l => l.date === today)?.routineXpClaimed || {};

// Pattern: localStorage key prefix = 'ironwill_'
// Tất cả keys lưu trong 1 useEffect với full dependency array

// Pattern: Date-reset effect — chạy 1 lần khi mount, đọc state trực tiếp từ closure
React.useEffect(() => {
  const today = getTodayDateString();
  const lastOpenDate = localStorage.getItem('ironwill_last_open_date');
  // ... logic reset routine + streak update + month transition check
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// Pattern: Month transition detection trong mount effect
const lastOpenYM = lastOpenDate.slice(0, 7);
const currentYM  = today.slice(0, 7);
if (lastOpenYM !== currentYM) { /* trigger MonthlyReviewModal */ }

// Pattern: Inline label editing trong QuestBoard
// Pencil icon (hover) → click → input autoFocus → blur/Enter → save
```

## ANTI-PATTERNS (đừng làm)
- Đừng fetch external images — dùng gradient CSS hoặc lucide-react icons
- Đừng thêm routing — app là single page, không cần react-router
- Đừng dùng `any` type — define proper types trong types.ts
- Đừng dùng `alert()` / `confirm()` — dùng custom modal component
- Đừng reference Solo Leveling IP — xem ADR-003
- **Đừng dùng `tasks` array để tính daily XP cap** — delete exploit: xóa task sau claim XP sẽ reset earnedToday=0. Phải dùng `DayLog.taskXpEarned`
- **Đừng dùng separate `useState` để track daily XP cap** — stale closure issue trong React batching
- **Đừng call addXP khi routine toggle ON mà không check `routineXpClaimed`** — re-earn exploit
- **Đừng trigger OVERDRIVE bonus mà không check `overdriveXpClaimed`** — farm exploit
- Đừng gọi setState lồng trong setState functional update nếu có thể tránh

## KNOWN ISSUES & WORKAROUNDS
- **Tailwind v4 class purging:** dùng full class string thay vì template literal (`bg-orange-500` không phải `` `bg-${color}-500` ``)
- **Web Audio context:** cần user gesture trước khi play — đã có try/catch, không crash
- **Nested setState trong mount effect:** `setStreak` / `setShields` được gọi trực tiếp (không nested functional update) — OK trong React 18 batching
- **xpClaimed migration:** ĐÃ FIX via schema v0→v1 migration trong `utils/schema.ts`. `migrate()` chạy khi mount và khi import.
- **Playwright screenshot:** luôn dùng fresh context (no localStorage) → thấy onboarding. Đây là hành vi đúng cho user mới
- **IndexedDB photos không sync Firestore:** `avatarUrl` và `bodyPhotos` chỉ lưu locally (IndexedDB). Export/Import JSON không bao gồm ảnh. Phase 2 task.
- **applyGameState không chạy streak logic:** Khi login Firebase, streak/shields từ cloud được apply trực tiếp (không tính lại). Streak chỉ được update bởi mount effect dựa trên localStorage. Cross-device: mount effect đọc `lastOpenDate=null` → skip streak update. Acceptable for MVP.
- **Archive idempotency (StrictMode):** ĐÃ FIX. Auto-archive (ADR-013) dùng functional update + dedupe theo id → an toàn khi mount effect chạy 2 lần (React 19 StrictMode). Đừng quay lại pattern `setArchivedTasks(prev => [...toArchive, ...prev])` không dedupe.
- **Migration effect ordering:** ĐÃ FIX. Migration effect dùng `setTasks(prev => migrate({tasks: prev}).tasks)` (functional update trên state) thay vì đọc lại `localStorage` gốc — nếu không sẽ ghi đè kết quả auto-archive của date-reset effect (chạy trước) và resurrect task đã dọn lên board.
- **Import mồ côi:** ĐÃ FIX (feat-export-import SPEC). UI Import từng ở `JourneyLogs.tsx` nhưng tab JOURNEY đã chuyển sang `Timeline.tsx` → Import không truy cập được. Đã port nút Import + file input + `validateBackup` sang Timeline, wire `onImportRequest={handleImportRequest}`. ⚠️ **`JourneyLogs.tsx` hiện là DEAD CODE** (không import ở đâu) — Timeline thay thế hoàn toàn. Có thể xoá trong cleanup sau.

## CURRENT SPRINT FOCUS
**Tech Debt Sprint.** Auth (ADR-011) + Export/Import (ADR-012) đã implement.

Tiến độ Tech Debt Brief:
- [x] Task 1: Export/Import JSON backup (ADR-012) — `utils/schema.ts`, `ImportConfirmModal.tsx`, Timeline tab
- [x] Task 2: Schema versioning + migration — `SCHEMA_VERSION=1`, `migrate()`, mount effect
- [ ] Task 3: Tách pure logic ra `utils/` (xp.ts, streak.ts, transition.ts, date.ts)
- [ ] Task 4: Unit tests với Vitest
- [ ] Task 5: Idempotency cho mount effect (React 19 StrictMode)
- [ ] Task 6: Timezone safety

Roadmap v0.4.0:
- [ ] PWA support (Service Worker, install prompt)
- [ ] Monthly view cho Treasury (filter theo tháng)
- [ ] Quest templates theo category
