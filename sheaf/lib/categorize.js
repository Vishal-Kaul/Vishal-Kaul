import { MAIN, SUBS, DEFAULT_SUB } from "./categories.js";

// ---------------------------------------------------------------------------
// Keyword data. Plain objects: add words freely. Format is [phrase, weight].
// Matching is case-insensitive, whole-word/phrase (plural "s" also accepted).
// ---------------------------------------------------------------------------

export const MAIN_KEYWORDS = {
  Portfolio: [
    ["portfolio", 3], ["selected work", 3], ["selected projects", 3], ["case study", 1.5],
    ["case studies", 1.5], ["my work", 2], ["my projects", 2], ["featured work", 2],
    ["available for hire", 2], ["available for freelance", 2], ["hire me", 2],
    ["i am a", 1], ["i'm a", 1], ["designer based in", 2], ["developer based in", 2],
    ["resume", 1], ["cv", 1], ["freelance", 1],
  ],
  Blog: [
    ["blog", 2], ["article", 1.5], ["posted", 1], ["published", 1], ["min read", 2],
    ["minute read", 2], ["read more", 1], ["newsletter", 1], ["subscribe", 0.5],
    ["essay", 2], ["posts", 1], ["written by", 1.5], ["by the author", 1], ["tutorial", 1.5],
    ["how to", 1], ["lessons", 1], ["thoughts", 1], ["journal", 1],
  ],
  Product: [
    ["pricing", 2], ["sign up", 2], ["sign in", 1], ["log in", 1], ["get started", 2],
    ["free trial", 2.5], ["start free", 2], ["try for free", 2], ["download", 1],
    ["features", 1], ["integrations", 1.5], ["platform", 1], ["app", 0.5], ["saas", 2],
    ["demo", 1], ["request a demo", 2], ["per month", 1.5], ["per user", 1.5],
    ["workspace", 1], ["for teams", 1.5], ["enterprise", 1], ["customers", 0.5],
  ],
  Service: [
    ["services", 1.5], ["our services", 2.5], ["our clients", 3], ["book a call", 3],
    ["book a consultation", 3], ["schedule a call", 2.5], ["we help", 2], ["we design", 2],
    ["we build", 2], ["we partner", 2], ["our team", 1.5], ["our work", 1.5], ["agency", 2.5],
    ["studio", 1], ["consultancy", 2.5], ["consulting", 2], ["consultant", 2],
    ["free consultation", 2.5], ["get a quote", 2.5], ["hire us", 3], ["contact us", 1],
    ["let's talk", 1.5], ["lets talk", 1.5], ["work with us", 2.5],
  ],
  Other: [
    ["inspiration", 3], ["curated", 2], ["gallery", 2], ["showcase", 2], ["collection", 1],
    ["screens", 1.5], ["patterns", 1.5], ["ui kit", 2], ["design system", 1], ["examples", 1],
    ["documentation", 3], ["docs", 3], ["api reference", 3], ["reference", 1], ["guide", 1],
    ["community", 2], ["forum", 2], ["discussion", 1.5], ["members", 1], ["news", 2],
    ["breaking", 1.5], ["headlines", 2], ["wiki", 2], ["directory", 1.5], ["resources", 1.5],
  ],
};

