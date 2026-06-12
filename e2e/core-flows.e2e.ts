import { test, expect, Page } from '@playwright/test';

// 3 flow rủi ro nhất (feat-e2e-tests): guest onboarding, rollover qua ngày, import backup.
// Toàn bộ chạy guest mode — không đụng Firebase thật.

// LOCAL date (đồng bộ với utils/date.ts — không dùng toISOString, tránh UTC bug)
function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const today = () => localDateString(new Date());
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateString(d);
};
// Thứ Hai tuần hiện tại — seed marker weekly review để modal không bật giữa test
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDateString(d);
};

// Seed localStorage TRƯỚC khi app boot (addInitScript chạy trước mọi script của trang).
async function seedStorage(page: Page, entries: Record<string, string>) {
  await page.addInitScript((kv: Record<string, string>) => {
    for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v);
  }, entries);
}

const GUEST_ONBOARDED = () => ({
  ironwill_guest_mode: 'true',
  ironwill_onboarding_done: 'true',
  ironwill_level: '3',
  ironwill_xp: '0',
  ironwill_schema_version: '1',
  ironwill_last_open_date: today(),
  ironwill_weekly_review_done: weekStart(),
});

test('guest onboarding: auth gate → chơi không tài khoản → bỏ qua → app chính', async ({ page }) => {
  await page.goto('/');
  // Auth gate (Firebase được config trong build) — vào guest mode.
  await page.getByRole('button', { name: /Chơi không cần tài khoản/ }).click({ timeout: 15_000 });
  // OnboardingModal — BootIntro overlay có thể che vài giây, Playwright tự chờ actionability.
  await page.getByRole('button', { name: 'Bỏ qua' }).click({ timeout: 15_000 });
  await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible({ timeout: 15_000 });
});

test('rollover qua ngày: task completed hôm qua bị dọn khỏi board vào archive (ADR-013)', async ({ page }) => {
  const doneTask = {
    id: 'e2e-task-1',
    title: 'Nhiệm vụ E2E hôm qua',
    tier: 'MANA',
    completed: true,
    xpClaimed: true,
    createdAt: yesterday(),
    completedAt: yesterday(),
  };
  await seedStorage(page, {
    ...GUEST_ONBOARDED(),
    ironwill_last_open_date: yesterday(),
    ironwill_tasks: JSON.stringify([doneTask]),
    ironwill_archived_tasks: JSON.stringify([]),
  });
  await page.goto('/');
  await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible({ timeout: 15_000 });

  // Task ngày cũ không còn trên board…
  await expect(page.getByText('Nhiệm vụ E2E hôm qua')).toHaveCount(0);
  // …mà nằm trong archive (đợi usePersistedState ghi xuống localStorage).
  await expect
    .poll(async () =>
      page.evaluate(() =>
        (JSON.parse(localStorage.getItem('ironwill_archived_tasks') ?? '[]') as { id: string }[])
          .map(t => t.id),
      ),
    )
    .toContain('e2e-task-1');
});

test('import backup: chọn file → confirm modal → ghi đè → header hiện tên mới (ADR-012)', async ({ page }) => {
  await seedStorage(page, GUEST_ONBOARDED());
  await page.goto('/');
  await expect(page.getByText('STRENGTH PROGRESSION')).toBeVisible({ timeout: 15_000 });

  // Desktop nav → tab TIMELINE (Nhật ký)
  await page.getByRole('button', { name: /TIMELINE/ }).click();

  const backup = {
    schemaVersion: 1,
    exportedAt: today(),
    hunterName: 'E2E Hero',
    level: 7,
    xp: 10,
    streak: 0,
    shields: 0,
    disciplineMode: true,
    soundEnabled: false,
    onboardingDone: true,
    whyCards: [],
    monthlyBudgets: {},
    dailyRoutines: {},
    tasks: [],
    archivedTasks: [],
    transactions: [],
    weightLogs: [],
    logs: [],
    achievements: [],
    lastOpenDate: today(),
  };
  await page
    .locator('input[type="file"][accept=".json,application/json"]')
    .setInputFiles({
      name: 'levelup-backup-e2e.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });

  // ImportConfirmModal hiện đúng dữ liệu file
  await expect(page.getByText('E2E Hero')).toBeVisible();
  await page.getByRole('button', { name: 'Ghi Đè Ngay' }).click();

  // State áp dụng — header hiện tên mới (dùng heading: tên xuất hiện 2 nơi sau import)
  await expect(page.getByRole('heading', { name: 'E2E Hero' })).toBeVisible();
  await expect(page.getByText('Xác Nhận Ghi Đè Dữ Liệu')).toHaveCount(0);
});
