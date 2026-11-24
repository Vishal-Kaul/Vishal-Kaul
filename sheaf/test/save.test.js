import test from "node:test";
import assert from "node:assert/strict";
import { savePage } from "../lib/save.js";
import { createStore, memoryArea } from "../lib/store.js";

const sig = (url) => ({ url, title: "Hello", headings: [], description: "", siteName: "", text: "" });

test("new URL is saved with visits 1", async () => {
  const s = createStore(memoryArea());
  const r = await savePage(s, { url: "https://example.com/a", signals: sig("https://example.com/a") }, 1000);
  assert.equal(r.status, "saved");
  assert.equal(r.record.categorySource, "rules");
  const all = await s.all();
  assert.equal(all.length, 1);
  assert.equal(all[0].visits, 1);
});

test("same URL with different utm_ is exists, count stays 1", async () => {
  const s = createStore(memoryArea());
  await savePage(s, { url: "https://example.com/a", signals: null }, 1000);
  const r = await savePage(s, { url: "https://example.com/a?utm_source=x", signals: null }, 2000);
  assert.equal(r.status, "exists");
  assert.equal(r.record.key, "https://example.com/a");
  const all = await s.all();
  assert.equal(all.length, 1);
  assert.equal(all[0].visits, 1);
  assert.equal(all[0].updatedAt, 1000);
});

test("chrome://newtab is unsaveable and writes nothing", async () => {
  const s = createStore(memoryArea());
  const r = await savePage(s, { url: "chrome://newtab", signals: null }, 1000);
  assert.equal(r.status, "unsaveable");
  assert.equal((await s.all()).length, 0);
});

test("null signals gives Other · Resource and displayLink name", async () => {
  const s = createStore(memoryArea());
  const r = await savePage(s, { url: "https://www.example.com/a/", signals: null }, 1000);
  assert.equal(r.record.category, "Other");
  assert.equal(r.record.subcategory, "Resource");
  assert.equal(r.record.name, "example.com/a");
});