// Subcategory keywords by main category. Missing/zero score -> DEFAULT_SUB.
export const SUB_KEYWORDS = {
  Portfolio: {
    Designer: [["designer", 2], ["product design", 1.5], ["ux", 1.5], ["ui", 1], ["brand identity", 1.5], ["visual design", 1.5], ["figma", 1], ["selected work", 0.5]],
    Developer: [["developer", 2], ["engineer", 2], ["software", 1.5], ["full stack", 2], ["frontend", 2], ["front end", 2], ["backend", 1.5], ["github", 1.5], ["open source", 1.5], ["javascript", 1], ["typescript", 1]],
    "3D artist": [["3d", 3], ["three js", 3], ["blender", 3], ["cinema 4d", 3], ["c4d", 3], ["webgl", 2], ["render", 1.5], ["motion", 1], ["sculpt", 2], ["zbrush", 3], ["unreal", 1.5]],
    Illustrator: [["illustrator", 3], ["illustration", 3], ["illustrations", 3], ["drawing", 1.5], ["comics", 2], ["character design", 2], ["sketchbook", 2], ["procreate", 2]],
    Photographer: [["photographer", 3], ["photography", 3], ["photo", 1.5], ["photos", 1.5], ["wedding", 1.5], ["lens", 1], ["shoot", 1]],
    Studio: [["studio", 3], ["we are", 1.5], ["our studio", 2], ["collective", 2], ["creative studio", 2], ["design studio", 2]],
  },
  Blog: {
    Design: [["design", 1.5], ["typography", 2], ["visual design", 2], ["ui", 1], ["branding", 1.5], ["design system", 2], ["color", 1], ["layout", 1]],
    "UX research": [["ux research", 3], ["user research", 3], ["usability", 3], ["usability testing", 3], ["user testing", 2], ["interviews", 1], ["research", 1.5], ["personas", 2], ["card sorting", 3], ["heuristic", 2], ["information architecture", 2], ["ux", 1.5]],
    Engineering: [["engineering", 3], ["react", 2.5], ["javascript", 2.5], ["typescript", 2.5], ["css", 2], ["code", 1], ["software", 1.5], ["programming", 2.5], ["developer", 1.5], ["rust", 2], ["python", 2], ["performance", 1], ["architecture", 1]],
    AI: [["ai", 3], ["gpt", 3], ["llm", 3], ["llms", 3], ["machine learning", 3], ["agents", 2.5], ["prompt", 2], ["generative", 2.5], ["claude", 2], ["openai", 2], ["neural", 2]],
    Business: [["business", 2], ["startup", 2], ["startups", 2], ["founder", 2], ["growth", 1.5], ["marketing", 1.5], ["revenue", 2], ["strategy", 1.5], ["leadership", 1.5], ["management", 1.5], ["investing", 1.5]],
    Personal: [["my life", 2.5], ["personal", 2], ["i think", 1.5], ["i felt", 2], ["my year", 2.5], ["diary", 2.5], ["travel", 1.5], ["reflections", 2], ["notes to self", 2.5], ["i've been", 1.5]],
  },
  Product: {
    "Design tool": [["design", 1], ["prototype", 2], ["prototyping", 2], ["wireframe", 2], ["wireframes", 2], ["figma", 2], ["mockup", 2], ["design tool", 3], ["design system", 1.5], ["collaborate", 1], ["canvas", 1.5]],
    "Dev tool": [["developers", 2], ["developer", 1.5], ["api", 1], ["sdk", 2], ["cli", 2], ["deploy", 2], ["devops", 2.5], ["git", 1.5], ["open source", 1], ["code", 1], ["ci cd", 2], ["hosting", 1.5], ["database", 2]],
    "AI tool": [["ai", 3], ["gpt", 3], ["llm", 3], ["llms", 3], ["agents", 2.5], ["chatbot", 2.5], ["copilot", 2.5], ["generative", 2.5], ["machine learning", 2.5], ["ai powered", 3], ["prompts", 2]],
    Productivity: [["productivity", 3], ["tasks", 2], ["notes", 2], ["calendar", 2], ["project management", 3], ["to do", 2], ["workflow", 1.5], ["organize", 1.5], ["docs", 1], ["kanban", 2.5], ["issue tracking", 2.5]],
    Fintech: [["payments", 3], ["payment", 2.5], ["banking", 3], ["invoicing", 2.5], ["fintech", 3], ["cards", 1.5], ["billing", 2], ["checkout", 1.5], ["accounting", 2.5], ["payroll", 2.5], ["lending", 2], ["crypto", 2], ["trading", 2]],
    "E-commerce": [["e commerce", 3], ["ecommerce", 3], ["online store", 3], ["storefront", 3], ["shop", 1.5], ["merchants", 2.5], ["cart", 1.5], ["shipping", 1.5], ["dropshipping", 3]],
    Analytics: [["analytics", 3], ["dashboards", 2.5], ["dashboard", 2], ["metrics", 2], ["insights", 1.5], ["data", 1], ["tracking", 1.5], ["a b testing", 2.5], ["heatmaps", 3], ["session replay", 3]],
    Marketing: [["marketing", 2.5], ["seo", 3], ["email marketing", 3], ["campaigns", 2], ["social media", 2], ["leads", 2], ["crm", 2.5], ["landing pages", 2.5], ["newsletters", 2], ["advertising", 2]],
    Education: [["courses", 3], ["learn", 1.5], ["students", 2.5], ["teachers", 2.5], ["classroom", 2.5], ["lessons", 2], ["curriculum", 2.5], ["education", 2.5], ["tutoring", 2.5], ["language learning", 3]],
    Health: [["health", 2.5], ["fitness", 3], ["wellness", 3], ["meditation", 3], ["patients", 2.5], ["medical", 2.5], ["therapy", 3], ["workout", 3], ["sleep", 2], ["nutrition", 3]],
    Social: [["social network", 3], ["community", 1.5], ["friends", 2], ["followers", 2.5], ["chat", 1.5], ["messaging", 2.5], ["connect with", 1.5], ["share with", 1.5], ["dating", 3]],
    Media: [["streaming", 3], ["music", 2.5], ["podcasts", 3], ["podcast", 2.5], ["video", 2], ["movies", 2.5], ["watch", 1.5], ["listen", 2], ["photos", 1.5], ["editing", 1.5]],
  },
  Service: {
    Agency: [["agency", 3], ["our clients", 2], ["our work", 1.5], ["creative agency", 3], ["design agency", 3], ["brand", 1], ["campaigns", 1]],
    Consulting: [["consulting", 3], ["consultancy", 3], ["consultant", 3], ["advisory", 3], ["strategy", 1.5], ["workshops", 2], ["training", 1.5], ["coaching", 2]],
    Freelancer: [["freelance", 3], ["freelancer", 3], ["available for hire", 3], ["hire me", 3], ["i help", 2.5], ["i design", 2.5], ["i build", 2.5], ["my services", 3], ["work with me", 3]],
    Development: [["web development", 3], ["app development", 3], ["software development", 3], ["development", 1.5], ["we build", 1.5], ["custom software", 3], ["engineering", 1], ["mobile apps", 2], ["websites", 1.5]],
    Marketing: [["marketing", 3], ["seo", 3], ["social media", 2.5], ["content marketing", 3], ["performance marketing", 3], ["pr", 1], ["growth", 1.5], ["advertising", 2.5]],
  },
  Other: {
    Inspiration: [["inspiration", 3], ["curated", 2.5], ["gallery", 2.5], ["showcase", 2.5], ["moodboard", 3], ["best of", 1.5], ["collection", 1.5], ["awwwards", 3], ["browse", 1]],
    "UI reference": [["screens", 3], ["patterns", 3], ["ui kit", 3], ["ui patterns", 3], ["ui", 1.5], ["design system", 2], ["components", 2], ["flows", 2], ["mobbin", 3], ["pattern library", 3], ["ux patterns", 3]],
    News: [["news", 3], ["breaking", 2.5], ["headlines", 3], ["reuters", 2], ["reported", 1.5], ["journalism", 2.5], ["press", 1.5], ["latest stories", 2.5], ["editorial", 1]],
    Docs: [["docs", 3], ["documentation", 3], ["api reference", 3.5], ["reference", 2], ["guide", 1.5], ["getting started", 2], ["changelog", 1.5], ["installation", 2], ["quickstart", 2.5], ["readme", 2], ["manual", 2]],
    Community: [["community", 3], ["forum", 3], ["discussion", 2.5], ["discussions", 2.5], ["members", 2], ["join", 1.5], ["reddit", 2], ["discord", 2], ["threads", 1.5], ["questions", 1.5], ["meetup", 2.5]],
    Resource: [["resources", 2], ["tools", 1.5], ["list of", 1.5], ["directory", 2], ["templates", 1.5], ["free", 0.5], ["cheat sheet", 2], ["awesome", 1.5]],
  },
};

