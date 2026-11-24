import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyWithTimeout } from "../background/ai-bridge.js";

test("hung prompt: aborted, session destroyed after timeout, resolves null", async () => {
  let destroyed = 0, aborted = false;
  const LM = {
    async create({ signal }) {
      return {
        prompt: (_t, { signal: s }) => new Promise(() => s.addEventListener("abort", () => { aborted = true; })),
        destroy() { destroyed++; },
      };
    },
  };
  const r = await classifyWithTimeout(LM, { title: "x" }, 30);
  assert.equal(r, null);
  assert.ok(destroyed >= 1);
  assert.ok(aborted);
});

test("success returns parsed result and destroys session", async () => {
  let destroyed = 0;
  const LM = {
    async create() {
      return { prompt: async () => '{"category":"Product","subcategory":"AI tool"}', destroy() { destroyed++; } };
    },
  };
  assert.deepEqual(await classifyWithTimeout(LM, {}, 1000), { category: "Product", subcategory: "AI tool" });
  assert.equal(destroyed, 1);
});

test("throwing create resolves null", async () => {
  assert.equal(await classifyWithTimeout({ create: async () => { throw new Error("x"); } }, {}, 1000), null);
});
