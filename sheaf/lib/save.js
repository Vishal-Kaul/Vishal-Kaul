import { isSaveable, normalizeUrl, displayLink } from "./url-key.js";
import { newRecord } from "./records.js";
import { categorizeByRules, cleanName } from "./categorize.js";
import { DEFAULT_SUB } from "./categories.js";

export async function savePage(store, { url, signals = null }, now) {
  if (!isSaveable(url)) return { status: "unsaveable" };
  const existing = await store.get(normalizeUrl(url));
  if (existing) return { status: "exists", record: existing };
  const { category, subcategory } = signals
    ? categorizeByRules(signals)
    : { category: "Other", subcategory: DEFAULT_SUB.Other };
  const record = newRecord(
    {
      url,
      name: signals ? cleanName(signals) : displayLink(url),
      category,
      subcategory,
      categorySource: "rules",
    },
    now,
  );
  await store.put(record);
  return { status: "saved", record };
}
