import { createStore } from "../lib/store.js";
import { savePage } from "../lib/save.js";
import { onTabUrl, onTabRemoved, seedState } from "../lib/visits.js";
import { normalizeUrl } from "../lib/url-key.js";
import { readPage } from "../content/read-page.js";
import * as icon from "./icon.js";

const store = createStore(chrome.storage.local);
const STATE_KEY = "tabState";

// One serial queue for every store mutation (saves and visit counting).
let chain = Promise.resolve();
function serial(fn) {
  const p = chain.then(fn);
  chain = p.catch(() => {});
  return p;
}

async function readState() {
  return (await chrome.storage.session.get(STATE_KEY))[STATE_KEY] || {};
}
async function writeState(state) {
  await chrome.storage.session.set({ [STATE_KEY]: state });
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab || null;
}

async function signalsFor(tab) {
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: readPage });
    return res?.result ?? null;
  } catch {
    return null;
  }
}

// `override` is a test-only seam: headless Playwright cannot press the extension
// shortcut, so activeTab is never granted and executeScript is refused. The real
// command path always calls saveActive() with no argument.
async function saveActive(override) {
  const tab = await activeTab();
  if (!tab) return { status: "unsaveable" };
  const signals = override && "signals" in override ? override.signals : await signalsFor(tab);
  const url = signals?.url || tab.url || "";
  const result = await serial(() => savePage(store, { url, signals }, Date.now()));
  if (result.status === "saved" || result.status === "exists") {
    await chrome.tabs.remove(tab.id);
    icon.flashDone();
  } else {
    icon.flashError();
  }
  return { status: result.status };
}

async function stateForActive() {
  const tab = await activeTab();
  const url = tab?.url || "";
  const title = tab?.title || "";
  const key = normalizeUrl(url);
  const record = key ? await store.get(key) : null;
  return record ? { saved: true, record, title, url } : { saved: false, title, url };
}

function countVisit(tabId, url) {
  return serial(async () => {
    const state = await readState();
    const { state: next } = await onTabUrl(state, tabId, url, Date.now(), store);
    await writeState(next);
  });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "save-and-close") saveActive();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.url || changeInfo.status === "complete") && (changeInfo.url || tab.url)) {
    countVisit(tabId, changeInfo.url || tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  serial(async () => writeState(onTabRemoved(await readState(), tabId)));
});

chrome.runtime.onStartup.addListener(() => {
  serial(async () => writeState(seedState(await chrome.tabs.query({}))));
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "save-active") {
    saveActive().then(sendResponse);
    return true;
  }
  if (msg?.type === "state-for-active") {
    stateForActive().then(sendResponse);
    return true;
  }
  if (msg?.type === "open-library") {
    chrome.tabs.create({ url: chrome.runtime.getURL("library/library.html") });
  }
  return false;
});

self.__sheaf = { saveActive, store };
