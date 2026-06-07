# SPEC — usePersistedState hook (Bước 2a giảm god-component)
# feat-use-persisted-state | Status: IMPLEMENTED | Owner: @tanvu15 | 2026-06-07

## 1. Vấn đề (Why)
`App.tsx` còn ~797 dòng. ~95 dòng là khai báo state kiểu
`useState(() => localStorage.getItem(...) ?? default)` lặp 16 lần, cộng 1 effect persistence
khổng lồ (~22 dòng, dep array 17 phần tử) ghi MỌI key mỗi khi BẤT KỲ state đổi. Gom lại
thành 1 hook `usePersistedState` chuẩn → giảm boilerplate, tách mối lo "persistence" khỏi App.

## 2. Hành vi mong muốn (SHALL)

### REQ-01 — Hook usePersistedState
THE system SHALL có `src/hooks/usePersistedState.ts`:
- `usePersistedState<T>(key, initial, codec): [T, Dispatch<SetStateAction<T>>]` — chữ ký y hệt `useState`.
- Lazy-init: đọc `localStorage[key]`; null → `initial`; parse lỗi → `initial` (try/catch).
- Effect ghi `localStorage[key] = codec.serialize(value)` khi mount VÀ mỗi lần `value` đổi
  (giữ đúng hành vi cũ: effect cũ ghi cả lúc mount), bọc try/catch (quota/private mode).
- `codecs` export sẵn: `str` (identity), `int` (parseInt/String), `bool` (`'true'`/String), `json` (JSON parse/stringify).

### REQ-02 — App.tsx dùng hook cho state đơn giản
THE `App.tsx` SHALL thay 16 state persisted bằng `usePersistedState` với codec phù hợp:
`hunterName(str)`, `streak(int)`, `shields(int)`, `disciplineMode(bool)`, `soundEnabled(bool)`,
`whyCards(json)`, `monthlyBudgets(json)`, `routineLabels(json)`, `routineDescs(json)`,
`dailyRoutines(json)`, `tasks(json)`, `archivedTasks(json)`, `transactions(json)`,
`weightLogs(json)`, `logs(json)`, `achievements(json)`.
Giá trị `initial`/default giữ NGUYÊN như cũ (kể cả default routineLabels, achievements seed).

### REQ-03 — Gỡ effect persistence cũ, giữ các write đặc biệt
THE `App.tsx` SHALL gỡ effect persistence khổng lồ. `level`/`xp` (do `useReducer` sở hữu) được
persist bằng 1 effect nhỏ riêng (`ironwill_level`, `ironwill_xp`). `ironwill_schema_version`
vẫn được ghi trong migration effect (đã có) — không mất.

### REQ-04 — Không đổi hành vi
Các setter trả về giống `useState` → mọi nơi gọi `setX(...)` / `setX(prev => ...)` KHÔNG đổi.
Default `hunterName`: chuỗi rỗng vẫn fallback `'Challenger'` (giữ semantics `|| 'Challenger'` cũ).

## 3. Unwanted Patterns (KHÔNG được làm)
- ❌ Đổi key localStorage / prefix `ironwill_` (DATA-01).
- ❌ Đổi giá trị default của bất kỳ state nào.
- ❌ Bỏ ghi lúc mount (effect cũ có ghi mount → giữ để không đổi hành vi với user mới).
- ❌ Đọc localStorage trong child component (ARCH-02) — hook dùng trong App.
- ❌ `any` (dùng generic `<T>` + codec có kiểu).
- ❌ Đụng `level`/`xp` reducer hay logic XP/streak (ngoài scope task này).

## 4. Edge Cases
- localStorage throw (quota/Safari private): try/catch, app không crash (giữ tinh thần ENG-03).
- Parse JSON hỏng: trả `initial` thay vì crash.
- `int` codec gặp chuỗi rỗng: NaN — chỉ xảy ra nếu key bị set thủ công rỗng (không xảy ra trong luồng app); chấp nhận.

## 5. Definition of Done
- [x] `src/hooks/usePersistedState.ts` + `codecs`.
- [x] `App.tsx` chuyển 16 state, gỡ effect persistence cũ, thêm effect nhỏ level/xp.
- [x] `npm run lint` + `npm test` (33) + `npm run build` pass. Hành vi/giao diện không đổi.
- [x] App.tsx 797 → 739 dòng (940 → 739 tính từ đầu).

## 6. ADR liên quan
- DATA-01 (giữ key). Bước 2a/▢ của lộ trình giải quyết god-component (sau chrome extraction).
