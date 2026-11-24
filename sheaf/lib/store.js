import { SCHEMA_VERSION } from "./config.js";

const PAGE = "page:";
const META = "meta";
const clone = (v) => JSON.parse(JSON.stringify(v));

function metaDefaults() {
  return { schemaVersion: SCHEMA_VERSION, settings: { backup: true }, lastBackupAt: null, backups: [] };
}

export function createStore(area) {
  return {
    async get(key) {
      const r = (await area.get(PAGE + key))[PAGE + key];
      return r ? clone(r) : null;
    },
    async put(rec) {
      await area.set({ [PAGE + rec.key]: clone(rec) });
    },
    async putMany(recs) {
      if (!recs.length) return;
      const items = {};
      for (const r of recs) items[PAGE + r.key] = clone(r);
      await area.set(items);
    },
    async remove(keys) {
      await area.remove(keys.map((k) => PAGE + k));
    },
    async all() {
      const everything = await area.get(null);
      return Object.keys(everything)
        .filter((k) => k.startsWith(PAGE))
        .map((k) => clone(everything[k]));
    },
    async getMeta() {
      const stored = (await area.get(META))[META] || {};
      const d = metaDefaults();
      return clone({ ...d, ...stored, settings: { ...d.settings, ...(stored.settings || {}) } });
    },
    async setMeta(patch) {
      const cur = await this.getMeta();
      const next = { ...cur, ...patch };
      if (patch.settings) next.settings = { ...cur.settings, ...patch.settings };
      await area.set({ [META]: clone(next) });
    },
  };
}

// In-memory fake with the chrome.storage.local contract (promise-returning).
export function memoryArea() {
  const data = new Map();
  return {
    async get(keys) {
      const out = {};
      if (keys === null || keys === undefined) {
        for (const [k, v] of data) out[k] = clone(v);
        return out;
      }
      const list = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      for (const k of list) {
        if (data.has(k)) out[k] = clone(data.get(k));
        else if (keys && typeof keys === "object" && !Array.isArray(keys)) out[k] = keys[k];
      }
      return out;
    },
    async set(items) {
      for (const [k, v] of Object.entries(items)) data.set(k, clone(v));
    },
    async remove(keys) {
      for (const k of typeof keys === "string" ? [keys] : keys) data.delete(k);
    },
  };
}