// JSON-LD @type boosts: { type: { Main: weight } }
export const LD_BOOSTS = {
  Person: { Portfolio: 2 },
  ProfilePage: { Portfolio: 2 },
  CreativeWork: { Portfolio: 1 },
  ImageGallery: { Portfolio: 1, Other: 1 },
  BlogPosting: { Blog: 4 },
  Blog: { Blog: 3 },
  Article: { Blog: 3 },
  TechArticle: { Blog: 3, Other: 1 },
  NewsArticle: { Other: 3, Blog: 1 },
  SoftwareApplication: { Product: 3 },
  WebApplication: { Product: 3 },
  MobileApplication: { Product: 3 },
  Product: { Product: 2.5 },
  Offer: { Product: 1.5 },
  ProfessionalService: { Service: 3 },
  Service: { Service: 2.5 },
  LocalBusiness: { Service: 1.5 },
  CollectionPage: { Other: 1 },
  DiscussionForumPosting: { Other: 3 },
  QAPage: { Other: 2 },
  FAQPage: { Product: 0.5 },
};

// og:type boosts
export const OG_BOOSTS = {
  article: { Blog: 2 },
  profile: { Portfolio: 2 },
  product: { Product: 2 },
  "og:product": { Product: 2 },
};

// URL path segment boosts (any segment matches, case-insensitive)
export const PATH_BOOSTS = {
  blog: { Blog: 2 }, articles: { Blog: 2 }, article: { Blog: 2 }, posts: { Blog: 2 },
  post: { Blog: 1.5 }, journal: { Blog: 1.5 }, writing: { Blog: 1.5 }, notes: { Blog: 1 },
  pricing: { Product: 2 }, signup: { Product: 1.5 }, features: { Product: 1.5 },
  download: { Product: 1 }, product: { Product: 1.5 }, login: { Product: 0.5 },
  work: { Portfolio: 1.5 }, projects: { Portfolio: 1.5 }, portfolio: { Portfolio: 2 },
  "case-studies": { Portfolio: 1.5 }, about: { Portfolio: 0.5 },
  services: { Service: 2 }, contact: { Service: 0.5 }, consulting: { Service: 2 },
  docs: { Other: 3 }, documentation: { Other: 3 }, reference: { Other: 2 }, api: { Other: 1 },
  guide: { Other: 1 }, news: { Other: 2 }, forum: { Other: 2 }, community: { Other: 2 },
  inspiration: { Other: 2 }, gallery: { Other: 1.5 }, wiki: { Other: 2 },
};

