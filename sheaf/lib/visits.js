import { normalizeUrl } from "./url-key.js";

// state: { [tabId]: lastKey }. Never mutated; a new object is returned.
export async function onTabUrl(state, tabId, url, now, store) {
  const key = normalizeUrl(url);
  const prev = state[tabId];
  const next = { ...state, [tabId]: key };
  if (key === null || key === prev) return { state: next, counted: false };
  const rec = await store.get(key);
  if (!rec) return { state: next, counted: false };
  await store.put({ ...rec, visits: rec.visits + 1, lastVisitedAt: now, updatedAt: now });
  return { state: next, counted: true };
}

export function onTabRemoved(state, tabId) {
  const next = { ...state };
  delete next[tabId];
  return next;
}

export function seedState(tabs) {
  const state = {};
  for (const t of tabs) state[t.id] = normalizeUrl(t.url);
  return state;
}
