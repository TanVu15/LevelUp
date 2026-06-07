# LevelUp — Tài liệu Chức năng & Game Design
**Version:** 0.3.0 | **Cập nhật:** 2026-06-04

---

## Tổng quan

LevelUp là single-page web app kết hợp **productivity tracker** và **RPG game hóa**.
Người dùng hoàn thành task, duy trì thói quen, và quản lý tài chính để lên level nhân vật.
Toàn bộ dữ liệu lưu `localStorage` — không cần đăng nhập, không cần internet sau khi tải.

**Stack:** React 19 + TypeScript + Vite 6 + Tailwind v4 + lucide-react

---

## HỆ THỐNG GAME (Game Mechanics)

### 1. Level & EXP

| Hành động | XP | Ghi chú |
|---|---|---|
| BOSS RAID | +50 XP | 1 lần / task (xpClaimed gate) |
| DUNGEON GATE | +20 XP | 1 lần / task |
| MANA FARM | +10 XP | 1 lần / task |
| **Daily task XP cap** | — | Tối đa **150 XP/ngày** từ tasks |
| Routine hàng ngày | +5 XP | Lần đầu check mỗi ngày (routineXpClaimed gate) |
| SYSTEM OVERDRIVE (6/6 routines) | +50 XP | Lần đầu 6/6 mỗi ngày (overdriveXpClaimed gate) |
| Focus Timer hoàn thành | +25 XP | Per session (real time cost) |
| Ghi nhận tài chính | +10 XP | Lần đầu/ngày |
| Ghi nhận cân nặng | +5 XP | Lần đầu/ngày |
| Budget tiết kiệm ≥ 30% | +200 XP | Monthly milestone |
| Budget tiết kiệm 15–29% | +120 XP | Monthly milestone |
| Budget tiết kiệm 1–14% | +60 XP | Monthly milestone |
| Endowed progress (user mới) | +30 XP | One-time khi hoàn thành onboarding |

**Nguyên tắc XP:** Reward *hành vi thực* và *kết quả*, không reward volume data entry.

**Công thức level-up (piecewise — calibrated theo habit formation research):**

| Rank | Level | XP cần/level | Thời gian đạt @ 100 XP/ngày |
|---|---|---|---|
| E-Rank | 1–5 | level × 120 | ~18 ngày (initiation) |
| D-Rank | 6–10 | level × 120 | ~66 ngày tổng (66-day habit threshold) |
| C-Rank | 11–20 | level × 100 | ~7 tháng tổng |
| B-Rank | 21–35 | level × 80 | ~1.5 năm tổng |
| A-Rank | 36–50 | level × 65 | ~2.7 năm tổng |
| S-Rank | 51+ | level × 50 | Ongoing — legendary |

Khi đủ XP: LevelUpModal xuất hiện (animated, auto-dismiss 4.5s) + âm thanh level-up.
Nếu vừa lên rank mới: hiển thị rank trước → rank mới trong modal.

---

### 2. Hệ thống Rank

| Rank | Level | Màu |
|---|---|---|
| E-Rank | 1 – 5 | Xám |
| D-Rank | 6 – 10 | Xám sáng |
| C-Rank | 11 – 20 | Trắng |
| B-Rank | 21 – 35 | Vàng |
| A-Rank | 36 – 50 | Amber |
| **S-Rank** | **51+** | **Cam rực + glow** |

---

### 3. Streak & Shield System

**Streak tự động tính theo ngày thực tế:**
- App mở ngày mới → so sánh `last_open_date` với hôm nay
- Nếu ngày hôm qua đạt ≥ 3/6 routines → streak +1
- Nếu ngày hôm qua < 3/6 routines → kiểm tra Shield
- Bỏ > 1 ngày → streak reset về 0

**Shield mechanic (streak protection):**
- Tích lũy: mỗi mốc 7-ngày streak → +1 shield (max 2 shields)
- Tiêu thụ: khi 1 ngày thất bại (< 3/6 routines) → shield tự tiêu, streak giữ nguyên
- Hiển thị: "Shields 1/2" với icon cyan trong StatusHeader

**Milestone toasts (CelebrationToast):**
- 7 ngày: "Habit đang hình thành trong não bộ!"
- 14 ngày: "Hai tuần không gục ngã. Pattern mới đang cài đặt!"
- 21 ngày: "Mốc vàng của habit formation theo khoa học thần kinh!"
- 28 ngày: "Một tháng kỷ luật tuyệt đối!"
- Toast slide-up, tự đóng sau 4 giây, có countdown progress bar

---

### 4. Mindset Mode (2 chế độ)

| Mode | Theme | Quotes |
|---|---|---|
| **Discipline** (mặc định) | Cam / đen | Khắc nghiệt, không khoan nhượng |
| **Motivation** | Amber / ấm | Khích lệ, nhẹ nhàng |

