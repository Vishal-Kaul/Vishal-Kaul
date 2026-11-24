import { buildPrompt, responseSchema, parseAiResult } from "../lib/ai-prompt.js";

const TIMEOUT_MS = 8000;
const has = () => typeof LanguageModel !== "undefined";

export async function aiAvailability() {
  try {
    if (!has()) return "unavailable";
    const a = await LanguageModel.availability();
    if (a === "available") return "available";
    if (a === "downloadable" || a === "downloading") return "downloadable";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

async function classify(signals) {
  const session = await LanguageModel.create();
  try {
    const out = await session.prompt(buildPrompt(signals), { responseConstraint: responseSchema() });
    return parseAiResult(out);
  } finally {
    try { session.destroy(); } catch { /* ignore */ }
  }
}

// deps: { store, serial } from the service worker. Never throws.
export async function refineWithAi(key, signals, { store, serial }) {
  try {
    if (!signals || (await aiAvailability()) !== "available") return;
    let timer;
    const result = await Promise.race([
      classify(signals),
      new Promise((res) => { timer = setTimeout(() => res(null), TIMEOUT_MS); }),
    ]).finally(() => clearTimeout(timer));
    if (!result) return;
    await serial(async () => {
      const rec = await store.get(key);
      if (!rec || rec.categorySource !== "rules") return;
      await store.put({ ...rec, ...result, categorySource: "ai", updatedAt: Date.now() });
    });
  } catch {
    // silent: keep the rules result
  }
}
