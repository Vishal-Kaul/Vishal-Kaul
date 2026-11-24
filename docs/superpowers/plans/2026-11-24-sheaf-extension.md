# Sheaf extension (computer) implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Chrome extension where Alt+Shift+S saves the current page into a categorised, text-only library and closes the tab. It counts revisits, and the library supports search, tabs, pagination, editing, Gmail-style multiple selection, export, import and backups.

**Architecture:**
- A Manifest V3 extension in plain ES-module JavaScript with no build step.
- Pure logic lives in `sheaf/lib/` (no Chrome APIs, tested with `node --test`).
- Chrome-facing code (service worker, popup, library page) is a thin layer over `lib/`.
- `store.js` wraps `chrome.storage.local`, and an in-memory fake replaces it in tests.
- End-to-end checks use Playwright with the unpacked extension loaded.

**Tech stack:** JavaScript (ES2022 modules), HTML, CSS, Node ≥ 20 (tests only), Playwright (pre-installed; e2e only).

**Spec:** `docs/superpowers/specs/2026-11-24-sheaf-design.md` (visual tokens: `docs/superpowers/specs/2026-11-24-sheaf-visual-spec.md` §3; screens: Figma file `RIPdRfahgtktGA1abkfVDX`, Page 1 frames `Library`, `Library · 3 selected`, `Popup · Not saved`, `Popup · Already saved`, `Toolbar icon`).

**Out of scope for this plan:** Google Drive sync and the mobile web page (spec 5.11, phase 8). They get their own plan once this one ships. The only thing this plan does for them is give every record an `updatedAt` and keep all storage behind `store.js`.

## Global constraints

- **Location:** all code under `sheaf/` in this repo, on branch `claude/gifted-davinci-ozk9el`. `sheaf/` loads directly via chrome://extensions → Load unpacked.
- **Network and dependencies:** no runtime dependencies. No network requests. Fonts are bundled locally from `sheaf/assets/fonts/` (Instrument Serif, Instrument Sans, DM Mono; OFL).
- **Name:** the product name is a placeholder. Use the single constant `PRODUCT_NAME = "Sheaf"` in `sheaf/lib/config.js` and `"name": "Sheaf"` in the manifest. Never hard-code the name anywhere else.
- **Shortcut:** `Alt+Shift+S` (`"default": "Alt+Shift+S"`, `"mac": "Alt+Shift+S"`). The command is named `save-and-close`.
- **Permissions (exactly):** `storage`, `unlimitedStorage`, `tabs`, `activeTab`, `scripting`, `alarms`, `downloads`. `offscreen` is added only by Task 9, and only if it's needed.
- **Main categories (exact order):** Portfolio, Blog, Product, Service, Other.
- **Subcategories:** exactly the spec 5.5 table. Rules fallback defaults: Portfolio → Designer, Blog → Design, Product → Productivity, Service → Agency, Other → Resource.
- **Display format:** category text is `"<Main> · <Sub>"` (a middle dot with spaces).
- **Library:** 50 rows per page. The pager text is `"1–50 of 248"` (en dash). The default sort is `savedAt` descending.
- **Colours** come only from CSS custom properties named after the tokens (`--color-paper`, `--color-ink`, `--cat-product-dot`, …), with the hex values from visual spec §3.1–3.2.
- **Text-only UI**, except where the Figma frames show the v1 index-card tabs (coloured dots and the vermilion count pill) and the dark hover pill.

## Review focus

1. **Odd URLs:** `HTTPS://WWW.Example.com/Path/?utm_source=x#top` and `http://example.com/Path` must be the same entry. `example.com/?id=2` and `example.com/?id=3` must not be. → pinned in Task 1.
2. **Pages that can't be saved** (`chrome://`, `chrome-extension://`, the Web Store, `file://`, a PDF viewer, a page that throws on script injection). The shortcut must not crash, must not leave a half-written row, and must show the ✕ badge. → pinned in Task 4 (pure `isSaveable`) and Task 6 (the injection failure fallback).
3. **Single-page apps and redirects.** A URL change inside one tab (pushState) counts as a visit only when the normalised URL changes. A redirect chain on load counts once. Reloading doesn't count. → pinned in Task 5.
4. **Large libraries (20,000 rows).** The library must open, search and change page without freezing. → pinned in Task 11.
5. **Re-importing your own backup** must not change any visit count and must not create duplicates. → pinned in Task 10.