Chuyển mode → tone chữ và quotes thay đổi toàn bộ.

---

### 5. Hệ thống WHY Cards (Lý do của tôi)

3 thẻ động lực do **user tự định nghĩa** — nguồn cảm hứng cá nhân thay cho game characters.

| Type | Emoji | Label | Ý nghĩa |
|---|---|---|---|
| PAIN | 💔 | Nỗi đau | Điều bạn không muốn tiếp diễn |
| FAILURE | ❌ | Thất bại | Điều bạn muốn lật ngược |
| GOAL | 🔥 | Mục tiêu | Điều bạn khao khát nhất |

**Tính năng:**
- Hiển thị trong Quest Board (MOTIVATION CORE panel, bên dưới Focus Timer)
- Tối đa 3 WHY cards, thêm tuần tự (slot kế tiếp mới mở)
- Inline editing: hover card → icon bút chì → form (type selector + title + story) → Lưu/Hủy/Xóa
- Step 2 của Onboarding: user tạo WHY card đầu tiên
- Lưu trong `ironwill_why_cards` localStorage

**Tại sao WHY thay Ally:** Intrinsic motivation (lý do của bản thân) bền hơn extrinsic character buffs. User's WHY = anchor mạnh hơn game character bất kỳ.

---

### 6. Achievement System (4 huy chương — thresholds thực chất)

| ID | Tên | Điều kiện |
|---|---|---|
| ach1 | CHẶNG ĐƯỜNG KỶ LUẬT 🛡️ | Duy trì streak **≥ 7 ngày liên tiếp** |
| ach2 | APEX BOSS RAID 👑 | Hoàn thành **5 BOSS RAID** |
| ach3 | CHỐNG RÒ RỈ HOÀN HẢO 💎 | > 3 giao dịch, **0 discretionary spend** |
| ach4 | CHIẾN THẦN THỂ HÌNH 🏋️ | Ghi nhận cân nặng **4 lần** |

Unlock: âm thanh quest success + ngày unlock hiển thị. Locked: opacity 50%.

---

### 7. Quotes System

- **30 quotes** Discipline mode
- **14 quotes** Motivation mode
- Rotate random khi: bắt đầu Focus Timer, chuyển mode

---

### 8. Sound Effects (Web Audio API)

| Sự kiện | Âm thanh |
|---|---|
| Click nút | Sine wave ngắn |
| Hoàn thành quest/routine | Arpeggio C5-E5-G5-C6 |
| Level up | Sawtooth synth swell |
| Timer kết thúc | Siren sawtooth |

Toggle On/Off. Mọi audio wrapped try/catch — không crash nếu browser block.

---

## ONBOARDING (User Mới)

Kích hoạt khi `ironwill_onboarding_done` chưa có trong localStorage.
Existing users (có `ironwill_level`) tự động skip.

**3 bước:**
1. **Tên chiến binh** — input tên, min 2 ký tự
2. **Lý do của bạn (WHY Card)** — chọn type (PAIN/FAILURE/GOAL) + title + story tuỳ chọn
3. **BOSS RAID đầu tiên** — input mục tiêu lớn nhất, min 5 ký tự

**Khi hoàn thành:**
- Set tên nhân vật
- Tạo BOSS RAID đầu tiên
- Tạo WHY card đầu tiên
- Tặng **30 XP** (Endowed Progress — cảm giác đã trong hành trình)
- App khởi đầu sạch: Level 1, 0 streak

---

## 3 MODULE CHÍNH

### MODULE 1 — QUEST BOARD (Tab: Rèn luyện)

#### 1.1 Daily Protocol — "Đường Ray Kỷ Luật"
6 thói quen với **tên có thể đổi** (click icon bút chì cạnh label):

| ID | Label mặc định | Màu |
|---|---|---|
| eat | EAT PROTEIN | Amber |
| pray | PRAY & PLAN | Sky |
| train | TRAIN HARD | Đỏ |
| study | STUDY FOCUS | Emerald |
| work | WORK GRIND | Violet |
| sleep | SLEEP WELL | Indigo |

- Tick: +5 XP — nhưng **chỉ lần đầu check mỗi ngày** (routineXpClaimed gate)
- Uncheck + re-check: không XP thêm (XP claim không reset theo UI toggle)
- **SYSTEM OVERDRIVE:** hoàn thành 6/6 lần đầu trong ngày → +50 XP bonus (overdriveXpClaimed gate)
- Lịch sử tick lưu vào DayLog cho streak grid
- Reset tự động 0h mỗi ngày thực tế

#### 1.2 Focus Timer — "CHRONO ARENA"

| Preset | Tên | XP |
|---|---|---|
| 25 phút | Raid Setup | +25 XP |
| 45 phút | Deep Dungeon | +25 XP |
| 60 phút | Absolute Grind | +25 XP |

