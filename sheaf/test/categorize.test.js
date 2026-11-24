import test from "node:test";
import assert from "node:assert/strict";
import { categorizeByRules, categorizeUrlOnly, cleanName } from "../lib/categorize.js";
import { isValid } from "../lib/categories.js";

const is = (signals, category, subcategory) => {
  const r = categorizeByRules(signals);
  assert.deepEqual(r, { category, subcategory });
  assert.ok(isValid(r.category, r.subcategory));
};

test("Person JSON-LD with selected work -> Portfolio · Designer", () => {
  is({ url: "https://jane.design/", ldTypes: ["Person"], text: "Selected work 2024" }, "Portfolio", "Designer");
});

test("3D, three.js, portfolio -> Portfolio · 3D artist", () => {
  is({ url: "https://x.com/", text: "3D three.js portfolio" }, "Portfolio", "3D artist");
});

test("BlogPosting on /articles/x about usability -> Blog · UX research", () => {
  is({
    url: "https://x.com/articles/x", ldTypes: ["BlogPosting"],
    text: "usability testing and user research",
  }, "Blog", "UX research");
});

test("pricing, sign up, design, prototype -> Product · Design tool", () => {
  is({ url: "https://x.com/", text: "pricing sign up design prototype" }, "Product", "Design tool");
});

test("pricing, payments, API -> Product · Fintech", () => {
  is({ url: "https://x.com/", text: "pricing payments API" }, "Product", "Fintech");
});

test("services, our clients, book a call -> Service · Agency", () => {
  is({ url: "https://x.com/", text: "services our clients book a call" }, "Service", "Agency");
});

test("inspiration, curated, gallery -> Other · Inspiration", () => {
  is({ url: "https://x.com/", text: "inspiration curated gallery" }, "Other", "Inspiration");
});

test("empty / missing signals -> Other · Resource", () => {
  is({}, "Other", "Resource");
  is({ url: "https://x.com/" }, "Other", "Resource");
  is(undefined, "Other", "Resource");
});

test("matches whole words only", () => {
  is({ text: "email emails mail" }, "Other", "Resource");
  is({ text: "AI agents and GPT apps with pricing" }, "Product", "AI tool");
});

test("UI reference, docs and engineering blog", () => {
  is({ text: "screens patterns ui kit inspiration" }, "Other", "UI reference");
  is({ url: "https://x.com/docs/start", text: "API reference documentation" }, "Other", "Docs");
  is({ url: "https://x.com/blog/p", ogType: "article", text: "react javascript engineering" }, "Blog", "Engineering");
});

test("categorizeUrlOnly uses host and path words", () => {
  const r = categorizeUrlOnly("https://docs.example.com/docs/api-reference");
  assert.deepEqual(r, { category: "Other", subcategory: "Docs" });
  assert.deepEqual(categorizeUrlOnly("https://a.com/"), { category: "Other", subcategory: "Resource" });
  assert.deepEqual(categorizeUrlOnly("not a url"), { category: "Other", subcategory: "Resource" });
  const b = categorizeUrlOnly("https://a.com/blog/ux-research-methods");
  assert.equal(b.category, "Blog");
});

test("cleanName", () => {
  assert.equal(
    cleanName({ title: "Card Sorting: Definition - NN/G", siteName: "NN/G", url: "https://nngroup.com/articles/x" }),
    "Card Sorting: Definition",
  );
  assert.equal(cleanName({ siteName: "Linear", url: "https://linear.app/" }), "Linear");
  assert.equal(cleanName({ url: "https://a.com/x" }), "a.com");
  assert.equal(cleanName({ title: "Hello | a.com", url: "https://www.a.com/x" }), "Hello");
  assert.equal(cleanName({ title: "Hello – Other Co", siteName: "Site", url: "https://a.com/x" }), "Hello – Other Co");
});