---

## File structure

```
sheaf/
  manifest.json
  lib/            config.js categories.js url-key.js categorize.js visits.js records.js store.js query.js csv.js
  background/     service-worker.js icon.js backup.js ai-bridge.js
  content/        read-page.js
  popup/          popup.html popup.css popup.js
  library/        library.html library.css library.js table.js selection.js
  shared/         tokens.css fonts.css
  assets/         fonts/*.woff2  icons/{idle,saved,done}-{16,32,48,128}.png
  test/           *.test.js (node --test)   e2e/*.spec.js (Playwright)
  package.json    (devDependencies only; "test": "node --test test/")
  README.md  LICENSE
```

---

### Task 1: Scaffold, config, categories, and URL identity

**Files:**
- Create: `sheaf/manifest.json`, `sheaf/package.json`, `sheaf/lib/config.js`, `sheaf/lib/categories.js`, `sheaf/lib/url-key.js`
- Test: `sheaf/test/url-key.test.js`, `sheaf/test/categories.test.js`

**Interfaces (produces):**
- `config.js`: `PRODUCT_NAME`, `PAGE_SIZE = 50`, `SCHEMA_VERSION = 1`
- `categories.js`:
  - `MAIN = ["Portfolio","Blog","Product","Service","Other"]`
  - `SUBS: Record<Main, string[]>`
  - `DEFAULT_SUB: Record<Main,string>`
  - `isValid(main, sub) → boolean`
  - `label(main, sub) → "Main · Sub"`
- `url-key.js`:
  - `normalizeUrl(url: string) → string | null` (null when it can't be saved)
  - `isSaveable(url: string) → boolean`
  - `displayLink(url: string) → string` (host without www, plus the path, with no scheme and no trailing slash)

- [ ] **Step 1: Write the failing tests.**
  - `normalizeUrl("HTTPS://WWW.Example.com/Path/?utm_source=x&fbclid=1#top") === normalizeUrl("http://example.com/Path")`
  - `normalizeUrl("https://a.com/?id=2") !== normalizeUrl("https://a.com/?id=3")`
  - The root keeps its slash: `normalizeUrl("https://a.com") === normalizeUrl("https://a.com/")`
  - Each of these strips: `ref`, `ref_src`, `si`, `gclid`, `mc_cid`, `mc_eid`, `igshid`, `_hsenc`, `_hsmi`
  - Query parameter order doesn't matter: `?b=1&a=2` equals `?a=2&b=1`
  - `isSaveable` is false for `chrome://newtab`, `chrome-extension://x/y`, `https://chromewebstore.google.com/detail/x`, `file:///a`, `about:blank`, `""` and `"not a url"`
  - `displayLink("https://www.nngroup.com/articles/card-sorting-definition/") === "nngroup.com/articles/card-sorting-definition"`
  - `categories.test.js`: `SUBS.Product.length === 12`, `isValid("Blog","Fintech") === false`, `label("Product","Design tool") === "Product · Design tool"`
- [ ] **Step 2:** Run `cd sheaf && node --test test/`. Expected: the tests FAIL (module not found).
- [ ] **Step 3: Implement the three modules.**
  - `normalizeUrl` uses `new URL()`:
    - lowercase the host and strip a leading `www.`
    - set the scheme to `https`
    - drop the hash
    - delete the tracking parameters, with `utm_*` matched by prefix
    - sort the remaining parameters
    - strip the trailing `/` from non-root paths
  - The manifest:
    - MV3
    - the exact permissions from the global constraints
    - `background.service_worker: "background/service-worker.js"` with `"type": "module"`
    - `action.default_popup: "popup/popup.html"`
    - the `commands.save-and-close` shortcut
    - icons pointing at `assets/icons/idle-*.png` (1×1 placeholder PNGs for now; Task 7 replaces them)
  - `package.json`: `{"type":"module","scripts":{"test":"node --test test/"}}`
- [ ] **Step 4:** Run `node --test test/`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): scaffold extension, categories and URL identity`.

### Task 2: Records and store

**Files:**
- Create: `sheaf/lib/records.js`, `sheaf/lib/store.js`
- Test: `sheaf/test/store.test.js`

**Interfaces:**
- Consumes: `normalizeUrl`, `isValid`
- Produces:
  - **Record shape:** `{ key, url, name, category, subcategory, categorySource: "ai"|"rules"|"user", visits, savedAt, lastVisitedAt, updatedAt }`. Times are epoch ms.
  - `records.js`:
    - `newRecord({url, name, category, subcategory, categorySource}, now) → Record` (visits 1, all three times = now)
    - `applyEdit(rec, {name?, category?, subcategory?}, now) → Record` (any category change sets `categorySource:"user"`, and `updatedAt = now`)
  - `store.js`, `createStore(area) → Store`. `area` has the `chrome.storage.local` shape: `get`, `set`, `remove`, returning promises.
    - `get(key) → Record|null`
    - `put(rec)`
    - `remove(keys: string[])`
    - `all() → Record[]`
    - `getMeta() → {schemaVersion, settings:{backup:boolean}, lastBackupAt, backups: number[]}`
    - `setMeta(patch)`
    - Storage keys are `page:<key>` and `meta`.
  - Also export `memoryArea()`, a fake for tests and Playwright fixtures.

- [ ] **Step 1: Write the failing tests** (using `memoryArea()`):
  - `put` then `get` returns an equal record.
  - `all()` returns only `page:` entries.
  - `remove(["k1","k2"])` deletes both.
  - `getMeta()` on an empty store gives the defaults: `{schemaVersion:1, settings:{backup:true}, lastBackupAt:null, backups:[]}`.
  - `applyEdit` with a category change sets `categorySource === "user"`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement both modules.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): record model and storage wrapper`.

