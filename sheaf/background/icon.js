const sizes = [16, 32, 48, 128];
const paths = (kind) => Object.fromEntries(sizes.map((s) => [s, `assets/icons/${kind}-${s}.png`]));

const DONE_MS = 2000;
const ERROR_MS = 1500;
let doneTimer = null;
let errorTimer = null;
let doneTab = null; // tab showing the done icon right now
let resolver = async () => null; // tabId -> record|null, supplied by the worker

export function setResolver(fn) {
  resolver = fn;
}

async function activeTabId() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id;
}

export const badgeText = (visits) => (visits > 99 ? "99+" : String(visits));

export async function showFor(tabId, record) {
  if (tabId == null || tabId === doneTab) return;
  try {
    if (record) {
      await chrome.action.setIcon({ tabId, path: paths("saved") });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: "#1C1B18" });
      await chrome.action.setBadgeText({ tabId, text: badgeText(record.visits) });
    } else {
      await chrome.action.setIcon({ tabId, path: paths("idle") });
      await chrome.action.setBadgeText({ tabId, text: "" });
    }
  } catch {
    // tab closed meanwhile
  }
}

export async function flashDone() {
  const tabId = await activeTabId();
  clearTimeout(doneTimer);
  doneTab = tabId ?? null;
  try {
    await chrome.action.setIcon({ ...(tabId == null ? {} : { tabId }), path: paths("done") });
  } catch {}
  doneTimer = setTimeout(async () => {
    doneTab = null;
    const now = await activeTabId();
    if (now != null) await showFor(now, await resolver(now));
  }, DONE_MS);
}

export async function flashError() {
  const tabId = await activeTabId();
  clearTimeout(errorTimer);
  const target = tabId == null ? {} : { tabId };
  try {
    await chrome.action.setBadgeBackgroundColor({ ...target, color: "#A8321D" });
    await chrome.action.setBadgeText({ ...target, text: "✕" });
  } catch {}
  errorTimer = setTimeout(async () => {
    try {
      await chrome.action.setBadgeText({ ...target, text: "" });
    } catch {}
  }, ERROR_MS);
}
