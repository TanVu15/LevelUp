// UI/UX review: seed dữ liệu thực tế → chụp 3 tab ở mobile + desktop.
// Chạy: node scripts/ui-review.mjs (cần vite preview đang chạy ở 4173)
import { chromium } from 'playwright';

const URL = 'http://localhost:4173/';

function ld(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const today = new Date();
const day = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return ld(d); };
const ym = ld(today).slice(0, 7);

// 30 ngày logs: routine score dao động, vài note, vài weight
const logs = [];
for (let i = 29; i >= 0; i--) {
  const score = i % 7 === 3 ? 2 : (i % 5 === 0 ? 4 : 6);
  const routines = { eat: true, pray: score > 2, train: score > 2, study: score > 3, work: score > 4, sleep: score > 5 };
  logs.push({
    date: day(-i), routines,
    routineXpClaimed: Object.fromEntries(Object.entries(routines).filter(([, v]) => v)),
    note: i % 6 === 0 ? 'Ngày tốt — giữ nhịp, tập đủ, không lướt mạng vô nghĩa.' : '',
    ...(i % 4 === 0 ? { weight: 71.5 - (29 - i) * 0.05 } : {}),
  });
}

const weekStartStr = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ld(d); })();

const seed = {
  ironwill_guest_mode: 'true',
  ironwill_onboarding_done: 'true',
  ironwill_schema_version: '1',
  ironwill_last_open_date: day(0),
  ironwill_weekly_review_done: weekStartStr, // chặn WeeklyReviewModal trong screenshot
  ironwill_hunter_name: 'Tan Vu',
  ironwill_level: '12',
  ironwill_xp: '340',
  ironwill_streak: '16',
  ironwill_shields: '1',
  ironwill_daily_routines: JSON.stringify({ eat: true, pray: true, train: true, study: false, work: false, sleep: false }),
  ironwill_why_cards: JSON.stringify([
    { id: 'w1', type: 'PAIN', title: 'Mệt mỏi vì trì hoãn triền miên', story: '' },
    { id: 'w2', type: 'FAILURE', title: 'Bỏ gym giữa chừng 3 lần', story: '' },
    { id: 'w3', type: 'GOAL', title: 'Tự do tài chính tuổi 35', story: '' },
  ]),
  ironwill_tasks: JSON.stringify([
    { id: 't1', title: 'Hoàn thành module thanh toán', tier: 'BOSS', completed: false, createdAt: day(0), dueDate: day(0) },
    { id: 't2', title: 'Review PR của team', tier: 'DUNGEON', completed: true, xpClaimed: true, claimedAt: day(0), completedAt: day(0), createdAt: day(0) },
    { id: 't3', title: 'Trả lời email khách', tier: 'MANA', completed: false, createdAt: day(0), dueDate: day(1) },
    { id: 't4', title: 'Đọc 20 trang sách', tier: 'MANA', completed: true, xpClaimed: true, claimedAt: day(0), completedAt: day(0), createdAt: day(0) },
  ]),
  ironwill_archived_tasks: JSON.stringify([
    { id: 'a1', title: 'Viết spec tính năng X', tier: 'DUNGEON', completed: true, xpClaimed: true, completedAt: day(-1), createdAt: day(-1) },
    { id: 'a2', title: 'Dọn inbox', tier: 'MANA', completed: true, xpClaimed: true, completedAt: day(-2), createdAt: day(-2) },
  ]),
  ironwill_transactions: JSON.stringify([
    { id: 'x1', title: 'Lương tháng', amount: 25000000, type: 'INCOME', category: 'Income Source', date: `${ym}-01` },
    { id: 'x2', title: 'Tiền nhà', amount: 5500000, type: 'EXPENSE', category: 'Rent & Utilities', date: `${ym}-02` },
    { id: 'x3', title: 'Gói tập gym', amount: 800000, type: 'EXPENSE', category: 'Gym & Nutrition', date: `${ym}-03` },
    { id: 'x4', title: 'Sách Atomic Habits', amount: 180000, type: 'EXPENSE', category: 'Books & Growth', date: day(-3) },
    { id: 'x5', title: 'Trà sữa + game', amount: 350000, type: 'EXPENSE', category: 'Unnecessary Leaks', date: day(-2) },
    { id: 'x6', title: 'Bàn phím cơ', amount: 1500000, type: 'EXPENSE', category: 'Work & Gear', date: day(-1) },
  ]),
  ironwill_monthly_budgets: JSON.stringify({ [ym]: 9000000 }),
  ironwill_weight_logs: JSON.stringify(
    logs.filter(l => l.weight).map(l => ({ date: l.date, weight: l.weight })),
  ),
  ironwill_logs: JSON.stringify(logs),
  ironwill_updated_at: String(Date.now()),
};

const browser = await chromium.launch();

async function shoot(ctxOpts, prefix, clicks) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  await page.addInitScript((kv) => { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v); }, seed);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500); // BootIntro
  await page.screenshot({ path: `scripts/ui-${prefix}-quest.png`, fullPage: true });
  for (const [name, pattern] of clicks) {
    await page.getByRole('button', { name: pattern }).first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `scripts/ui-${prefix}-${name}.png`, fullPage: true });
  }
  await ctx.close();
}

await shoot(
  { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'mobile',
  [['treasury', /TREASURY/], ['journey', /JOURNEY|TIMELINE/]],
);
await shoot(
  { viewport: { width: 1280, height: 900 } },
  'desktop',
  [['treasury', /TREASURY/], ['journey', /JOURNEY|TIMELINE/]],
);

console.log('done');
await browser.close();
