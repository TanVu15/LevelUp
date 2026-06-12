// Chụp WeeklyReviewModal: seed dữ liệu tuần trước, KHÔNG seed marker → modal bật.
import { chromium } from 'playwright';

function ld(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const day = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return ld(d); };
// Thứ Hai tuần TRƯỚC
const lastMon = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7); return d; })();
const lw = (off) => { const d = new Date(lastMon); d.setDate(d.getDate() + off); return ld(d); };

const logs = [0, 1, 2, 4, 6].map(i => ({
  date: lw(i), routines: { eat: true, train: i % 2 === 0, study: true, pray: false, work: true, sleep: i > 2 }, note: '',
}));
const seed = {
  ironwill_guest_mode: 'true',
  ironwill_onboarding_done: 'true',
  ironwill_schema_version: '1',
  ironwill_last_open_date: day(0),
  ironwill_hunter_name: 'Tan Vu',
  ironwill_level: '12', ironwill_xp: '340', ironwill_streak: '16', ironwill_shields: '1',
  ironwill_logs: JSON.stringify(logs),
  ironwill_archived_tasks: JSON.stringify([
    { id: 'a1', title: 'x', tier: 'DUNGEON', completed: true, completedAt: lw(2), createdAt: lw(2) },
    { id: 'a2', title: 'y', tier: 'MANA', completed: true, completedAt: lw(4), createdAt: lw(4) },
  ]),
  ironwill_transactions: JSON.stringify([
    { id: 'x1', title: 'Ăn ngoài', amount: 450000, type: 'EXPENSE', category: 'Unnecessary Leaks', date: lw(3) },
    { id: 'x2', title: 'Gym', amount: 800000, type: 'EXPENSE', category: 'Gym & Nutrition', date: lw(-3) },
  ]),
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript((kv) => { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v); }, seed);
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'scripts/ui-weekly-modal.png' });
await browser.close();
console.log('done');
