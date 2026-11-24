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

// `LM` is injectable for tests. Resolves to a result or null; never throws.
// On timeout the in-flight create()/prompt() is aborted and the session destroyed.
export async function classifyWithTimeout(LM, signals, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const { signal } = controller;
  let session = null;
  let timer;
  const destroy = () => {
    try { session?.destroy(); } catch { /* ignore */ }
  };
  const work = (async () => {
    session = await LM.create({
      signal,
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });
    if (signal.aborted) return null;
    const out = await session.prompt(buildPrompt(signals), { responseConstraint: responseSchema(), signal });
    return parseAiResult(out);
  })();
  work.catch(() => {});
  const timeout = new Promise((res) => {
    timer = setTimeout(() => {
      try { controller.abort(); } catch { /* ignore */ }
      destroy();
      res(null);
    }, timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    destroy();
  }
}

// deps: { store, serial } from the service worker. Never throws.
export async function refineWithAi(key, signals, { store, serial }) {
  try {
    if (!signals || (await aiAvailability()) !== "available") return;
    const result = await classifyWithTimeout(LanguageModel, signals);
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