### Task 3: Rules categoriser

**Files:**
- Create: `sheaf/lib/categorize.js`
- Test: `sheaf/test/categorize.test.js`

**Interfaces:**
- **Page signals shape** (also produced by Task 6's `read-page.js`): `{ url, title, description, siteName, ogType, ldTypes: string[], headings: string[], text: string, hasRss: boolean }`.
- `categorizeByRules(signals) → { category, subcategory }`. The result always passes `isValid`.
- `categorizeUrlOnly(url) → { category, subcategory }`. It builds a signals object from the URL alone, for imports.
- `cleanName(signals) → string` (spec 5.3 rules):
  - for a root path with a `siteName`, use the `siteName`
  - otherwise use the title with any ` – Site`, ` | Site` or ` - Site` suffix removed when the suffix equals `siteName` or the host
  - if there is no title, use the host

- [ ] **Step 1: Write the failing tests.** Each case is a signals object and its expected result:
  - JSON-LD `Person` with "selected work" in the text → `Portfolio · Designer`
  - "3D", "three.js" and "portfolio" → `Portfolio · 3D artist`
  - JSON-LD `BlogPosting` on `/articles/x` with "usability" and "user research" → `Blog · UX research`
  - "pricing", "sign up" and "design" and "prototype" → `Product · Design tool`
  - "pricing" and "payments" and "API" → `Product · Fintech`
  - "services", "our clients" and "book a call" → `Service · Agency`
  - "inspiration", "curated" and "gallery" → `Other · Inspiration`
  - empty signals → `Other · Resource`
  - `cleanName`:
    - `{title:"Card Sorting: Definition - NN/G", siteName:"NN/G", url:"https://nngroup.com/articles/x"}` → `"Card Sorting: Definition"`
    - `{siteName:"Linear", url:"https://linear.app/"}` → `"Linear"`
    - `{url:"https://a.com/x"}` → `"a.com"`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement scoring.
  - Each main category has a weighted keyword list over title, description, headings and text, plus boosts from `ldTypes`, `ogType`, path segments (`/blog`, `/articles`, `/pricing`) and `hasRss`. The highest score wins, and ties go to the earlier category in `MAIN`. A score below 2 means Other.
  - The subcategory is chosen by keyword lists for the winning main category, falling back to `DEFAULT_SUB`.
  - The keyword lists are the implementer's choice, but every test case must hold.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): rules-based categoriser with fixed category list`.

### Task 4: Save logic (pure)

**Files:**
- Create: `sheaf/lib/save.js`
- Test: `sheaf/test/save.test.js`

**Interfaces:**
- `savePage(store, {url, signals|null}, now) → {status: "saved"|"exists"|"unsaveable", record?}`:
  - If `!isSaveable(url)`, return `unsaveable` and write nothing.
  - If the normalised key exists, return `exists` and change nothing.
  - Otherwise create the record:
    - `name = signals ? cleanName(signals) : displayLink(url)`
    - category from `categorizeByRules(signals)`, or `Other · Resource` when `signals` is null
    - `categorySource: "rules"`

- [ ] **Step 1: Write the failing tests:**
  - A new URL → `saved`, and `store.all().length === 1` with `visits === 1`.
  - The same URL with a different `utm_` parameter → `exists`, and the count is still 1.
  - `chrome://newtab` → `unsaveable`, and the store is empty.
  - `signals: null` → category `Other`, subcategory `Resource`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): save logic`.

### Task 5: Visit counting (pure)

**Files:**
- Create: `sheaf/lib/visits.js`
- Test: `sheaf/test/visits.test.js`

**Interfaces:**
- `onTabUrl(state, tabId, url, now, store) → Promise<{state, counted: boolean}>`:
  - `state` is a plain object `{[tabId]: lastKey}` (persisted by the caller in `chrome.storage.session`).
  - If `normalizeUrl(url)` differs from `state[tabId]` and the new key is saved: `visits + 1`, `lastVisitedAt = now`, `updatedAt = now`, `counted: true`.
  - Always set `state[tabId] = newKey`.
- `onTabRemoved(state, tabId) → state`
- `seedState(tabs: {id,url}[]) → state` (for start-up, so restored tabs don't count)

- [ ] **Step 1: Write the failing tests:**
  - The first URL in a tab for a saved key → counted.
  - The same key again (a reload, or a `#hash` change) → not counted.
  - A tab moving A → B (B saved) → counted. Then B → B?utm=x → not counted.
  - An unsaved URL → not counted, and nothing is written (`store.all()` is unchanged).
  - A redirect sequence `http://a.com` → `https://www.a.com/` within one load → counted once (both normalise to the same key).
  - After `seedState([{id:1,url:"https://a.com"}])`, `onTabUrl(state,1,"https://a.com")` → not counted.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): per-URL visit counting`.

### Task 6: Service worker, page reader, and the shortcut flow

**Files:**
- Create: `sheaf/background/service-worker.js`, `sheaf/background/icon.js` (no-op stubs: `showFor`, `flashDone`, `flashError`), `sheaf/content/read-page.js`, `sheaf/lib/save.js` is from Task 4, `sheaf/test/e2e/save.spec.js`, `sheaf/test/e2e/fixtures.js`

**Interfaces:**
- Consumes: `savePage`, `onTabUrl`, `onTabRemoved`, `seedState`, `createStore(chrome.storage.local)`.
- Produces:
  - **Runtime messages** (from the popup and library):
    - `{type:"save-active"} → {status}`
    - `{type:"state-for-active"} → {saved: boolean, record?, title, url}`
    - `{type:"open-library"}`
  - **Function** `readPage(): Signals`, defined in `read-page.js`. It is injected with `chrome.scripting.executeScript({target:{tabId}, func: readPage})`. It returns the Task 3 signals shape, with the text trimmed to 2,000 characters and the headings to the first 10 h1–h2.
  - **`fixtures.js`:** a Playwright fixture that launches Chromium with `--disable-extensions-except=<sheaf>` and `--load-extension=<sheaf>` (persistent context, headless new mode), plus a local static HTTP server on `127.0.0.1` serving test pages from `test/e2e/pages/`. It exposes `{context, extensionId, serverUrl}`.

- [ ] **Step 1: Write the failing e2e test** `save.spec.js`. Open `serverUrl/portfolio.html` (a test page with JSON-LD Person and "selected work"). Calling the service worker's handler for `save-and-close` must:
  - close the tab
  - make the library store contain 1 record with category `Portfolio`

  (Trigger the command by evaluating `self.__sheaf.saveActive()` in the worker, because Playwright can't press extension shortcuts. Expose this test hook only on `self.__sheaf`.)
- [ ] **Step 2:** Run `npx playwright test test/e2e/save.spec.js --trace off`. Expected: FAIL.
- [ ] **Step 3: Implement the service worker.**
  - `chrome.commands.onCommand("save-and-close")` → `saveActive()`:
    1. get the active tab
    2. `executeScript(readPage)` inside try/catch; on failure, signals = null
    3. call `savePage`
    4. if the status is `saved` or `exists`, call `chrome.tabs.remove(tab.id)`, then `icon.flashDone()`
    5. if the status is `unsaveable`, call `icon.flashError()`
  - `tabs.onUpdated` (when `changeInfo.url` or `status === "complete"`) and `tabs.onRemoved` → visits, using session state stored in `chrome.storage.session`.
  - `runtime.onStartup` → `seedState(await chrome.tabs.query({}))`.
  - Icon calls go through `background/icon.js` stubs that do nothing until Task 7.
- [ ] **Step 4:** Add a second e2e test: a saved page navigated within the same tab to another saved page, then back, gives visits 2 and 2. Run it. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): shortcut saves, files and closes the tab; counts visits`.

