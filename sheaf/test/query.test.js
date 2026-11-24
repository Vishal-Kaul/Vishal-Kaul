import test from "node:test";
import assert from "node:assert/strict";
import { runQuery } from "../lib/query.js";
import { createSelection } from "../library/selection.js";

const mk = (i, over = {}) => ({
  key: `https://s${i}.com`, url: `https://s${i}.com/`, name: `Site ${i}`,
  category: "Product", subcategory: "Design tool", visits: i, savedAt: 1000 + i, ...over,
});
const many = Array.from({ length: 120 }, (_, i) => mk(i + 1));

test("page 2 of 120 is rows 51-100", () => {
  const r = runQuery(many, { page: 2 });
  assert.equal(r.rows.length, 50);
  assert.equal(r.rangeText, "51–100 of 120");
  assert.equal(r.pageCount, 3);
  assert.equal(r.page, 2);
});
test("empty gives 0 of 0", () => {
  const r = runQuery([], {});
  assert.equal(r.rangeText, "0 of 0");
  assert.equal(r.rows.length, 0);
});
test("search finds both NN/g rows (name, link, label), case-insensitive", () => {
  const recs = [
    mk(1, { name: "NN/g", url: "https://www.nngroup.com/articles/" , key: "a" }),
    mk(2, { name: "Nielsen Norman Group", url: "https://nngroup.com/", key: "b" }),
    mk(3, { name: "Other" }),
  ];
  assert.equal(runQuery(recs, { search: "NNGROUP" }).total, 2);
  assert.equal(runQuery(recs, { search: "design tool" }).total, 3);
  assert.equal(runQuery(recs, { search: "product · design" }).total, 3);
});
test("tab filters by category, counts.All is the full count", () => {
  const recs = many.map((r, i) => (i < 7 ? { ...r, category: "Blog", subcategory: "Design" } : r));
  const r = runQuery(recs, { tab: "Blog" });
  assert.equal(r.total, 7);
  assert.equal(r.counts.All, 120);
  assert.equal(r.counts.Blog, 7);
  assert.equal(r.counts.Product, 113);
  assert.equal(r.counts.Other, 0);
});
test("search narrows counts too", () => {
  const r = runQuery(many, { search: "Site 12" });
  assert.equal(r.counts.All, r.total);
});
test("default sort is savedAt desc; visits desc puts largest first", () => {
  assert.equal(runQuery(many, {}).rows[0].name, "Site 120");
  const r = runQuery(many, { sortKey: "visits", sortDir: "desc" });
  assert.equal(r.rows[0].visits, 120);
  assert.equal(runQuery(many, { sortKey: "visits", sortDir: "asc" }).rows[0].visits, 1);
  assert.equal(runQuery(many, { sortKey: "name", sortDir: "asc" }).rows[0].name, "Site 1");
});
test("page is clamped", () => {
  assert.equal(runQuery(many, { page: 99 }).page, 3);
  assert.equal(runQuery(many, { page: 0 }).page, 1);
});

test("selection.range selects the inclusive span", () => {
  const s = createSelection();
  const keys = ["a", "b", "c", "d", "e"];
  s.range("d", "b", keys);
  assert.deepEqual(s.keys().sort(), ["b", "c", "d"]);
  assert.equal(s.size, 3);
});
test("toggle and has", () => {
  const s = createSelection();
  s.toggle("a");
  assert.ok(s.has("a"));
  s.toggle("a");
  assert.ok(!s.has("a"));
});
test("headerState goes none -> some -> page -> all", () => {
  const s = createSelection();
  const page = ["a", "b"];
  const all = ["a", "b", "c", "d"];
  assert.equal(s.headerState(page), "none");
  s.toggle("a");
  assert.equal(s.headerState(page), "some");
  s.selectPage(page);
  assert.equal(s.headerState(page), "page");
  s.selectAll(all);
  assert.equal(s.headerState(page), "all");
  s.clear();
  assert.equal(s.headerState(page), "none");
  assert.equal(s.size, 0);
});
