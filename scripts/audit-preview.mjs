// Audit GĐ0: mở bản build production (vite preview), gom console errors,
// chụp màn hình mobile viewport. Chạy: node scripts/audit-preview.mjs
import { chromium } from 'playwright';

const URL = process.env.AUDIT_URL || 'http://localhost:4173/';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

const consoleMsgs = [];
page.on('console', m => {
  if (m.type() === 'error' || m.type() === 'warning') {
    consoleMsgs.push(`[${m.type()}] ${m.text()}`);
  }
});
page.on('pageerror', e => consoleMsgs.push(`[pageerror] ${e.message}`));
const failedRequests = [];
page.on('requestfailed', r => failedRequests.push(`${r.url()} — ${r.failure()?.errorText}`));
page.on('response', r => { if (r.status() >= 400) failedRequests.push(`${r.url()} — HTTP ${r.status()}`); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000); // BootIntro + onboarding render

await page.screenshot({ path: 'scripts/audit-mobile.png', fullPage: false });

// PWA manifest + SW checks
const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return null;
  const res = await fetch(link.href);
  return res.ok ? await res.json() : { error: res.status };
});
const swRegistered = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs.length > 0;
});

console.log('=== CONSOLE (error/warning) ===');
console.log(consoleMsgs.length ? consoleMsgs.join('\n') : '(none)');
console.log('=== FAILED REQUESTS ===');
console.log(failedRequests.length ? failedRequests.join('\n') : '(none)');
console.log('=== MANIFEST ===');
console.log(JSON.stringify(manifest));
console.log('=== SW REGISTERED ===', swRegistered);

await browser.close();