### Task 7: Toolbar icon states and the popup

**Files:**
- Modify: `sheaf/background/icon.js` (real implementation)
- Create: the `sheaf/assets/icons/*.png` files, `sheaf/popup/popup.{html,css,js}`, `sheaf/shared/tokens.css`, `sheaf/shared/fonts.css`, `sheaf/assets/fonts/*`, `sheaf/test/e2e/popup.spec.js`

**Interfaces:**
- Consumes: the runtime messages from Task 6.
- Produces, in `icon.js`:
  - `showFor(tabId, record|null)`: idle icon with no badge, or the saved icon with badge = visits (`"99+"` above 99) and badge colour `#1C1B18`
  - `flashDone()`: done icon for 2,000 ms, then `showFor` the active tab
  - `flashError()`: badge `"✕"` with colour `#A8321D` for 1,500 ms

- [ ] **Step 1: Write the failing e2e tests.** Open `chrome-extension://<id>/popup/popup.html?tab=<id>` with a test hook for the target tab:
  - A not-saved page shows its title, its domain and a button with the text `"Save & close tab"`, plus `"Alt+Shift+S"` and the link `"Open library ↗"`.
  - An already-saved page shows `"Saved · 1 visits"`. Use singular "1 visit" when visits === 1. The button reads `"Close tab"`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Draw the icons from the Figma "Toolbar icon" frame: a 2×2 grid mark (idle), the red top-left cell (saved), and the red cell with a green check badge (done). Export PNGs at 16, 32, 48 and 128 px with a small Node script, `sheaf/tools/make-icons.mjs`, that writes the PNGs with zlib. Commit both the script and the PNGs.
  - The popup matches Figma `Popup · Not saved` / `Popup · Already saved` (300 px wide).
  - `tokens.css` holds every colour from visual spec §3.1–3.2 as `--color-*` and `--cat-*-{bg,text,dot}`.
  - `fonts.css` uses `@font-face` for the bundled woff2 files (download them from Google Fonts' GitHub repository, `github.com/google/fonts`, `ofl/` folder, and commit them; if the network blocks the download, use the system font stacks `Georgia, serif` / `system-ui, sans-serif` / `ui-monospace, monospace` and leave a TODO in `fonts.css` listing the files to add).
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): toolbar icon states and two-button popup`.

### Task 8: The library page

**Files:**
- Create: `sheaf/lib/query.js`, `sheaf/test/query.test.js`, `sheaf/library/library.{html,css,js}`, `sheaf/library/table.js`, `sheaf/library/selection.js`, `sheaf/test/e2e/library.spec.js`

**Interfaces:**
- `query.js` (pure):
  - `runQuery(records, {search, tab, sortKey, sortDir, page}) → {rows, total, counts: Record<"All"|Main, number>, page, pageCount, rangeText}`
  - `rangeText` is like `"1–50 of 248"`, or `"0 of 0"` when there are none.
  - `search` matches name, `displayLink` and `label()`, case-insensitively.
  - `sortKey` is one of `name`, `link`, `category`, `visits`, `savedAt`. The default is `savedAt` descending.
- `selection.js` (pure):
  - `createSelection()` returns an object with `toggle(key)`, `range(fromKey, toKey, orderedKeys)`, `selectPage(keys)`, `selectAll(allKeys)`, `clear()`, `has(key)`, `size`, `keys()`, and `headerState(pageKeys) → "none"|"some"|"page"|"all"`.

- [ ] **Step 1: Write the failing unit tests:**
  - 120 records on page 2 → rows 51–100 and `rangeText === "51–100 of 120"`.
  - Searching "nngroup" finds both NN/g rows.
  - `tab: "Blog"` filters by category, and `counts.All === 120`.
  - Sorting by visits descending puts the largest first.
  - `selection.range` selects the inclusive span.
  - `headerState` moves through none → some → page → all.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement the pure modules, then the page.** The page matches the Figma frames `Library` and `Library · 3 selected`:
  - **Top bar:** logo and `PRODUCT_NAME`, a search field (pressing `/` focuses it), the hint text `"Press Alt+Shift+S on any tab to save it"`, and "Import" and "Export" as text links.
  - **Tab row:** v1 index-card tabs with dots and counts, the active tab joined to the table with a vermilion count pill, and the pager `‹ ›` on the right.
  - **Table columns:** checkbox, Site, Link, Category, Visits. Clicking a header sorts by that column, and clicking again reverses it.
  - **Row hover:** the dark pill (Open ↗ · Copy link · Edit · | · Delete).
  - **Link hover:** ink colour, an underline and "↗". The link opens in a new tab with `rel="noopener"`.
  - **Edit:** in place. The name becomes an input. The category becomes a `<select>` whose option groups are the main categories and whose options are `label(main, sub)`. Enter saves through `applyEdit`; Esc cancels.
  - **Delete** and **bulk delete** show the text `"Deleted · Undo"` / `"3 deleted · Undo"` in the tab row for 5,000 ms. Undo restores the records exactly.
  - **Selection:** Shift-click selects a range. The header checkbox selects the page, and then the link `"Select all 248"` appears. While anything is selected, the header shows `"N selected · Delete · Cancel"`.
  - **Empty library:** the header row only.
  - **Live updates:** the page listens to `chrome.storage.onChanged` and re-renders when other tabs save.
  - **Opening the library:** from the popup link, and with `chrome.runtime.openOptionsPage`. Set `options_page: "library/library.html"` in the manifest, so right-click → Options also opens it.
- [ ] **Step 4:** E2E `library.spec.js`: seed 3 records through the worker hook, open the library, then:
  - check that the 3 rows and the text `"Product · Design tool"` are visible
  - hover a row and see `"Copy link"`
  - select 2 rows, then Delete, and check 1 row remains
  - click Undo and check 3 rows are back

  Run the unit and e2e tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): library with search, tabs, sorting, pagination, edit, multi-select`.

