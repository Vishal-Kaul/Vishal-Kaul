// Injected into the page via chrome.scripting.executeScript({ func: readPage }).
// Must be fully self-contained: no imports, no closures over module scope.
export function readPage() {
  const meta = (sel) => {
    const el = document.querySelector(sel);
    return (el && el.getAttribute("content")) || "";
  };
  const ldTypes = [];
  const collect = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(collect);
    const t = node["@type"];
    if (typeof t === "string") ldTypes.push(t);
    else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && ldTypes.push(x));
    if (node["@graph"]) collect(node["@graph"]);
  };
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      collect(JSON.parse(s.textContent));
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  const headings = Array.from(document.querySelectorAll("h1, h2"))
    .map((h) => (h.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 10);
  const text = ((document.body && document.body.innerText) || "").replace(/\s+/g, " ").trim().slice(0, 2000);
  return {
    url: location.href,
    title: document.title || "",
    description: meta('meta[name="description"]') || meta('meta[property="og:description"]'),
    siteName: meta('meta[property="og:site_name"]'),
    ogType: meta('meta[property="og:type"]'),
    ldTypes: Array.from(new Set(ldTypes)),
    headings,
    text,
    hasRss: !!document.querySelector('link[rel="alternate"][type*="rss"], link[rel="alternate"][type*="atom"]'),
  };
}
