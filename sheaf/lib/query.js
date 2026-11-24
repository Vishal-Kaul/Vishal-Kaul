import { PAGE_SIZE } from "./config.js";
import { MAIN, label } from "./categories.js";
import { displayLink } from "./url-key.js";

const cmpStr = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" });

const SORTERS = {
  name: (a, b) => cmpStr(a.name || "", b.name || ""),
  link: (a, b) => cmpStr(displayLink(a.url), displayLink(b.url)),
  category: (a, b) => cmpStr(label(a.category, a.subcategory), label(b.category, b.subcategory)),
  visits: (a, b) => a.visits - b.visits,
  savedAt: (a, b) => a.savedAt - b.savedAt,
};

function matches(rec, needle) {
  return (
    (rec.name || "").toLowerCase().includes(needle) ||
    displayLink(rec.url).toLowerCase().includes(needle) ||
    label(rec.category, rec.subcategory).toLowerCase().includes(needle)
  );
}

export function runQuery(records, { search = "", tab = "All", sortKey = "savedAt", sortDir = "desc", page = 1 } = {}) {
  const needle = search.trim().toLowerCase();
  const searched = needle ? records.filter((r) => matches(r, needle)) : records;

  const counts = { All: searched.length };
  for (const m of MAIN) counts[m] = 0;
  for (const r of searched) if (r.category in counts) counts[r.category]++;

  const filtered = tab && tab !== "All" ? searched.filter((r) => r.category === tab) : searched;
  const sorter = SORTERS[sortKey] || SORTERS.savedAt;
  const dir = sortDir === "asc" ? 1 : -1;
  const sorted = filtered
    .map((r, i) => [r, i])
    .sort((x, y) => dir * sorter(x[0], y[0]) || x[1] - y[1])
    .map(([r]) => r);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (p - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);
  const rangeText = total === 0 ? "0 of 0" : `${start + 1}–${start + rows.length} of ${total}`;
  return { rows, total, counts, page: p, pageCount, rangeText, all: sorted };
}