### Task 9: Optional Chrome built-in AI

**Files:**
- Create: `sheaf/lib/ai-prompt.js`, `sheaf/test/ai-prompt.test.js`, `sheaf/background/ai-bridge.js`
- Modify: `sheaf/background/service-worker.js` (after a `saved` status), `sheaf/library/library.js` (the one-line prompt)

**Interfaces:**
- `ai-prompt.js` (pure):
  - `buildPrompt(signals) → string`
  - `responseSchema() → JSON schema` with `category` as an enum of `MAIN` and `subcategory` as an enum of every subcategory
  - `parseAiResult(json) → {category, subcategory} | null` (null when `!isValid`)
- `ai-bridge.js`:
  - `aiAvailability() → "unavailable"|"downloadable"|"available"`
  - `refineWithAi(key, signals)`: re-files the record if `categorySource === "rules"` at write time; 8,000 ms timeout; failures are silent.
  - Use `LanguageModel` in the worker if `typeof LanguageModel !== "undefined"`. Otherwise use an offscreen document (and then add `offscreen` to the permissions).

- [ ] **Step 1: Write the failing tests:**
  - `parseAiResult({category:"Blog",subcategory:"Fintech"}) === null`
  - `parseAiResult({category:"Product",subcategory:"AI tool"})` passes through
  - the schema enums equal `MAIN` and the union of `SUBS`
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. The library shows the single text line `"Smarter sorting is available on this computer. Turn on · Dismiss"` only when the availability is `"downloadable"`. "Turn on" calls `LanguageModel.create()` from that click and shows `"Downloading… 42%"` while it downloads. Dismiss is remembered in meta.
- [ ] **Step 4:** Run the unit tests. Expected: PASS. Check manually that the library hides the prompt when AI is unavailable (as in headless Chromium).
- [ ] **Step 5:** Commit: `feat(sheaf): optional on-device AI filing`.

