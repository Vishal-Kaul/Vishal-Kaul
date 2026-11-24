import { normalizeUrl } from "./url-key.js";
import { isValid } from "./categories.js";
import { categorizeUrlOnly } from "./categorize.js";
import { parseCsv, detectUrlColumn, CSV_HEADER } from "./csv.js";

const MAX_TS = 8.64e15;
const MAX_NAME = 300;
const MAX_URL = 2048;
const okTs = (n) => Number.isFinite(n) && Math.abs(n) <= MAX_TS;

function ts(v, fallback) {
  if (typeof v === "number" && okTs(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = /^\d+$/.test(v.trim()) ? Number(v) : Date.parse(v);
    if (okTs(n)) return n;
  }
  return okTs(fallback) ? fallback : Date.now();
}

// Turns a loosely-shaped incoming object into a full record, or null if its URL can't be saved.
export function normalizeIncoming(raw, now) {
  const url = typeof raw?.url === "string" ? raw.url.trim() : "";
  if (url.length > MAX_URL) return null;
  const key = normalizeUrl(url);
  if (!key) return null;
  let { category, subcategory } = raw;
  let categorySource = typeof raw.categorySource === "string" && raw.categorySource ? raw.categorySource : "rules";
  if (!isValid(category, subcategory)) {
    ({ category, subcategory } = categorizeUrlOnly(url));
    categorySource = "rules";
  }
  const v = Math.floor(Number(raw.visits));
  const visits = Number.isSafeInteger(v) && v >= 1 ? v : 1;
  const savedAt = ts(raw.savedAt, now);
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, MAX_NAME) : new URL(key).host;
  return {
    key, url, name, category, subcategory, categorySource, visits, savedAt,
    lastVisitedAt: ts(raw.lastVisitedAt, savedAt),
    updatedAt: ts(raw.updatedAt, now),
  };
}

export function recordsFromJson(text, now = Date.now()) {
  const data = typeof text === "string" ? JSON.parse(text) : text;
  const list = Array.isArray(data) ? data : data?.records;
  if (!Array.isArray(list)) throw new Error("No records found");
  return list.map((r) => normalizeIncoming(r, now)).filter(Boolean);
}

export function recordsFromCsv(text, now = Date.now()) {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const out = [];
  if (rows[0].map((c) => c.trim()).join(",") === CSV_HEADER) {
    const unguard = (c) => (typeof c === "string" ? c.replace(/^'(?=[=+\-@])/, "") : c);
    for (const [name, url, category, subcategory, visits, savedAt] of rows.slice(1)) {
      const r = normalizeIncoming({ name: unguard(name), url, category, subcategory, visits, savedAt }, now);
      if (r) out.push(r);
    }
    return out;
  }
  const col = detectUrlColumn(rows);
  if (col < 0) return [];
  const firstIsHeader = !rows[0][col] || !normalizeUrl(rows[0][col]);
  const nameCol = rows[0].findIndex((c, i) => i !== col && /^(name|title)$/i.test(c.trim()));
  for (const row of rows.slice(firstIsHeader ? 1 : 0)) {
    const url = (row[col] || "").trim();
    if (!normalizeUrl(url)) continue;
    const name = nameCol >= 0 ? row[nameCol] : "";
    const r = normalizeIncoming({ url, name }, now);
    if (r) out.push(r);
  }
  return out;
}

const FIELDS = ["visits", "savedAt", "lastVisitedAt", "category", "subcategory", "categorySource"];

function mergeOne(cur, inc, now) {
  const next = { ...cur };
  next.visits = Math.max(cur.visits, inc.visits);
  next.savedAt = Math.min(cur.savedAt, inc.savedAt);
  next.lastVisitedAt = Math.max(cur.lastVisitedAt, inc.lastVisitedAt);
  if (inc.categorySource === "user" && cur.categorySource !== "user") {
    next.category = inc.category;
    next.subcategory = inc.subcategory;
    next.categorySource = "user";
  }
  if (FIELDS.some((f) => next[f] !== cur[f])) next.updatedAt = now;
  return { next, changed: next.updatedAt !== cur.updatedAt };
}

export function mergeImport(existing, incoming, now) {
  const map = new Map(existing.map((r) => [r.key, r]));
  const touchedNew = new Set();
  const touchedOld = new Set();
  for (const inc of incoming) {
    const cur = map.get(inc.key);
    if (!cur) {
      map.set(inc.key, inc);
      touchedNew.add(inc.key);
      continue;
    }
    const { next, changed } = mergeOne(cur, inc, now);
    map.set(inc.key, next);
    if (changed && !touchedNew.has(inc.key)) touchedOld.add(inc.key);
  }
  return { records: [...map.values()], added: touchedNew.size, updated: touchedOld.size };
}
