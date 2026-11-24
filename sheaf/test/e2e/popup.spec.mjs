import test from "node:test";
import assert from "node:assert/strict";
import { launch } from "./fixtures.mjs";

let env;
test.before(async () => {
  env = await launch();
});
test.after(async () => {
  await env.close();
});

const tabIdFor = (worker, url) =>
  worker.evaluate(async (u) => (await chrome.tabs.query({})).find((t) => t.url === u)?.id, url);
const openPopup = async (tabId) => {
  const p = await env.context.newPage();
  await p.goto(`chrome-extension://${env.extensionId}/popup/popup.html?tab=${tabId}`);
  await p.waitForSelector("[data-ready]");
  return p;
};

test("not-saved page shows title, domain, save button, hint and library link", async () => {
  const { context, worker, serverUrl } = env;
  const page = await context.newPage();
  const url = `${serverUrl}/portfolio.html`;
  await page.goto(url);
  const popup = await openPopup(await tabIdFor(worker, url));
  assert.equal(await popup.innerText("#title"), await page.title());
  assert.equal(await popup.innerText("#meta"), "127.0.0.1:" + new URL(serverUrl).port);
  assert.equal(await popup.innerText("#primary-label"), "Save & close tab");
  assert.equal(await popup.innerText("#hint"), "Alt+Shift+S");
  assert.equal(await popup.innerText("#library"), "Open library ↗");
  assert.equal(await popup.evaluate(() => document.body.getBoundingClientRect().width), 300);
});

test("saved page shows Saved · 1 visit, singular, and a Close tab button", async () => {
  const { context, worker, serverUrl } = env;
  const page = await context.newPage();
  const url = `${serverUrl}/blog.html`;
  await page.goto(url);
  const tabId = await tabIdFor(worker, url);
  await worker.evaluate(async (u) => {
    const rec = self.__sheaf.newRecord({ url: u, name: "Blog", category: "Blog", subcategory: "Design", categorySource: "rules" }, Date.now());
    rec.visits = 1;
    await self.__sheaf.store.put(rec);
  }, url);
  let popup = await openPopup(tabId);
  assert.equal(await popup.innerText("#meta"), `127.0.0.1:${new URL(serverUrl).port} · Saved · 1 visit`);
  assert.equal(await popup.innerText("#primary-label"), "Close tab");
  assert.equal(await popup.locator("#hint").count(), 0);
  await popup.close();
  await worker.evaluate(async (u) => {
    const all = await self.__sheaf.store.all();
    const r = all.find((x) => x.url === u);
    await self.__sheaf.store.put({ ...r, visits: 3 });
  }, url);
  popup = await openPopup(tabId);
  assert.match(await popup.innerText("#meta"), /· Saved · 3 visits$/);
});

test("unsaveable page shows message and only the library link", async () => {
  const { context, worker } = env;
  const page = await context.newPage();
  await page.goto("chrome://version");
  const tabId = await tabIdFor(worker, "chrome://version/");
  const popup = await openPopup(tabId);
  assert.equal(await popup.innerText("#meta"), "This page can't be saved");
  assert.equal(await popup.locator("#primary").count(), 0);
  assert.equal(await popup.innerText("#library"), "Open library ↗");
});