### Task 10: Export, import, and weekly backup

**Files:**
- Create: `sheaf/lib/csv.js`, `sheaf/lib/merge.js`, `sheaf/test/csv.test.js`, `sheaf/test/merge.test.js`, `sheaf/background/backup.js`
- Modify: `sheaf/library/library.js`

**Interfaces:**
- `csv.js`:
  - `toCsv(records) → string`. Columns: `name,url,category,subcategory,visits,saved_at`, with `saved_at` in ISO format.
  - `parseCsv(text) → string[][]` (RFC 4180: quotes, commas and newlines inside quotes).
  - `detectUrlColumn(rows) → number|-1` (the column where the most cells pass `isSaveable`).
- `merge.js`: `mergeImport(existing: Record[], incoming: Record[], now) → {records: Record[], added, updated}`, following the spec 5.8 rules:
  - `visits = max`
  - earliest `savedAt`
  - latest `lastVisitedAt`
  - a `user` category wins; otherwise keep the existing one
  - never delete
- `backup.js`:
  - `runBackup(store, downloads, now)`. It skips when the library is empty or has fewer than half the rows of the last backup. It writes `Sheaf/sheaf-backup-YYYY-MM-DD.json` and keeps the last 4 download IDs in `meta.backups`, calling `downloads.removeFile` and `erase` on older ones.
  - `chrome.alarms` registers `"weekly-backup"` with a period of 10,080 minutes.

