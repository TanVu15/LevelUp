import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { isConfigured, loadFirebase } from '../firebase';
import { loadGameState, saveGameState, GameState } from '../utils/firestoreSync';

// Owns Firebase auth + Firestore sync, extracted from App.tsx (ADR-011).
// See .sdd/specs/feat-use-firebase-sync/SPEC.md.

interface UseFirebaseSyncOptions {
  state: GameState;                          // current snapshot to push (memoized by caller)
  applyState: (s: GameState) => void;        // apply cloud / first-login state
  onUserChange?: (user: User | null) => void;
}

export function useFirebaseSync({ state, applyState, onUserChange }: UseFirebaseSyncOptions): User | null {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Latest values for the once-only auth effect (avoids stale-closure on first-login push).
  const stateRef = useRef(state);
  const applyRef = useRef(applyState);
  const onUserChangeRef = useRef(onUserChange);
  stateRef.current = state;
  applyRef.current = applyState;
  onUserChangeRef.current = onUserChange;

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;
    let unsub = () => {};
    (async () => {
      const fb = await loadFirebase();
      if (!fb || cancelled) return;
      const { onAuthStateChanged } = await import('firebase/auth');
      unsub = onAuthStateChanged(fb.auth, async (user) => {
        setCurrentUser(user);
        onUserChangeRef.current?.(user);
        if (!user) return;
        // Load cloud state; if none exists yet, push current local data up (first login).
        const cloudState = await loadGameState(user.uid);
        if (cloudState) applyRef.current(cloudState);
        else await saveGameState(user.uid, stateRef.current);
      });
    })();
    return () => { cancelled = true; unsub(); };
  }, []);

  // Debounced sync (3s) — only when logged in. `state` identity is stable across
  // renders (caller memoizes it) so the timer resets only on real data changes.
  useEffect(() => {
    if (!currentUser) return;
    const t = setTimeout(() => saveGameState(currentUser.uid, state), 3000);
    return () => clearTimeout(t);
  }, [currentUser, state]);

  return currentUser;
}
