# SPEC: feat-auth — Firebase Authentication + Firestore Sync
Version: 1.0.0 | Status: APPROVED | Date: 2026-06-04

## RFC Summary (ARCH-01 Exception Approved)
LevelUp cần phiên bản mobile trong tương lai → data phải sync cross-device.
**Quyết định:** Firebase Auth (Google + Email/Password) + Firestore (game state storage).
ADR-001 vẫn giữ localStorage làm guest/offline layer — Firestore là sync layer khi đã đăng nhập.

## Architecture

### Layers
```
Guest mode (không login):    localStorage only (behavior hiện tại, không thay đổi)
Logged-in mode (có login):   localStorage + Firestore sync (debounced 3s)
Cross-device restore:        Load từ Firestore khi login, overwrite local state
```

### Firebase Services Used
- **Firebase Authentication**: Google Sign-In, Email/Password
- **Firestore**: Document per user `users/{uid}` — stores full GameState

### Firestore Data Model
```
users/{uid}:
  hunterName, level, xp, streak, shields
  disciplineMode, soundEnabled, onboardingDone
  routineLabels, whyCards, monthlyBudgets
  dailyRoutines, tasks[], transactions[], weightLogs[], logs[], achievements[]
  lastOpenDate
```
Document size estimate: ~150KB after 1 year → well under 1MB Firestore limit.

### Security Rules (Firestore)
```
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Requirements

### REQ-A1: Guest mode preserved
THE system SHALL work fully without login.
localStorage behavior KHÔNG THAY ĐỔI — auth là opt-in layer.

### REQ-A2: Auth Modal
THE system SHALL provide AuthModal with:
- Google Sign-In button (popup flow)
- Email / Password form (Login tab + Đăng ký tab)
- "Tiếp tục không đăng nhập" option to dismiss

### REQ-A3: Auth indicator in StatusHeader
WHEN Firebase is configured (VITE_FIREBASE_API_KEY set),
THE system SHALL show a small auth button near the sound toggle:
- Not logged in: "Đăng nhập" button → opens AuthModal
- Logged in: email truncated + "Đăng xuất" link

### REQ-A4: Cloud load on login
WHEN user logs in,
IF Firestore has existing data for this UID:
  THE system SHALL load Firestore data and overwrite local React state (applyGameState).
IF no Firestore data (first-time login):
  THE system SHALL auto-save current localStorage state to Firestore (migration).

### REQ-A5: Debounced Firestore sync
WHEN user is logged in AND any game state changes,
THE system SHALL save to Firestore after a 3-second debounce.
localStorage continues to save immediately (unchanged behavior).

### REQ-A6: Sign out
WHEN user clicks "Đăng xuất",
THE system SHALL sign out from Firebase Auth.
Local state stays in localStorage (data not deleted).

### REQ-A7: Firebase not configured = graceful degradation
WHEN VITE_FIREBASE_API_KEY env var is missing,
THE system SHALL hide all auth UI and behave identically to pre-auth version.

## Files

### New
- `src/firebase.ts` — Firebase init (conditional on env vars)
- `src/utils/firestoreSync.ts` — GameState type + loadGameState / saveGameState
- `src/components/AuthModal.tsx` — Login/Register/Google UI

### Modified
- `App.tsx` — auth state, onAuthStateChanged, applyGameState, Firestore sync effect
- `StatusHeader.tsx` — auth indicator

### Config
- `.env.example` — template for Firebase env vars
- Firebase console: enable Google + Email/Password providers, set Firestore rules

## Unwanted Patterns
- KHÔNG hardcode Firebase config values (phải dùng env vars)
- KHÔNG sync photos/avatarUrl to Firestore (IndexedDB stays local — phase 2)
- KHÔNG block app load on auth state — show app immediately, auth loads async
- KHÔNG clear localStorage on sign-out (local data preserved)
- KHÔNG use `any` type — GameState phải type-safe

## Definition of Done
- [ ] App loads without login (guest mode unchanged)
- [ ] Google Sign-In mở popup, login thành công
- [ ] Email/Password register + login works
- [ ] On first login: localStorage state auto-migrated to Firestore
- [ ] On re-login: Firestore state loads and overwrites local
- [ ] State changes debounced 3s → Firestore save
- [ ] Auth indicator shows in StatusHeader (only when Firebase configured)
- [ ] Sign out works
- [ ] `isConfigured = false` → no auth UI, app identical to before
- [ ] `npx tsc --noEmit` passes
