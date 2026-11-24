import test from "node:test";
import assert from "node:assert/strict";
import { launch } from "./fixtures.mjs";

const N = 20000;
let env;
test.before(async () => {
  env = await launch();
});
test.after(async () => {
  await env.close();
});

test("20,000 records: first paint, search and paging stay quick", async () => {
  const { context, worker, extensionId } = env;
  await worker.evaluate(async (n) => {
    const t = Date.now();
    const recs = [];
    for (let i = 0; i < n; i++) {
      recs.push(self.__sheaf.newRecord({
        url: `https://site${i}.example.com/page`,
        name: i % 40 === 0 ? `Linear clone ${i}` : `Site number ${i}`,
        category: "Product", subcategory: "Productivity", categorySource: "rules",
      }, t - i * 1000));
    }
    await self.__sheaf.store.putMany(recs);
  }, N);

  const page = await context.newPage();
  const t0 = Date.now();
  await page.goto(`chrome-extension://${extensionId}/library/library.html`);
  await page.waitForSelector(".row.body");
  const firstPaint = Date.now() - t0;
  await page.waitForSelector("[data-ready]");
  assert.equal(await page.locator(".row.body").count(), 50);
  assert.equal(await page.locator("#range").innerText(), `1–50 of ${N}`);
  console.log(`first rows: ${firstPaint} ms`);
  assert.ok(firstPaint < 1500, `first rows took ${firstPaint} ms`);

  const t1 = Date.now();
  await page.locator("#search").fill("linear");
  await page.waitForFunction(() => document.getElementById("range").textContent === "1–50 of 500");
  const searchMs = Date.now() - t1;
  console.log(`search: ${searchMs} ms`);
  assert.ok(searchMs < 300, `search took ${searchMs} ms`);

  await page.locator("#search").fill("");
  await page.waitForFunction((n) => document.getElementById("range").textContent === `1–50 of ${n}`, N);
  const t2 = Date.now();
  await page.locator("#next").click();
  await page.waitForFunction((n) => document.getElementById("range").textContent === `51–100 of ${n}`, N);
  const pageMs = Date.now() - t2;
  console.log(`next page: ${pageMs} ms`);
  assert.ok(pageMs < 200, `next page took ${pageMs} ms`);
});