export const RSS_BOOST = { Blog: 1.5 };
export const MIN_SCORE = 2;

// Field multipliers: where a keyword is found changes how much it counts.
const FIELD_WEIGHT = { title: 2, headings: 1.5, url: 1.5, description: 1.25, siteName: 1, text: 1 };

// ---------------------------------------------------------------------------

function words(s) {
  return " " + String(s ?? "").toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim() + " ";
}

function buildFields(signals) {
  const s = signals ?? {};
  const url = parseUrl(s.url);
  const urlWords = url ? `${url.host} ${url.segments.join(" ")}` : "";
  return {
    title: words(s.title),
    headings: words(Array.isArray(s.headings) ? s.headings.join(" ") : s.headings),
    url: words(urlWords),
    description: words(s.description),
    siteName: words(s.siteName),
    text: words(s.text),
  };
}

function parseUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    let segments = [];
    try {
      segments = u.pathname.split("/").filter(Boolean).map((x) => decodeURIComponent(x).toLowerCase());
    } catch {
      segments = u.pathname.split("/").filter(Boolean).map((x) => x.toLowerCase());
    }
    return { host, segments, isRoot: segments.length === 0 };
  } catch {
    return null;
  }
}

function keywordWeight(fields, phrase, weight) {
  const p = words(phrase).trim();
  if (!p) return 0;
  let best = 0;
  for (const [name, hay] of Object.entries(fields)) {
    if (hay.length < 3) continue;
    if (hay.includes(` ${p} `) || hay.includes(` ${p}s `)) {
      best = Math.max(best, FIELD_WEIGHT[name]);
    }
  }
  return best * weight;
}

