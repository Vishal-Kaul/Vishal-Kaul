import test from "node:test";
import assert from "node:assert/strict";
import { onTabUrl, onTabRemoved, seedState } from "../lib/visits.js";
import { newRecord } from "../lib/records.js";
import { createStore, memoryArea } from "../lib/store.js";

async function setup(urls) {
  const store = createStore(memoryArea());
  for (const url of urls) {
    await store.put(newRecord({ url, name: "N", category: "Blog", subcategory: "Design", categorySource: "rules" }, 100));
  }
  return store;
}

test("first URL in a tab for a saved key is counted", async () => {
  const store = await setup(["https://a.com/x"]);
  const r = await onTabUrl({}, 1, "https://a.com/x", 500, store);
  assert.equal(r.counted, true);
  assert.equal(r.state[1], "https://a.com/x");
  const rec = await store.get("https://a.com/x");
  assert.deepEqual([rec.visits, rec.lastVisitedAt, rec.updatedAt], [2, 500, 500]);
});

test("same key again (reload, hash change) is not counted", async () => {
  const store = await setup(["https://a.com/x"]);
  let r = await onTabUrl({}, 1, "https://a.com/x", 500, store);
  r = await onTabUrl(r.state, 1, "https://a.com/x", 600, store);
  assert.equal(r.counted, false);
  r = await onTabUrl(r.state, 1, "https://a.com/x#top", 700, store);
  assert.equal(r.counted, false);
  assert.equal((await store.get("https://a.com/x")).visits, 2);
});

test("A to B counted, then B to B?utm=x not counted", async () => {
  const store = await setup(["https://a.com/a", "https://a.com/b"]);
  let r = await onTabUrl({}, 1, "https://a.com/a", 500, store);
  r = await onTabUrl(r.state, 1, "https://a.com/b", 600, store);
  assert.equal(r.counted, true);
  r = await onTabUrl(r.state, 1, "https://a.com/b?utm_source=x", 700, store);
  assert.equal(r.counted, false);
  assert.equal((await store.get("https://a.com/b")).visits, 2);
});

test("unsaved URL is not counted and writes nothing", async () => {
  const store = await setup(["https://a.com/x"]);
  const before = await store.all();
  const r = await onTabUrl({}, 1, "https://other.com/", 500, store);
  assert.equal(r.counted, false);
  assert.deepEqual(await store.all(), before);
  const r2 = await onTabUrl(r.state, 1, "chrome://settings", 600, store);
  assert.equal(r2.counted, false);
  assert.equal(r2.state[1], null);
  assert.deepEqual(await store.all(), before);
});

test("redirect http://a.com to https://www.a.com/ counts once", async () => {
  const store = await setup(["https://a.com"]);
  let r = await onTabUrl({}, 1, "http://a.com", 500, store);
  r = await onTabUrl(r.state, 1, "https://www.a.com/", 501, store);
  assert.equal(r.counted, false);
  assert.equal((await store.get("https://a.com/")).visits, 2);
});

test("seedState prevents counting restored tabs", async () => {
  const store = await setup(["https://a.com"]);
  const state = seedState([{ id: 1, url: "https://a.com" }, { id: 2, url: "chrome://x" }]);
  assert.deepEqual(state, { 1: "https://a.com/", 2: null });
  const r = await onTabUrl(state, 1, "https://a.com", 500, store);
  assert.equal(r.counted, false);
  assert.equal((await store.get("https://a.com/")).visits, 1);
});

test("does not mutate input state; onTabRemoved drops the tab", async () => {
  const store = await setup(["https://a.com/x"]);
  const state = { 5: "https://z.com/" };
  const r = await onTabUrl(state, 1, "https://a.com/x", 500, store);
  assert.deepEqual(state, { 5: "https://z.com/" });
  const after = onTabRemoved(r.state, 1);
  assert.deepEqual(after, { 5: "https://z.com/" });
  assert.equal(1 in r.state, true);
});
