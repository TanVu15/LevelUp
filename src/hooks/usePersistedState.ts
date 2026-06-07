import { Dispatch, SetStateAction, useEffect, useState } from 'react';

// useState that mirrors a value into localStorage. Replaces the repeated
// `useState(() => localStorage.getItem(...) ?? default)` + one giant persistence
// effect in App.tsx. See .sdd/specs/feat-use-persisted-state/SPEC.md.

export interface Codec<T> {
  parse: (raw: string) => T;
  serialize: (value: T) => string;
}

export const codecs = {
  str: { parse: (r) => r, serialize: (v) => v } as Codec<string>,
  int: { parse: (r) => parseInt(r, 10), serialize: (v) => String(v) } as Codec<number>,
  bool: { parse: (r) => r === 'true', serialize: (v) => String(v) } as Codec<boolean>,
  json<T>(): Codec<T> {
    return { parse: (r) => JSON.parse(r) as T, serialize: (v) => JSON.stringify(v) };
  },
};

export function usePersistedState<T>(
  key: string,
  initial: T,
  codec: Codec<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    if (raw === null) return initial;
    try { return codec.parse(raw); } catch { return initial; }
  });

  // codec is constant per call-site (a fresh codecs.json<T>() each render is fine —
  // we read the latest closure); keep it out of deps so we only write on value change.
  useEffect(() => {
    try { localStorage.setItem(key, codec.serialize(value)); } catch { /* quota / private mode — ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue];
}
