import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, responseSchema, parseAiResult } from "../lib/ai-prompt.js";
import { MAIN, SUBS } from "../lib/categories.js";

test("parseAiResult rejects invalid pairs", () => {
  assert.equal(parseAiResult({ category: "Blog", subcategory: "Fintech" }), null);
  assert.equal(parseAiResult("not json"), null);
  assert.equal(parseAiResult(null), null);
});

test("parseAiResult passes valid pairs (object or JSON string)", () => {
  const ok = { category: "Product", subcategory: "AI tool" };
  assert.deepEqual(parseAiResult(ok), ok);
  assert.deepEqual(parseAiResult(JSON.stringify(ok)), ok);
});

test("schema enums equal MAIN and union of SUBS", () => {
  const s = responseSchema();
  assert.deepEqual(s.properties.category.enum, MAIN);
  assert.deepEqual(s.properties.subcategory.enum, Object.values(SUBS).flat());
  assert.deepEqual(s.required, ["category", "subcategory"]);
});

test("buildPrompt includes signals and categories", () => {
  const p = buildPrompt({ url: "https://a.com/", title: "Acme", description: "Tools", headings: ["Hi"], text: "x".repeat(5000) });
  assert.match(p, /Acme/);
  assert.match(p, /Portfolio/);
  assert.ok(p.length < 4000);
});
