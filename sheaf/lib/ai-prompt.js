import { MAIN, SUBS, isValid } from "./categories.js";

const clip = (s, n) => String(s || "").slice(0, n);

export function buildPrompt(signals) {
  const s = signals || {};
  const cats = MAIN.map((m) => `${m}: ${SUBS[m].join(", ")}`).join("\n");
  return [
    "Classify this web page into exactly one category and subcategory from this list.",
    cats,
    "",
    `URL: ${clip(s.url, 200)}`,
    `Title: ${clip(s.title, 200)}`,
    `Site: ${clip(s.siteName, 100)}`,
    `Description: ${clip(s.description, 400)}`,
    `Headings: ${(s.headings || []).slice(0, 10).map((h) => clip(h, 100)).join(" | ")}`,
    `Text: ${clip(s.text, 1200)}`,
  ].join("\n");
}

export function responseSchema() {
  return {
    type: "object",
    properties: {
      category: { type: "string", enum: [...MAIN] },
      subcategory: { type: "string", enum: Object.values(SUBS).flat() },
    },
    required: ["category", "subcategory"],
  };
}

export function parseAiResult(json) {
  try {
    const o = typeof json === "string" ? JSON.parse(json) : json;
    if (!o || !isValid(o.category, o.subcategory)) return null;
    return { category: o.category, subcategory: o.subcategory };
  } catch {
    return null;
  }
}