Controls: AWAKEN / PAUSE FOCUS / Reset
Khi hết giờ: âm thanh siren + XP cộng

#### 1.3 WHY Panel — "MY WHY / LÝ DO CỦA TÔI"
- 3 slots hiển thị WHY cards của user
- Slot tiếp theo: nút "+ Thêm lý do #N"
- Card filled: hover → pencil edit
- Form edit: type selector (3 nút) + title input + story textarea + Lưu/Hủy/Xóa

#### 1.4 Quest Board (3 tầng)

| Tier | XP | Badge |
|---|---|---|
| BOSS RAID | +50 XP | Đỏ |
| DUNGEON GATE | +20 XP | Cam |
| MANA FARM | +10 XP | Emerald |

**Anti-exploit:**
- `xpClaimed: true` khi lần đầu complete — không thể re-earn dù toggle nhiều lần
- `claimedAt: YYYY-MM-DD` — daily cap 150 XP/ngày từ tổng tasks (computed từ array, không separate state)

**Due Date (tuỳ chọn):** date picker trong form thêm task.
Badge hiển thị trên task card:
- `OVERDUE` (đỏ) — quá hạn
- `DUE TODAY` (cam) — hôm nay
- `DUE TOMORROW` (amber) — ngày mai

---

### MODULE 2 — TREASURY LEDGER (Tab: Chi tiêu)

#### 2.1 Monthly Budget Challenge
- User set budget một lần/tháng (hiển thị trước danh sách thẻ)
- Progress bar: xanh lá → amber (70%) → đỏ (90%)
- Hiển thị: "Còn lại: X VND" / "Vượt budget: X VND"
- Inline edit: pencil → input → Enter/check để save
- Lưu trong `ironwill_monthly_budgets` (Record<YYYY-MM, number>)

**Phần thưởng cuối tháng (tự động khi sang tháng mới):**
- Tiết kiệm ≥ 30%: +200 XP
- Tiết kiệm 15–29%: +120 XP
- Tiết kiệm 1–14%: +60 XP
- Vượt budget: 0 XP (không phạt, coaching tone)

#### 2.2 Monthly Review Modal (đầu tháng mới)
Trigger khi user mở app ngày đầu tháng mới (`lastOpenDate.slice(0,7) !== today.slice(0,7)`).

Hiển thị:
- Kết quả tháng trước: chi tiêu thực vs budget, progress bar, tiết kiệm/vượt %
- XP reward đã nhận
- Input budget tháng mới (pre-filled từ tháng trước)
- "Bắt đầu tháng mới →" button

#### 2.3 Dashboard (3 thẻ)
- **TREASURY BALANCE:** Thu - Chi (VND)
- **VALUE INFLOW:** Tổng thu (xanh lá)
- **OUTFLOW UPKEEP:** Tổng chi (đỏ hồng)

#### 2.4 Income Trajectory Chart (SVG tự build)
Bar chart dọc, 6 tháng gần nhất:
- Bar height tỷ lệ với tổng thu nhập tháng
- Trend arrow: ↑ (emerald) nếu tháng này > tháng trước, ↓ (red) nếu giảm
- Label tháng bên dưới, giá trị hover trên bar
- Không hiển thị nếu < 2 tháng có dữ liệu

#### 2.5 Spending Review (Coaching tone — không shame)

| % Discretionary | Tiêu đề | Màu |
|---|---|---|
| 0% | TREASURY FLOW SECURE | Emerald |
| 1–24% | SPENDING REVIEW | Amber |
| ≥25% | OPTIMIZE YOUR BUDGET | Amber (không đỏ pulse) |

Ngôn ngữ: coaching, không shaming.

#### 2.6 Category Breakdown Chart
Bar chart ngang tự build. 5 danh mục:
- Gym & Nutrition / Work & Gear / Books & Growth / Rent & Utilities / Unnecessary Leaks

#### 2.7 Form Giao dịch
- INCOME / EXPENSE toggle
- Nhập tiêu đề, số tiền (VND)
- Danh mục dropdown
- **+10 XP chỉ lần đầu ghi trong ngày** (không phải mỗi giao dịch)

#### 2.8 Transaction Ledger
Scrollable, mới nhất lên đầu. Xóa từng entry.

---

### MODULE 3 — JOURNEY & STREAKS (Tab: Lịch sử)

#### 3.1 Streak Grid (28 ngày)
Lưới 7×4, màu theo score 0–6/6 routines:

| Score | Màu |
|---|---|
| 0 | Đen |
| 1–2 | Cam rất nhạt |
| 3–4 | Cam vừa |
| 5 | Cam đậm |
| 6 | Cam full + glow ✦ |

Hover: tooltip hiện ngày + score + **daily note** (nếu có ghi).

