import { vi } from 'vitest';

type Listener = (e: MediaQueryListEvent) => void;

/**
 * Stubs window.matchMedia. `desktop` decides whether '(min-width: 1024px)'
 * matches; reduced motion never matches. Returns `setDesktop` to fire a
 * change event on every live '(min-width: …)' list.
 */
export function stubMatchMedia(desktop: boolean) {
  let isDesktop = desktop;
  const lists = new Map<string, { mql: MediaQueryList; listeners: Set<Listener> }>();
  const matches = (query: string) => (query.includes('min-width: 1024px') ? isDesktop : false);

  vi.stubGlobal('matchMedia', (query: string) => {
    let entry = lists.get(query);
    if (!entry) {
      const listeners = new Set<Listener>();
      const mql = {
        get matches() {
          return matches(query);
        },
        media: query,
        onchange: null,
        addEventListener: (_: string, l: Listener) => listeners.add(l),
        removeEventListener: (_: string, l: Listener) => listeners.delete(l),
        addListener: (l: Listener) => listeners.add(l),
        removeListener: (l: Listener) => listeners.delete(l),
        dispatchEvent: () => false,
      } as unknown as MediaQueryList;
      entry = { mql, listeners };
      lists.set(query, entry);
    }
    return entry.mql;
  });

  return {
    setDesktop(next: boolean) {
      isDesktop = next;
      for (const [query, { listeners }] of lists) {
        for (const l of listeners) l({ matches: matches(query), media: query } as MediaQueryListEvent);
      }
    },
  };
}
