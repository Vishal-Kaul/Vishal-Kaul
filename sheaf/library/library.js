import { PRODUCT_NAME } from "../lib/config.js";
import { MAIN } from "../lib/categories.js";
import { createStore } from "../lib/store.js";
import { applyEdit } from "../lib/records.js";
import { runQuery } from "../lib/query.js";
import { toCsv, toJson } from "../lib/csv.js";
import { mergeImport, recordsFromCsv, recordsFromJson } from "../lib/merge.js";
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
let flash = null; // { text, timer } transient notice
let meta = { settings: { backup: true }, lastBackupAt: null };
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
  notice.hidden = !undo && !flash;
  if (undo) {
    notice.replaceChildren(`${undo.text} · `, el("button", { type: "button", id: "undo", text: "Undo", onclick: doUndo }));
  } else if (flash) {
    notice.replaceChildren(flash.text);
  }
  renderBackup();

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
      if (shift && lastClicked && lastClicked !== key && pageKeys.includes(lastClicked)) selection.range(lastClicked, key, pageKeys);
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

function renderBackup() {
  const on = meta.settings.backup;
  const last = meta.lastBackupAt
    ? ` · Last backup ${new Date(meta.lastBackupAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
    : "";
  $("backup-toggle").textContent = `Weekly backup: ${on ? "on" : "off"}${on ? last : ""}`;
}

function showFlash(text, ms = 5000) {
  clearTimeout(flash?.timer);
  flash = { text, timer: setTimeout(() => { flash = null; render(); }, ms) };
  render();
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function doExport(kind) {
  $("export-menu").hidden = true;
  const all = await store.all();
  const base = `${PRODUCT_NAME.toLowerCase()}-export-${today()}`;
  if (kind === "csv") download(`${base}.csv`, toCsv(all), "text/csv;charset=utf-8");
  else download(`${base}.json`, toJson(all, Date.now()), "application/json");
}

async function doImport(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const now = Date.now();
    const incoming = /\.json$/i.test(file.name) || text.trimStart().startsWith("{") || text.trimStart().startsWith("[")
      ? recordsFromJson(text, now)
      : recordsFromCsv(text, now);
    const { added, updated } = await enqueue(async () => {
      const existing = await store.all();
      const out = mergeImport(existing, incoming, now);
      const byKey = new Map(existing.map((r) => [r.key, r]));
      for (const r of out.records) {
        if (JSON.stringify(byKey.get(r.key)) !== JSON.stringify(r)) await store.put(r);
      }
      return out;
    });
    await load();
    showFlash(`Imported ${added} new · ${updated} updated`);
  } catch (e) {
    console.error(e);
    showFlash("Couldn't read that file");
  }
}

async function toggleBackup() {
  const on = !meta.settings.backup;
  meta = { ...meta, settings: { ...meta.settings, backup: on } };
  renderBackup();
  await enqueue(() => store.setMeta({ settings: { backup: on } }));
}

async function loadMeta() {
  try { meta = await store.getMeta(); } catch { /* keep defaults */ }
  renderBackup();
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
  lastClicked = null;
  render();
}

async function saveEdit(key, { name, category, subcategory }) {
  const rec = records.find((r) => r.key === key);
  editingKey = null;
  if (rec) {
    await enqueue(async () => {
      try { await store.put(applyEdit(rec, { name, category, subcategory }, Date.now())); }
      catch (e) { console.error(e); showFlash("Couldn't save that change"); }
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
$("prev").addEventListener("click", () => { state.page--; selection.clear(); lastClicked = null; render(); });
$("next").addEventListener("click", () => { state.page++; selection.clear(); lastClicked = null; render(); });
$("import").addEventListener("click", (e) => { e.preventDefault(); $("import-file").click(); });
$("import-file").addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; doImport(f); });
$("export").addEventListener("click", (e) => { e.preventDefault(); $("export-menu").hidden = !$("export-menu").hidden; });
$("export-csv").addEventListener("click", () => doExport("csv"));
$("export-json").addEventListener("click", () => doExport("json"));
$("backup-toggle").addEventListener("click", toggleBackup);
document.addEventListener("keydown", (e) => {
  const t = e.target;
  const typing = t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName));
  if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    $("search").focus();
  }
});
chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local" && editingKey === null) { load(); loadMeta(); }
});

$("product-name").textContent = PRODUCT_NAME;
document.title = PRODUCT_NAME;
initAi();
loadMeta();
load().then(() => { document.body.dataset.ready = ""; });
