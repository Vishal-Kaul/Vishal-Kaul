export function createSelection() {
  const set = new Set();
  return {
    toggle(key) {
      if (set.has(key)) set.delete(key);
      else set.add(key);
    },
    range(fromKey, toKey, orderedKeys) {
      const a = orderedKeys.indexOf(fromKey);
      const b = orderedKeys.indexOf(toKey);
      if (a < 0 || b < 0) return;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(orderedKeys[i]);
    },
    selectPage(keys) {
      for (const k of keys) set.add(k);
    },
    selectAll(allKeys) {
      for (const k of allKeys) set.add(k);
    },
    remove(keys) {
      for (const k of keys) set.delete(k);
    },
    clear() {
      set.clear();
    },
    has: (key) => set.has(key),
    get size() {
      return set.size;
    },
    keys: () => [...set],
    headerState(pageKeys) {
      if (set.size === 0) return "none";
      if (pageKeys.length && pageKeys.every((k) => set.has(k))) return set.size > pageKeys.length ? "all" : "page";
      return "some";
    },
  };
}
