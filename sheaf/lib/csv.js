import { isSaveable } from "./url-key.js";

export const CSV_HEADER = "name,url,category,subcategory,visits,saved_at";

function cell(v) {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(records) {
  const lines = [CSV_HEADER];
  for (const r of records) {
    lines.push([r.name, r.url, r.category, r.subcategory, r.visits, new Date(r.savedAt).toISOString()].map(cell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

export function toJson(records, now) {
  return JSON.stringify({ schemaVersion: 1, exportedAt: new Date(now).toISOString(), records }, null, 2);
}

// RFC 4180: quoted fields may hold commas, quotes ("") and newlines.
export function parseCsv(text) {
  const src = String(text).replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let any = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; any = true; }
    else if (c === ",") { row.push(field); field = ""; any = true; }
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      if (any || field) { row.push(field); rows.push(row); }
      row = []; field = ""; any = false;
    } else { field += c; any = true; }
  }
  if (any || field) { row.push(field); rows.push(row); }
  return rows;
}

export function detectUrlColumn(rows) {
  const counts = [];
  for (const row of rows) {
    row.forEach((c, i) => {
      if (isSaveable(c)) counts[i] = (counts[i] || 0) + 1;
    });
  }
  let best = -1;
  let max = 0;
  counts.forEach((n, i) => { if (n > max) { max = n; best = i; } });
  return best;
}