- [ ] **Step 1: Write the failing tests:**
  - CSV round-trip with a name containing `,` and `"`.
  - `detectUrlColumn` on a Google-Sheet-style CSV (`Title,Link,Notes`) → 1.
  - Re-importing an identical export leaves all visit counts and the row count unchanged (review focus 5).
  - An incoming `user` category overrides an existing `rules` one.
  - `runBackup` with a fake `downloads` and a library of 3 rows after a previous backup of 10 rows → skipped.
  - The 5th backup removes the 1st.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement and wire them into the library.
  - Export: a menu with "CSV" and "JSON".
  - Import: a file picker. JSON goes straight to `mergeImport`. CSV in Sheaf's own format is mapped directly. Any other CSV uses `detectUrlColumn` with `categorizeUrlOnly`.
  - Settings line: `"Weekly backup: on · Last backup 24 Nov"`. Clicking toggles it.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(sheaf): export, import and rotating weekly backup`.

### Task 11: Scale check, README, licence, release zip

**Files:**
- Create: `sheaf/test/e2e/scale.spec.js`, `sheaf/README.md`, `sheaf/LICENSE` (MIT, 2026, the repository owner), `sheaf/tools/release.mjs`

- [ ] **Step 1: Write the e2e scale test.** Seed 20,000 generated records and open the library. All of these must hold:
  - the first rows render within 1,500 ms
  - typing "linear" in search updates the rows within 300 ms
  - "›" moves to `"51–100 of 20000"` within 200 ms

  (The pager count uses no thousands separator in v1, so it is `20000`. Keep it consistent with `rangeText`.)
- [ ] **Step 2:** Run it, optimise if needed (compute once, render only 50 rows), and run again. Expected: PASS.
- [ ] **Step 3:** Write the README in plain language:
  - what it does
  - install (Developer mode → Load unpacked → select the `sheaf` folder → pin the icon)
  - the shortcut and how to change it at chrome://extensions/shortcuts
  - each permission and why it's needed
  - where the data lives
  - backup and restore
  - running the tests
- [ ] **Step 4:** `tools/release.mjs` zips `sheaf/` without `test/`, `tools/` or `package.json` into `dist/sheaf-v0.1.0.zip`. Run it and check that the zip loads in Chromium (smoke test: reuse `fixtures.js` with the unzipped folder).
- [ ] **Step 5:** Commit: `chore(sheaf): scale test, README, licence, release script`.
