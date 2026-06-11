import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { isConfigured, loadFirebase } from '../firebase';
import { loadGameState, saveGameState, GameState } from '../utils/firestoreSync';
import { decideCloudAction, readLocalUpdatedAt } from '../utils/syncMeta';

// Owns Firebase auth + Firestore sync, extracted from App.tsx (ADR-011).
// Conflict detection + flush-on-hide: see .sdd/specs/feat-sync-hardening/SPEC.md.

interface UseFirebaseSyncOptions {
  state: GameState;                          // current snapshot to push (memoized by caller)
  applyState: (s: GameState) => void;        // apply cloud / first-login state
  onUserChange?: (user: User | null) => void;
  onConflict?: (cloud: GameState) => void;   // local newer than cloud — caller shows SyncConflictModal
}

export function useFirebaseSync({ state, applyState, onUserChange, onConflict }: UseFirebaseSyncOptions): User | null {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Latest values for the once-only auth effect (avoids stale-closure on first-login push).
  const stateRef = useRef(state);
  const applyRef = useRef(applyState);
  const onUserChangeRef = useRef(onUserChange);
  const onConflictRef = useRef(onConflict);
  stateRef.current = state;
  applyRef.current = applyState;
  onUserChangeRef.current = onUserChange;
  onConflictRef.current = onConflict;

  // True khi state đổi mà chưa save xong — flush-on-hide chỉ ghi khi thật sự có thay đổi.
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;
    let unsub = () => {};
    (async () => {
      const fb = await loadFirebase();
      if (!fb || cancelled) return;
      const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
      // Redirect sign-in (PWA standalone): bắt lỗi ra console — không có dòng này thì
      // redirect fail là "im lặng quay về như khách", không debug được (device test round 2).
      getRedirectResult(fb.auth).catch(e => {
        console.error('[Auth redirect]', (e as { code?: string }).code ?? e);
      });
      unsub = onAuthStateChanged(fb.auth, async (user) => {
        setCurrentUser(user);
        onUserChangeRef.current?.(user);
        if (!user) return;
        // Load cloud state; if none exists yet, push current local data up (first login).
        const cloudState = await loadGameState(user.uid);
        if (!cloudState) {
          await saveGameState(user.uid, stateRef.current);
          return;
        }
        // Local mới hơn cloud (phiên trước chưa kịp sync / guest có dữ liệu) → hỏi user
        // thay vì ghi đè im lặng. Ngược lại apply cloud như cũ.
        if (decideCloudAction(cloudState.updatedAt, readLocalUpdatedAt()) === 'conflict' && onConflictRef.current) {
          onConflictRef.current(cloudState);
        } else {
          applyRef.current(cloudState);
        }
      });
    })();
    return () => { cancelled = true; unsub(); };
  }, []);

  // Mỗi lần snapshot đổi identity = có thay đổi thật chưa sync. Skip lần mount
  // (mount không phải thay đổi — tránh flush đẩy state cũ đè cloud mới hơn).
  const firstStateRef = useRef(true);
  useEffect(() => {
    if (firstStateRef.current) { firstStateRef.current = false; return; }
    dirtyRef.current = true;
  }, [state]);

  // Debounced sync (3s) — only when logged in. `state` identity is stable across
  // renders (caller memoizes it) so the timer resets only on real data changes.
  useEffect(() => {
    if (!currentUser) return;
    const t = setTimeout(() => {
      dirtyRef.current = false;
      saveGameState(currentUser.uid, state);
    }, 3000);
    return () => clearTimeout(t);
  }, [currentUser, state]);

  // Flush khi rời trang/ẩn tab — đóng app trong cửa sổ debounce 3s không còn mất thay đổi.
  // Best-effort: pagehide không await được, nhưng visibilitychange(hidden) thường đủ
  // thời gian trên mobile (app background trước khi bị kill).
  useEffect(() => {
    if (!currentUser) return;
    const flush = () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      saveGameState(currentUser.uid, stateRef.current);
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [currentUser]);

  return currentUser;
}
