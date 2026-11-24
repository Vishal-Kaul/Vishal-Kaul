import { normalizeUrl } from "./url-key.js";
import { isValid } from "./categories.js";

export function newRecord({ url, name, category, subcategory, categorySource }, now) {
  return {
    key: normalizeUrl(url),
    url,
    name,
    category,
    subcategory,
    categorySource,
    visits: 1,
    savedAt: now,
    lastVisitedAt: now,
    updatedAt: now,
  };
}

export function applyEdit(rec, { name, category, subcategory } = {}, now) {
  const out = { ...rec, updatedAt: now };
  if (name !== undefined) out.name = name;
  const nextCat = category !== undefined ? category : rec.category;
  const nextSub = subcategory !== undefined ? subcategory : rec.subcategory;
  if (category !== undefined || subcategory !== undefined) {
    if (!isValid(nextCat, nextSub)) throw new Error(`Invalid category: ${nextCat} · ${nextSub}`);
    if (nextCat !== rec.category || nextSub !== rec.subcategory) out.categorySource = "user";
    out.category = nextCat;
    out.subcategory = nextSub;
  }
  return out;
}
