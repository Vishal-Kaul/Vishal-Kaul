import test from "node:test";
import assert from "node:assert/strict";
import { launch, allRecords } from "./fixtures.mjs";

let env;
test.before(async () => {
  env = await launch();
});
test.after(async () => {
  await env.close();
});

import { readPage } from "../../content/read-page.js";

// activeTab is only granted by a real shortcut press, so run readPage in the page
// ourselves and hand the signals to the worker's test hook.
const saveWithSignals = async (page, worker) => {
  const signals = await page.evaluate(`(${readPage.toString()})()`);
  return worker.evaluate((s) => self.__sheaf.saveActive({ signals: s }), signals);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms = 5000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error("timeout");
    await sleep(50);
  }
}

test("shortcut flow saves the portfolio page as Portfolio and closes the tab", async () => {
  const { context, worker, serverUrl } = env;
  const page = await context.newPage();
  await page.goto(`${serverUrl}/portfolio.html`);
  await page.bringToFront();
  let closed = false;
  page.on("close", () => (closed = true));
  const result = await saveWithSignals(page, worker);
  assert.equal(result.status, "saved");
  await waitFor(() => closed);
  const recs = await allRecords(worker);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].category, "Portfolio");
});

test("visits are counted across same-tab navigation", async () => {
  const { context, worker, serverUrl } = env;
  const save = async (path) => {
    const p = await context.newPage();
    await p.goto(`${serverUrl}/${path}`);
    await p.bringToFront();
    await saveWithSignals(p, worker);
  };
  await save("blog.html"); // portfolio.html already saved by the previous test
  const visits = async (path) =>
    (await allRecords(worker)).find((r) => r.url === `${serverUrl}/${path}`)?.visits;
  assert.equal(await visits("portfolio.html"), 1);
  assert.equal(await visits("blog.html"), 1);

  const tab = await context.newPage();
  await tab.goto(`${serverUrl}/portfolio.html`);
  await waitFor(async () => (await visits("portfolio.html")) === 2);
  await tab.goto(`${serverUrl}/blog.html`);
  await waitFor(async () => (await visits("blog.html")) === 2);
  assert.equal(await visits("portfolio.html"), 2);
  await tab.goBack();
  await waitFor(async () => (await visits("portfolio.html")) === 3);
  assert.equal(await visits("blog.html"), 2);
});
