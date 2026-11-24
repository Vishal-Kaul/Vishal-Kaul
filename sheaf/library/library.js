import { PRODUCT_NAME } from "../lib/config.js";
import { MAIN } from "../lib/categories.js";
import { createStore } from "../lib/store.js";
import { applyEdit } from "../lib/records.js";
import { runQuery } from "../lib/query.js";
import { createSelection } from "./selection.js";
import { el, renderHead, renderRow } from "./table.js";

const $ = (id) => document.getElementById(id);
const store = createStore(chrome.storage.local);
const selection = createSelection();
const UNDO_MS = 5000;

const state = { search: "", tab: "All", sortKey: "savedAt", sortDir: "desc", page: 1 };
let records = [];
let result = null;
let editingKey = null;
let lastClicked = null;
let undo = null; // { records, timer, text }
let aiStatus = "unavailable"; // unavailable | downloadable | downloading | hidden
let aiProgress = 0;
let aiDismissed = false;
let writeChain = Promise.resolve();

// Writes from this page run one after another.
const enqueue = (fn) => (writeChain = writeChain.then(fn, fn));

async function load() {
  records = await store.all();
  const keys = new Set(records.map((r) => r.key));
  selection.remove(selection.keys().filter((k) => !keys.has(k)));
  render();
}

function render() {
  result = runQuery(records, state);
  state.page = result.page;
  $("search").placeholder = `Search ${records.length} saved ${records.length === 1 ? "site" : "sites"}`;

  const tabs = $("tabs");
  tabs.replaceChildren();
  for (const t of ["All", ...MAIN]) {
    const active = state.tab === t;
    tabs.append(el("button", {
      type: "button", class: "tab" + (active ? " active" : ""), role: "tab", "aria-selected": String(active),
      "data-tab": t, onclick: () => setTab(t),
    }, [
      t === "All" ? null : el("span", { class: "dot", style: `background: var(--cat-${t.toLowerCase()}-dot)` }),
      el("span", { class: "label", text: t }),
      el("span", { class: "count", text: String(result.counts[t]) }),
    ]));
  }
  $("range").textContent = result.rangeText;
  $("prev").disabled = result.page <= 1;
  $("next").disabled = result.page >= result.pageCount;

  const notice = $("notice");
  notice.hidden = !undo;
  if (undo) {
    notice.replaceChildren(`${undo.text} · `, el("button", { type: "button", id: "undo", text: "Undo", onclick: doUndo }));
  }

  renderAiPrompt();

  const pageKeys = result.rows.map((r) => r.key);
  renderHead($("thead"), {
    sortKey: state.sortKey, sortDir: state.sortDir, selection, pageKeys, total: result.total,
    handlers: {
      sort: setSort,
      headerCheck: () => {
        const s = selection.headerState(pageKeys);
        if (s === "page" || s === "all") selection.clear();
        else selection.selectPage(pageKeys);
        render();
      },
      bulkDelete: () => deleteKeys(selection.keys()),
      cancel: () => { selection.clear(); render(); },
      selectAll: () => { selection.selectAll(result.all.map((r) => r.key)); render(); },
    },
  });

  const handlers = {
    toggle(key, shift) {
      if (shift && lastClicked && lastClicked !== key) selection.range(lastClicked, key, pageKeys);
      else selection.toggle(key);
      lastClicked = key;
      render();
    },
    copy: async (rec, btn) => {
      try { await navigator.clipboard.writeText(rec.url); btn.textContent = "Copied"; }
      catch { btn.textContent = "Copy failed"; }
      setTimeout(() => { btn.textContent = "Copy link"; }, 1200);
    },
    edit(key) { editingKey = key; render(); const i = document.querySelector(".edit-name"); i?.focus(); i?.select(); },
    cancelEdit() { editingKey = null; render(); },
    saveEdit,
    remove: (key) => deleteKeys([key]),
  };
  $("tbody").replaceChildren(...result.rows.map((r) =>
    renderRow(r, { selected: selection.has(r.key), editing: editingKey === r.key, handlers })));
  document.title = PRODUCT_NAME;
}

