# SPEC — XP Progression Hardening + routineDescs Sync
# feat-xp-progression-hardening | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
Ba lỗi/khoản nợ kỹ thuật trong tầng state cốt lõi:

**A. `routineDescs` mất khi sync/backup.** `routineDescs` lưu localStorage nhưng KHÔNG có trong
`GameState` (Firestore) lẫn `BackupData` (export). User đổi mô tả routine → đăng nhập máy khác
hoặc import backup → mất sạch.

**B. `addXP` chỉ lên 1 level mỗi lần gọi.** Dùng `if` thay `while` → reward lớn (vd +200 XP
cuối tháng ở level thấp) đáng lẽ lên ≥2 level chỉ lên 1, phần XP dư kẹt lại.

**C. Side-effect bên trong `setXp` updater.** `addXP` gọi `setLevel` + `setTimeout` + `playLevelUpSound`
bên trong functional updater của `setXp` — đúng anti-pattern CLAUDE.md tự cảnh báo. Dưới React 19
StrictMode, updater chạy 2 lần → nguy cơ double level-up / lệch level.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — routineDescs trong GameState + BackupData
THE `GameState` (firestoreSync.ts) và `BackupData` (schema.ts) SHALL có field
`routineDescs?: Record<string, string>` (optional, default `{}` khi thiếu — backward compatible, DATA-01).
`App.tsx` SHALL include `routineDescs` trong: first-login push, debounced sync state, `handleExport`,
và set lại trong `applyGameState` + `handleImportConfirm` (`?? {}`).

### REQ-02 — applyXpGain pure (multi-level)
THE `utils/xp.ts` SHALL export `applyXpGain(xp, level, amount): { xp, level, levelsGained }` —
hàm THUẦN cộng XP, lên NHIỀU level trong 1 lần qua vòng `while (curXp >= getXpNeeded(lvl))`.
Không vòng lặp vô hạn (mỗi vòng trừ `getXpNeeded(lvl) > 0`).

### REQ-03 — Progression qua reducer, side-effect ra effect
THE `App.tsx` SHALL quản lý `{ level, xp }` bằng `useReducer` thuần:
- action `addXp`: dùng `applyXpGain` (multi-level).
- action `set`: gán thẳng `{level, xp}` (dùng cho applyGameState / import / onboarding).
THE reducer SHALL KHÔNG chứa side-effect (không setState khác, không sound, không setTimeout).
`addXP(amount)` SHALL chỉ `dispatch({type:'addXp', amount})`.

THE level-up modal + sound SHALL chuyển sang `useEffect` theo dõi `level`:
khi `level` TĂNG do chơi (addXp), set `levelUpInfo` (final level, rank, rankChanged) + play sound.
- Khi `level` đổi do `set` (login/import/onboarding) → KHÔNG hiện modal (dùng `suppressLevelUpRef`).

### REQ-04 — Behavior giữ nguyên cho người chơi bình thường
Reward thường (≤ xpNeeded) lên đúng 1 level như cũ. Rank/threshold không đổi.

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ setState / sound / setTimeout bên trong reducer hoặc bên trong functional updater.
- ❌ Hiện LevelUpModal khi login/import nâng level từ cloud (phải suppress).
- ❌ `if` 1-lần cho việc cộng XP (phải `while` multi-level).
- ❌ Bỏ sót `routineDescs` ở bất kỳ điểm sync/export/import nào → vẫn mất dữ liệu.
- ❌ Đổi tên localStorage key / Firestore field cũ (DATA-01).
- ❌ `any`.

## 4. Edge Cases
- `applyXpGain(0, 1, 200)`: level 1 cần 120 → còn 80 XP, level 2 (cần 240), `levelsGained=1`. (200 không đủ 2 level ở mốc thấp — vẫn đúng.)
- Reward rất lớn vượt nhiều mốc → lên nhiều level, modal hiện FINAL level (1 modal).
- Login vào account cloud level cao hơn → level tăng nhưng KHÔNG modal (suppress).
- Login vào account level THẤP hơn local → level giảm, không modal, không crash.
- `routineDescs` thiếu trong backup/cloud cũ → `{}`.

## 5. Definition of Done
- [x] `utils/xp.ts`: `applyXpGain` + test multi-level trong `xp.test.ts` (33 tests pass).
- [x] `App.tsx`: useReducer cho {level,xp}, addXP dispatch, level-up effect + suppress ref; routineDescs ở mọi điểm sync/export/import.
- [x] `firestoreSync.ts` + `schema.ts`: field `routineDescs?`.
- [x] `npm test` + `npm run lint` + `npm run build` pass.
- [x] Update CLAUDE.md: known issues (routineDescs, addXP, updater side-effect) resolved.

## 6. ADR liên quan
- Củng cố ADR-008 (XP curve) + ADR-009. routineDescs nối tiếp ADR-012/ADR-013 (sync/backup completeness).
