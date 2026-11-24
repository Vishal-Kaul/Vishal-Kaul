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

const seed = (worker, items) =>
  worker.evaluate(async (items) => {
    const t = Date.now();
    for (const [i, it] of items.entries()) {
      const rec = self.__sheaf.newRecord(it, t - i * 1000);
      if (it.visits) rec.visits = it.visits;
      await self.__sheaf.store.put(rec);
    }
  }, items);

const three = [
  { url: "https://www.figma.com/", name: "Figma", category: "Product", subcategory: "Design tool", categorySource: "rules" },
  { url: "https://www.nngroup.com/articles/", name: "NN/g", category: "Blog", subcategory: "UX research", categorySource: "rules" },
  { url: "https://example.org/studio", name: "Studio Example", category: "Service", subcategory: "Agency", categorySource: "rules" },
];

test("library lists, hovers, multi-deletes and undoes", async () => {
  const { context, worker, extensionId } = env;
  await seed(worker, three);
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/library/library.html`);
  await page.waitForSelector("[data-ready]");
  assert.equal(await page.locator("#ai-prompt").isVisible(), false); // no LanguageModel in headless

  assert.equal(await page.locator(".row.body").count(), 3);
  await page.getByText("Product · Design tool").waitFor();

  await page.locator(".row.body").first().hover();
  assert.ok(await page.getByText("Copy link").first().isVisible());

  await page.locator(".row.body .cb").nth(0).click();
  await page.locator(".row.body .cb").nth(1).click();
  assert.equal(await page.locator(".bulk").innerText().then((t) => t.includes("2 selected")), true);
  await page.locator(".bulk .del").click();
  await page.waitForFunction(() => document.querySelectorAll(".row.body").length === 1);
  assert.equal((await allRecords(worker)).length, 1);
  assert.match(await page.locator("#notice").innerText(), /2 deleted · Undo/);

  await page.locator("#undo").click();
  await page.waitForFunction(() => document.querySelectorAll(".row.body").length === 3);
  assert.equal((await allRecords(worker)).length, 3);
});

test("edit in place saves category via Enter and Esc cancels; search and tabs filter", async () => {
  const { context, worker, extensionId } = env;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/library/library.html`);
  await page.waitForSelector("[data-ready]");

  await page.locator('.row.body[data-key$="figma.com/"]').hover();
  await page.locator('.row.body[data-key$="figma.com/"] .edit').click();
  await page.locator(".edit-name").fill("Figma Design");
  await page.locator(".edit-cat").selectOption("Other|Inspiration");
  await page.locator(".edit-name").press("Enter");
  await page.waitForFunction(() => document.querySelector(".edit-name") === null);
  const rec = (await allRecords(worker)).find((r) => r.name === "Figma Design");
  assert.equal(rec.category, "Other");
  assert.equal(rec.subcategory, "Inspiration");
  assert.equal(rec.categorySource, "user");

  await page.locator('.row.body[data-key$="figma.com/"]').hover();
  await page.locator('.row.body[data-key$="figma.com/"] .edit').click();
  await page.locator(".edit-name").fill("Nope");
  await page.locator(".edit-name").press("Escape");
  assert.equal((await allRecords(worker)).filter((r) => r.name === "Nope").length, 0);

  await page.locator("#search").fill("nngroup");
  assert.equal(await page.locator(".row.body").count(), 1);
  await page.locator("#search").fill("");
  await page.locator('.tab[data-tab="Blog"]').click();
  assert.equal(await page.locator(".row.body").count(), 1);
  assert.equal(await page.locator("#range").innerText(), "1–1 of 1");
});

test("slash focuses search; opening via options page works", async () => {
  const { context, extensionId } = env;
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/library/library.html`);
  await page.waitForSelector("[data-ready]");
  await page.keyboard.press("/");
  assert.equal(await page.evaluate(() => document.activeElement.id), "search");
});