#### 3.2 Weekly Comparison — "So Sánh Tuần Này vs Tuần Trước"
Hai cột: Tuần Này vs Tuần Trước, mỗi cột hiện:
- Avg routines/ngày
- Số ngày 6/6 (perfect)
- Số ngày tích cực (≥3/6)

Trend message + icon (↑ emerald / ↓ amber / → xám).

#### 3.3 Daily Reflection — Nhật Ký Hôm Nay
Textarea 200 ký tự, auto-save khi blur. Lưu vào DayLog.note.
Ghi chú hiện trong tooltip streak grid.

#### 3.4 Anthropometric Logs (Cân nặng)
- Form nhập kg (bước 0.1)
- Submit: **+5 XP lần đầu/ngày** (không phải mỗi lần). 4 lần → unlock achievement
- Hiển thị 4 entry gần nhất dạng card
- **Weight Trend Chart:** SVG line chart tự build (hiện khi ≥ 2 entries)
  - Area fill gradient cam, polyline, dots tại mỗi điểm
  - Label ngày đầu/cuối + cân nặng mới nhất

#### 3.5 Achievement Gallery
4 achievements với locked/unlocked state.

---

## UI & VISUAL

### StatusHeader (luôn hiển thị)
- Avatar gradient + Zap icon + "APEX"
- Rank badge (E/D/C/B/A/S)
- Tên nhân vật (inline editable, max 20 ký tự)
- Level badge cam
- Mindset toggle (Motivation / Discipline)
- Sound toggle
- EXP progress bar gradient cam→amber
- **3 stat counters:** Streak (ngày, icon lửa) · Shields (X/2, icon cyan) · Quests cleared

### LevelUpModal
- Full-screen overlay blur
- Animated scale-in card
- Level number lớn, rank badge, rank change indicator (prev → new nếu đổi rank)
- Auto-dismiss 4.5s hoặc click
- Glow effect theo màu rank

### MonthlyReviewModal
- Xuất hiện đầu tháng mới (một lần per month-transition)
- Kết quả tháng trước + XP reward badge
- Input budget tháng mới (pre-filled)
- "Bắt đầu tháng mới →" confirm

### CelebrationToast
- Fixed bottom-center slide-up
- Streak milestone message (7/14/21/28 ngày)
- Countdown progress bar, tự đóng 4s

### OnboardingModal
- Full-screen overlay, app visible mờ phía sau
- Progress dots (3 bước)
- Step 2: WHY card creation (type selector grid + title + story)
- Wizard style: Back / Next / AWAKEN
- Validate: tên ≥ 2 ký tự, WHY title ≥ 3 ký tự, task ≥ 5 ký tự

---

## DATA PERSISTENCE (localStorage)

| Key | Nội dung |
|---|---|
| `ironwill_hunter_name` | Tên nhân vật |
| `ironwill_level` | Level |
| `ironwill_xp` | XP trong level |
| `ironwill_streak` | Số ngày streak |
| `ironwill_shields` | Số shield (0-2) |
| `ironwill_discipline_mode` | Mindset mode |
| `ironwill_sound_enabled` | Sound on/off |
| `ironwill_why_cards` | WHY cards array (JSON) |
| `ironwill_monthly_budgets` | Record<YYYY-MM, number> (JSON) |
| `ironwill_routine_labels` | Custom label 6 routine |
| `ironwill_daily_routines` | Trạng thái tick 6 routine hôm nay |
| `ironwill_tasks` | Danh sách tasks (bao gồm xpClaimed, claimedAt, dueDate) |
| `ironwill_transactions` | Sổ sách tài chính |
| `ironwill_weight_logs` | Lịch sử cân nặng |
| `ironwill_logs` | DayLog 28+ ngày (routines + routineXpClaimed + overdriveXpClaimed + note) |
| `ironwill_achievements` | Trạng thái 4 achievements |
| `ironwill_onboarding_done` | Đã hoàn thành onboarding chưa |
| `ironwill_last_open_date` | Ngày mở app gần nhất (YYYY-MM-DD) |

---

## BACKLOG (chưa implement)

| Tính năng | Lý do ưu tiên thấp |
|---|---|
| Export JSON backup | Không blocking usage hiện tại |
| Import JSON restore | Cần export trước |
| PWA / Service Worker | Cần cài Chrome Extension / build config |
| Đồng bộ đa thiết bị | Cần backend |
| Monthly transaction filter | Dashboard cơ bản đã đủ dùng |
| Quest templates theo category | Nice-to-have |
| Ally mới / mở khóa ally | Re-evaluate sau WHY system feedback |
| Tùy chỉnh danh mục chi tiêu | Power user feature |
| Biểu đồ streak theo tháng | Streak grid 28 ngày đủ dùng hiện tại |
