import test from "node:test";
import assert from "node:assert/strict";
import { MAIN, SUBS, DEFAULT_SUB, isValid, label } from "../lib/categories.js";
import { PRODUCT_NAME, PAGE_SIZE, SCHEMA_VERSION } from "../lib/config.js";

test("categories", () => {
  assert.deepEqual(MAIN, ["Portfolio", "Blog", "Product", "Service", "Other"]);
  assert.equal(SUBS.Product.length, 12);
  assert.equal(isValid("Blog", "Fintech"), false);
  assert.equal(isValid("Product", "Fintech"), true);
  assert.equal(label("Product", "Design tool"), "Product · Design tool");
  for (const m of MAIN) assert.ok(SUBS[m].includes(DEFAULT_SUB[m]), m);
});

test("config", () => {
  assert.equal(PRODUCT_NAME, "Sheaf");
  assert.equal(PAGE_SIZE, 50);
  assert.equal(SCHEMA_VERSION, 1);
});
