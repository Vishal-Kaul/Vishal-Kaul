import test from "node:test";
import assert from "node:assert/strict";
import { newRecord, applyEdit } from "../lib/records.js";
import { createStore, memoryArea } from "../lib/store.js";

const mk = (url = "https://example.com/a", now = 1000) =>
  newRecord({ url, name: "A", category: "Blog", subcategory: "Design", categorySource: "rules" }, now);

test("put then get returns an equal record, as a copy", async () => {
  const s = createStore(memoryArea());
  const r = mk();
  await s.put(r);
  const got = await s.get(r.key);
  assert.deepEqual(got, r);
  got.name = "mutated";
  assert.equal((await s.get(r.key)).name, "A");
  assert.equal(await s.get("nope"), null);
});

test("newRecord shape", () => {
  const r = mk();
  assert.equal(r.visits, 1);
  assert.deepEqual([r.savedAt, r.lastVisitedAt, r.updatedAt], [1000, 1000, 1000]);
  assert.equal(r.key, "https://example.com/a");
});

test("all() returns only page: entries", async () => {
  const area = memoryArea();
  const s = createStore(area);
  await s.put(mk("https://example.com/a"));
  await s.put(mk("https://example.com/b"));
  await s.setMeta({ lastBackupAt: 5 });
  await area.set({ other: 1 });
  assert.equal((await s.all()).length, 2);
});

test("remove deletes several keys", async () => {
  const s = createStore(memoryArea());
  const a = mk("https://example.com/a"), b = mk("https://example.com/b"), c = mk("https://example.com/c");
  for (const r of [a, b, c]) await s.put(r);
  await s.remove([a.key, b.key]);
  assert.deepEqual((await s.all()).map((r) => r.key), [c.key]);
});

test("getMeta defaults and merge", async () => {
  const s = createStore(memoryArea());
  assert.deepEqual(await s.getMeta(), { schemaVersion: 1, settings: { backup: true }, lastBackupAt: null, backups: [] });
  await s.setMeta({ lastBackupAt: 9, backups: [9] });
  assert.deepEqual(await s.getMeta(), { schemaVersion: 1, settings: { backup: true }, lastBackupAt: 9, backups: [9] });
  await s.setMeta({ settings: { backup: false } });
  assert.equal((await s.getMeta()).settings.backup, false);
});

test("memoryArea mimics chrome.storage.local get contract", async () => {
  const a = memoryArea();
  await a.set({ x: 1, y: 2 });
  assert.deepEqual(await a.get(null), { x: 1, y: 2 });
  assert.deepEqual(await a.get("x"), { x: 1 });
  assert.deepEqual(await a.get(["x", "z"]), { x: 1 });
  await a.remove("x");
  assert.deepEqual(await a.get(null), { y: 2 });
});

test("applyEdit category change sets source user", () => {
  const r = mk();
  const e = applyEdit(r, { category: "Product", subcategory: "Dev tool" }, 2000);
  assert.equal(e.categorySource, "user");
  assert.equal(e.updatedAt, 2000);
  assert.equal(r.categorySource, "rules");
  const n = applyEdit(r, { name: "B" }, 3000);
  assert.equal(n.categorySource, "rules");
  assert.equal(n.name, "B");
  assert.equal(n.updatedAt, 3000);
});