function renderAiPrompt() {
  const node = $("ai-prompt");
  const show = !aiDismissed && (aiStatus === "downloadable" || aiStatus === "downloading");
  node.hidden = !show;
  if (!show) return;
  if (aiStatus === "downloading") {
    node.textContent = `Downloading… ${Math.round(aiProgress * 100)}%`;
    return;
  }
  node.replaceChildren(
    "Smarter sorting is available on this computer. ",
    el("button", { type: "button", id: "ai-on", text: "Turn on", onclick: turnOnAi }),
    " · ",
    el("button", { type: "button", id: "ai-dismiss", text: "Dismiss", onclick: dismissAi }),
  );
}

async function initAi() {
  try {
    aiDismissed = !!(await store.getMeta()).aiPromptDismissed;
    if (typeof LanguageModel === "undefined") return;
    const a = await LanguageModel.availability();
    aiStatus = a === "downloadable" || a === "downloading" ? a : "unavailable";
    if (aiStatus === "downloading") aiProgress = 0;
  } catch {
    aiStatus = "unavailable";
  }
  renderAiPrompt();
}

async function turnOnAi() {
  aiStatus = "downloading";
  aiProgress = 0;
  renderAiPrompt();
  try {
    const session = await LanguageModel.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => { aiProgress = e.loaded; renderAiPrompt(); });
      },
    });
    try { session.destroy(); } catch { /* ignore */ }
    aiStatus = "unavailable"; // ready: hide the prompt
  } catch {
    aiStatus = "downloadable";
  }
  renderAiPrompt();
}

async function dismissAi() {
  aiDismissed = true;
  renderAiPrompt();
  try { await store.setMeta({ aiPromptDismissed: true }); } catch { /* ignore */ }
}

function resetView() {
  state.page = 1;
  selection.clear();
  lastClicked = null;
  editingKey = null;
}
function setTab(t) { state.tab = t; resetView(); render(); }
function setSort(key) {
  if (state.sortKey === key) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
  else { state.sortKey = key; state.sortDir = key === "visits" || key === "savedAt" ? "desc" : "asc"; }
  state.page = 1;
  render();
}

async function saveEdit(key, { name, category, subcategory }) {
  const rec = records.find((r) => r.key === key);
  editingKey = null;
  if (rec) {
    await enqueue(async () => {
      try { await store.put(applyEdit(rec, { name, category, subcategory }, Date.now())); }
      catch (e) { console.error(e); }
    });
  }
  await load();
}

async function deleteKeys(keys) {
  const gone = records.filter((r) => keys.includes(r.key));
  if (!gone.length) return;
  clearTimeout(undo?.timer);
  undo = {
    records: gone,
    text: gone.length === 1 ? "Deleted" : `${gone.length} deleted`,
    timer: setTimeout(() => { undo = null; render(); }, UNDO_MS),
  };
  selection.remove(keys);
  await enqueue(() => store.remove(gone.map((r) => r.key)));
  await load();
}

async function doUndo() {
  if (!undo) return;
  const { records: back, timer } = undo;
  clearTimeout(timer);
  undo = null;
  await enqueue(async () => { for (const r of back) await store.put(r); });
  await load();
}

$("search").addEventListener("input", (e) => { state.search = e.target.value; resetView(); render(); });
$("prev").addEventListener("click", () => { state.page--; selection.clear(); render(); });
$("next").addEventListener("click", () => { state.page++; selection.clear(); render(); });
$("import").addEventListener("click", (e) => e.preventDefault());
$("export").addEventListener("click", (e) => e.preventDefault());
document.addEventListener("keydown", (e) => {
  const t = e.target;
  const typing = t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName));
  if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    $("search").focus();
  }
});
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local" && editingKey === null) load();
});

$("product-name").textContent = PRODUCT_NAME;
document.title = PRODUCT_NAME;
initAi();
load().then(() => { document.body.dataset.ready = ""; });
