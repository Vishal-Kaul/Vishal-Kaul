const BLOCKED_PROTOCOLS = new Set([
  "chrome:", "chrome-extension:", "chrome-untrusted:", "edge:", "about:", "data:",
  "javascript:", "view-source:", "file:", "devtools:", "blob:",
]);
const BLOCKED_HOSTS = ["chromewebstore.google.com"];
const TRACKING = new Set([
  "ref", "ref_src", "si", "gclid", "fbclid", "mc_cid", "mc_eid", "igshid", "_hsenc", "_hsmi",
]);

function parse(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  let u;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (BLOCKED_PROTOCOLS.has(u.protocol)) return null;
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(host)) return null;
  if (host === "chrome.google.com" && u.pathname.startsWith("/webstore")) return null;
  return u;
}

export function isSaveable(url) {
  return parse(url) !== null;
}

export function normalizeUrl(url) {
  const u = parse(url);
  if (!u) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const kept = [];
  for (const [k, v] of u.searchParams) {
    const key = k.toLowerCase();
    if (key.startsWith("utm_") || TRACKING.has(key)) continue;
    kept.push([k, v]);
  }
  kept.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  const search = new URLSearchParams(kept).toString();
  let path = u.pathname;
  if (path.length > 1) path = path.replace(/\/+$/, "") || "/";
  const port = u.port && u.port !== "80" && u.port !== "443" ? `:${u.port}` : "";
  return `https://${host}${port}${path}${search ? `?${search}` : ""}`;
}

export function displayLink(url) {
  const n = normalizeUrl(url);
  if (!n) return String(url);
  const u = new URL(n);
  const path = u.pathname === "/" ? "" : u.pathname;
  return `${u.host}${path}${u.search}`;
}
