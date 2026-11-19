'use client';

import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => null;

/**
 * Whether a media query matches. Returns null on the server and during
 * hydration (React uses the server snapshot first), so callers can render a
 * neutral shell instead of guessing a layout and causing a mismatch.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const mql = window.matchMedia(query);
      if (mql.addEventListener) {
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
      }
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => (typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false),
    [query],
  );
  return useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);
}
