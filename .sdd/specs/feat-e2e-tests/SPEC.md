# SPEC — E2E Playwright cho 3 flow rủi ro nhất
# feat-e2e-tests | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-11

## 1. Vấn đề (Why)
33→38 unit test chỉ phủ pure logic (date/xp/streak/challenge/syncMeta). Các flow
nguy hiểm nhất (rollover qua ngày, import backup, guest onboarding) chỉ test tay —
không có regression net cho mọi release sau. GĐ4 kế hoạch pre-public.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Hạ tầng
- Dev-dep `@playwright/test`; `playwright.config.ts`: testDir `e2e/`, testMatch
  `**/*.e2e.ts` (KHÔNG đụng vitest — vitest match `*.test.ts`), chromium only,
  baseURL `http://localhost:4173`, webServer `npm run preview` (reuseExistingServer).
- Script `npm run test:e2e`. Chạy trên bản BUILD thật (dist) — cần `npm run build` trước.

### REQ-02 — Test: guest onboarding
Fresh context → auth gate hiện → "Chơi không cần tài khoản" → OnboardingModal →
"Bỏ qua" → app chính hiện (STRENGTH PROGRESSION).

### REQ-03 — Test: rollover qua ngày (ADR-013)
Seed localStorage (guest, onboarded, `ironwill_last_open_date` = hôm qua, 1 task
completed hôm qua không dueDate) → mở app → task KHÔNG còn trên board, NẰM TRONG
`ironwill_archived_tasks`.

### REQ-04 — Test: import backup (ADR-012)
Seed guest onboarded → tab TIMELINE → set file input bằng backup JSON hợp lệ
(hunterName "E2E Hero", level 7) → ImportConfirmModal hiện đúng tên → "Ghi Đè Ngay"
→ header hiện "E2E Hero".

## 3. Unwanted Patterns
- ❌ Đặt e2e file dạng `*.test.ts`/`*.spec.ts` (vitest sẽ nuốt → vỡ `npm test`).
- ❌ Sleep cứng — dùng auto-wait/`expect.poll` của Playwright.
- ❌ Test phụ thuộc Firebase thật (network) — toàn bộ chạy guest mode.

## 4. Edge Cases
- BootIntro overlay vài giây — Playwright actionability tự chờ; timeout nới 15s.
- `.env.local` có Firebase config → auth gate HIỆN trong build (REQ-02 đúng kịch bản).

## 5. Definition of Done
- [x] 3 test pass trên bản build hiện tại (`npm run build` → `npm run test:e2e`).
- [x] `npm test` (vitest) vẫn 38 pass, không nuốt e2e.
- [x] .gitignore: test-results/, playwright-report/.

## 6. ADR liên quan
- ADR-013 (auto-archive), ADR-012 (export/import).
