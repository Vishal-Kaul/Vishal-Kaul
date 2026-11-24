import test from "node:test";
import assert from "node:assert/strict";
import { mergeImport, normalizeIncoming, recordsFromCsv, recordsFromJson } from "../lib/merge.js";
import { toCsv, toJson } from "../lib/csv.js";
import { newRecord } from "../lib/records.js";

const mk = (url, over = {}, now = 1000) =>
  ({ ...newRecord({ url, name: "A", category: "Blog", subcategory: "Design", categorySource: "rules" }, now), ...over });

test("re-importing an identical export changes nothing", () => {
  const existing = [mk("https://a.com/x", { visits: 7 }), mk("https://b.com", { visits: 3 })];
  const csv = recordsFromCsv(toCsv(existing), 9999);
  const out = mergeImport(existing, csv, 9999);
  assert.equal(out.records.length, 2);
  assert.deepEqual(out.records.map((r) => r.visits).sort(), [3, 7]);
  assert.equal(out.added, 0);
  assert.equal(out.updated, 0);
  const json = recordsFromJson(toJson(existing, 5));
  const out2 = mergeImport(existing, json, 9999);
  assert.deepEqual([out2.added, out2.updated, out2.records.length], [0, 0, 2]);
});

test("visits max, earliest savedAt, latest lastVisitedAt", () => {
  const e = [mk("https://a.com", { visits: 2, savedAt: 500, lastVisitedAt: 900 })];
  const i = [mk("https://a.com", { visits: 5, savedAt: 800, lastVisitedAt: 700 })];
  const { records, updated } = mergeImport(e, i, 2000);
  assert.deepEqual([records[0].visits, records[0].savedAt, records[0].lastVisitedAt], [5, 500, 900]);
  assert.equal(updated, 1);
});

test("incoming user category overrides existing rules one; rules does not override", () => {
  const e = [mk("https://a.com")];
  const up = mergeImport(e, [mk("https://a.com", { category: "Product", subcategory: "Productivity", categorySource: "user" })], 5);
  assert.equal(up.records[0].category, "Product");
  assert.equal(up.records[0].categorySource, "user");
  const keep = mergeImport([up.records[0]], [mk("https://a.com", { category: "Other", subcategory: "Resource", categorySource: "rules" })], 6);
  assert.equal(keep.records[0].category, "Product");
});

test("new records are added; existing never deleted", () => {
  const out = mergeImport([mk("https://a.com")], [mk("https://b.com")], 5);
  assert.equal(out.added, 1);
  assert.equal(out.records.length, 2);
});

test("normalizeIncoming fills defaults and rejects unsaveable", () => {
  const r = normalizeIncoming({ url: "https://www.x.com/p/" }, 42);
  assert.equal(r.key, "https://x.com/p");
  assert.equal(r.visits, 1);
  assert.equal(r.savedAt, 42);
  assert.equal(r.categorySource, "rules");
  assert.ok(r.category && r.subcategory && r.name);
  assert.equal(normalizeIncoming({ url: "chrome://x" }, 1), null);
  const bad = normalizeIncoming({ url: "https://x.com", category: "Nope", subcategory: "Zip", categorySource: "user" }, 1);
  assert.notEqual(bad.category, "Nope");
});

test("foreign CSV uses detected URL column and rules category", () => {
  const recs = recordsFromCsv("Title,Link,Notes\nMy Site,https://a.com/,n\nNoUrl,,x\n", 100);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].name, "My Site");
  assert.equal(recs[0].key, "https://a.com/");
});