function scoreList(fields, list) {
  let total = 0;
  for (const [phrase, weight] of list) total += keywordWeight(fields, phrase, weight);
  return total;
}

function addBoost(scores, boost, factor = 1) {
  if (!boost) return;
  for (const [main, w] of Object.entries(boost)) scores[main] += w * factor;
}

function scoreMain(signals) {
  const s = signals ?? {};
  const fields = buildFields(s);
  const scores = Object.fromEntries(MAIN.map((m) => [m, 0]));
  for (const m of MAIN) scores[m] += scoreList(fields, MAIN_KEYWORDS[m] ?? []);
  const ld = Array.isArray(s.ldTypes) ? s.ldTypes : [];
  for (const t of ld) {
    const key = String(t).replace(/^.*[/#]/, "");
    if (Object.hasOwn(LD_BOOSTS, key)) addBoost(scores, LD_BOOSTS[key]);
  }
  if (typeof s.ogType === "string") {
    const og = s.ogType.toLowerCase();
    if (Object.hasOwn(OG_BOOSTS, og)) addBoost(scores, OG_BOOSTS[og]);
  }
  const url = parseUrl(s.url);
  if (url) {
    for (const seg of new Set(url.segments)) {
      if (Object.hasOwn(PATH_BOOSTS, seg)) addBoost(scores, PATH_BOOSTS[seg]);
    }
  }
  if (s.hasRss === true) addBoost(scores, RSS_BOOST);
  return { scores, fields };
}

function pickSub(main, fields, signals) {
  const lists = SUB_KEYWORDS[main] ?? {};
  const url = parseUrl(signals?.url);
  let bestSub = DEFAULT_SUB[main];
  let best = 0;
  for (const sub of SUBS[main]) {
    let sc = scoreList(fields, lists[sub] ?? []);
    if (main === "Other" && sub === "Docs" && url?.segments.some((x) => x === "docs" || x === "documentation")) sc += 2;
    if (sc > best) {
      best = sc;
      bestSub = sub;
    }
  }
  return bestSub;
}

export function categorizeByRules(signals) {
  const { scores, fields } = scoreMain(signals);
  let main = "Other";
  let best = 0;
  for (const m of MAIN) {
    if (scores[m] > best) {
      best = scores[m];
      main = m;
    }
  }
  if (best < MIN_SCORE) main = "Other";
  return { category: main, subcategory: pickSub(main, fields, signals) };
}

export function categorizeUrlOnly(url) {
  return categorizeByRules({ url });
}

// ---------------------------------------------------------------------------

export function cleanName(signals) {
  const s = signals ?? {};
  const u = parseUrl(s.url);
  const host = u ? u.host : "";
  const site = typeof s.siteName === "string" ? s.siteName.trim() : "";
  const title = typeof s.title === "string" ? s.title.trim() : "";
  if (u?.isRoot && site) return site;
  if (!title) return host || site || String(s.url ?? "");
  const m = title.match(/^(.*\S)\s+(?:[–—|-])\s+([^–—|]+?)\s*$/);
  if (m) {
    const suffix = m[2].trim().toLowerCase();
    const label = host.split(".").slice(-2, -1)[0] ?? "";
    const known = [site.toLowerCase(), host, label].filter(Boolean);
    if (known.includes(suffix)) return m[1].trim();
  }
  return title;
}
