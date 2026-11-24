# Sheaf: design

Date: 2026-11-24
Status: draft, waiting for owner approval
Visual design: [Figma file](https://www.figma.com/design/RIPdRfahgtktGA1abkfVDX/Untitled?node-id=15-56). The build values (tokens, components, every screen) are in [`2026-11-24-sheaf-visual-spec.md`](./2026-11-24-sheaf-visual-spec.md).

---

## 1. Why this exists

The owner is a UX researcher and product designer who looks at new websites and apps every day. They leave hundreds of tabs open because they're afraid of losing a site they might need. Those tabs slow their computer down. Copying links into a Google Sheet didn't work, because they forgot to do it and couldn't remember where things were.

Sheaf is one place where a site goes the moment you decide it's worth keeping. It is sorted automatically, so the tab can be closed without worry. Success means the owner closes tabs as soon as they've looked at them, and can find any saved site again within seconds.

They checked existing tools (OneTab, Smart Tab Saver, Raindrop, Karakeep and others) and none of them combine all of the following:

- one-press save and close
- a main category plus a subcategory
- a count of how many times a saved site was revisited
- a scannable spreadsheet view
- free, open source and unlimited, with no server or account

## 2. Goals, non-goals, anti-goals

**Goals (v1)**

1. **Save and close in one action.** Click the toolbar icon (popup) or press **Alt+Shift+S** on any tab. Default action: save and close the tab. Secondary action: save and keep the tab open.
2. **Automatic filing.** Every save gets a main category (Portfolio, Blog, Product, Service, Other), a subcategory (for example "Design tool") and a one-line summary. The owner can correct any of them by hand.
3. **Visit count.** Whenever any tab arrives at a site that is already saved, that site's visit count goes up by one and its last-visit date updates. This includes new tabs, typed URLs, clicked links, and moving from one site to another inside the same tab.
4. **Dashboard.** A full-page, spreadsheet-style library: search, category tabs with counts, sorting, inline editing, star, open, copy, delete, a stats strip, and an empty state. It matches the Figma file.
5. **Free and unlimited.** $0 to use, no account, no server, no practical limit on the number of saved sites, MIT-licensed and public on GitHub.
6. **Never lose data.** Export to CSV and JSON, import from them, plus an automatic weekly backup file.

**Non-goals (v1)**: phone or multi-device sync, automatically saving every site, bulk "save all open tabs at once" (the owner skipped this option on 2026-11-22), Firefox/Safari/Edge builds, page snapshots or screenshots, highlights or reading mode, sharing, Chrome Web Store publishing. All of these can come later. The code should not prevent sync from being added.

**Anti-goals** (failures even if everything else works):

- Any browsing data leaves the computer. No analytics, no remote AI, no remote fonts.
- Sheaf itself makes the browser slow. Slowness is the problem it exists to solve.
- Duplicate rows for the same site.
- Recording sites the owner never chose to save.
- It needs a paid API, a server or an account.

## 3. Constraints

- Google Chrome on a desktop computer (Windows or Mac), Manifest V3 extension.
- Installed for free with **Developer mode → Load unpacked**. Chrome may show a reminder about developer-mode extensions. That is accepted.
- No build step needed to run: the repository folder (or a release zip) loads straight into Chrome.
- On-device AI is optional. The owner's computer may not meet Chrome's built-in AI requirements (a GPU with more than 4 GB of VRAM, or 16 GB of RAM and 4+ CPU cores, plus about 22 GB of free disk). Everything must work without it.

## 4. Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| **A. Everything inside the extension.** The dashboard is an extension page. Data lives in Chrome's extension storage with the `unlimitedStorage` permission. | $0, private, offline, unlimited (limited only by disk: about 1 KB per site, so 100,000 sites is about 100 MB). It lives on one computer, and uninstalling deletes the data, which is covered by export and the weekly backup. | **Chosen.** Owner confirmed on 2026-11-24 by proceeding; it was the recommended option. |
| B. Extension plus a free cloud database (Supabase or Firebase) and a dashboard on GitHub Pages. | Works on a phone. But free tiers cap storage (500 MB to 1 GB), pause or limit activity, need an account, and send data off the device. | Rejected for v1. Sync can be added later as an option. |
| C. Extension plus a private GitHub repository as the database. | Free and versioned, but needs a token, is slow, and hosting a dashboard from a private repo isn't free. | Rejected. |

Capture approach: **one-press save** was chosen over automatically saving every site, because it doesn't record noise or private pages, and it replaces closing the tab. Visit counting is automatic, but **only for sites that are already saved**.

## 5. How it works

### 5.1 Pieces

```
manifest.json (MV3)
background/        service worker: shortcut, tab watching, visit counting, badge, backup alarm
popup/             toolbar popup: "New site" and "Already saved" states
dashboard/         full-page library (opens as a browser tab)
content/           injected on demand: reads page details on save; shows the toast
lib/               pure modules shared by all of the above (no Chrome APIs inside, so they can be tested in Node)
  site-key.js      URL → site identity
  categorize.js    rules-based category, subcategory and summary
  ai.js            Chrome built-in AI wrapper (optional, with feature detection)
  store.js         read and write site records (wraps chrome.storage.local)
  csv.js           export and import
assets/fonts/      Instrument Serif, Instrument Sans, DM Mono (OFL, bundled locally)
assets/icons/      toolbar icon states (not saved, saved, just saved) at 16/32/48/128
```

- **Language:** plain modern JavaScript with ES modules, HTML and CSS, so there's no build step. *(Builder's call within this rule: helper libraries only if they can be vendored as a single file with no build step.)*
- **Tests:** the Node built-in test runner (`node --test`) for `lib/`, and Playwright (Chromium with the unpacked extension loaded) for end-to-end flows. Node is needed only to run tests, never to use Sheaf.

### 5.2 What a "website" is (site identity)

The visit count and duplicate check both depend on deciding when two URLs are the same website. Rule (my call):

1. Lowercase the hostname and remove a leading `www.`. Subdomains count as separate sites: `docs.stripe.com` is not `stripe.com`, and `jane.webflow.io` is its own site.
2. **Shared platforms:** on hosts where each person or project lives at a path, the site is the host plus the first path segment. For example, `behance.net/janedoe`, `dribbble.com/janedoe`, `github.com/vercel`, `medium.com/@jane`, `read.cv/jane`, `x.com/jane`, `linkedin.com/in/jane` (two segments for `/in/`), `youtube.com/@channel`. The list lives in one place in `site-key.js` and is easy to extend.
3. Only `http` and `https` pages can be saved. `chrome://` pages, the Web Store, `file://` and similar are refused with a friendly popup message.

### 5.3 Data stored per site

| Field | Notes |
|---|---|
| `key` | Site identity from 5.2. Unique; this is the primary key. |
| `url` | The exact URL that was saved. Clicking "Open" opens this. |
| `name` | Site name from `og:site_name`, otherwise a cleaned-up page title, otherwise the domain. |
| `title`, `description` | As read from the page when it was saved. |
| `summary` | One line, at most 60 characters. |
| `category` | One of Portfolio, Blog, Product, Service, Other. |
| `subcategory` | Short Title Case label. |
| `categorySource` | `ai`, `rules` or `user`. Saves never overwrite `user` values. |
| `note` | Optional; typed in the popup or the dashboard. |
| `starred` | true or false. |
| `visits` | Integer. Saving counts as visit 1. |
| `savedAt`, `lastVisitedAt` | Timestamps. |
| `favicon` | A small data-URL copy of the tab's favicon, taken at save time (at most about 4 KB), so it works offline. If none exists, a coloured letter tile as in the Figma file. |

- **Storage:** `chrome.storage.local` with `unlimitedStorage`, one key per site (`site:<key>`), plus a small `meta` record (schema version, settings, stats counters such as "tabs closed").
- All access goes through `store.js`, so IndexedDB (or a sync layer) can replace it later without touching the UI.
- *(My call: `chrome.storage.local` is the store that the `unlimitedStorage` permission is documented to make unlimited. It is fast enough for tens of thousands of rows when loaded once into memory by the dashboard.)*

### 5.4 Saving

1. **Popup path.** The popup opens. If the current tab's site is already saved, it shows the "Already saved" state (Figma frame D). Otherwise it reads the page and shows the suggested category, subcategory and summary, which can be changed, plus a note field (frame C). It offers:
   - **Save & close tab**, which is also Enter or Alt+Shift+S
   - **Save, keep open**
2. **Shortcut path.** Alt+Shift+S saves straight away with the rules-based category, closes the tab, and flashes the toolbar "just saved" state on the newly active tab. If the AI is available, it refines the category and summary in the background a moment later.
3. **Reading the page:** `chrome.scripting.executeScript` on the active tab, run only at save time. It reads:
   - the title, meta description, `og:site_name`, `og:type` and JSON-LD `@type`
   - headings
   - the first ~2,000 characters of visible text
   - whether keywords appear, such as pricing, sign up, case study, blog, services, book a call
   - the favicon URL

   If the page can't be read (restricted or still loading), save with the URL, title and category Other.
4. **Duplicates:** saving an already-saved site never adds a row. It updates `lastVisitedAt` and leaves the visit count unchanged; the visit was already counted on arrival.
5. **"Tabs closed"** is a counter that goes up each time Save & close closes a tab. It feeds the stat in the dashboard.

### 5.5 Categorising (free, on device)

1. **Rules (always available, instant).** Score the five categories from the signals read in 5.4. Examples:
   - JSON-LD `Person`/`ProfilePage`, "portfolio", "selected work" or "case study" → Portfolio
   - `BlogPosting`/`Article`, "/blog", "posts" or an RSS link → Blog
   - "pricing", "sign up", "free trial", "download the app" or `SoftwareApplication` → Product
   - "services", "our clients", "book a call" or "agency" → Service
   - otherwise → Other

   Subcategory comes from keyword lists for each category. The default lists are below; the builder may add to them.
   - **Portfolio:** Product designer, UX designer, 3D artist, Developer, Design engineer, Illustrator, Photographer, Studio
   - **Blog:** Design, UX research, Engineering, AI, Business, Personal essays, Newsletter
   - **Product:** Design tool, Dev tool, AI tool, Productivity, Fintech, E-commerce, Analytics, Marketing, Education, Health, Social, Media
   - **Service:** Agency, Consulting, Freelance studio, Development shop, Marketing agency
   - **Other:** Inspiration gallery, UI reference, News, Docs, Community, Resource

   Summary: the meta description, trimmed to 60 characters at a word boundary.
2. **Chrome built-in AI (if available).** Use the Prompt API (`LanguageModel`) with the page signals and a JSON response constraint: main category (enum), subcategory (preferably from the list above, otherwise a new 1–3 word Title Case label) and summary (at most 60 characters).
   - Time out after 8 seconds and fall back to the rules result.
   - If the API isn't available in the service worker, run it in an offscreen document *(builder's call)*.
3. **Turning AI on:** the model download needs a user action. The dashboard shows a one-time "Turn on smart sorting" card with a download progress bar, or "Your computer can't run Chrome's built-in AI; rules-based sorting is on" if it isn't supported. Settings has the same toggle.
4. User corrections always win and are never overwritten.

### 5.6 Visit counting

- The service worker listens to `chrome.tabs.onUpdated`, watching for URL changes, including single-page-app history changes. It also listens to `chrome.tabs.onRemoved` for cleanup.
- For each tab it remembers the site key of the last URL in `chrome.storage.session`, because the service worker can be stopped at any time.
- When a tab's site key **changes** (or a tab's first URL loads) and the new key is saved: `visits += 1` and `lastVisitedAt = now`.
- The same key again (moving between pages of one site, reloading) does not count.
- Sites that aren't saved are not written anywhere.
- **Restored sessions:** tabs that Chrome restores at browser start-up don't count (ignore events in the first 10 seconds after start-up for tabs that existed before). *(Builder may refine.)*
- **Toolbar icon** for the active tab:
  - Not saved: grid mark.
  - Saved: red cell, with the badge showing the visit count (99+ when above 99).
  - Just saved: green check for 2 seconds.

### 5.7 Dashboard

Opens from the popup's "Open library" link, or by clicking the icon while holding the shortcut modifier *(builder's call)*. Matches Figma frames A and B.

- **Columns:** row number, Site (favicon, name, star), Link (domain), Category chip, Type (subcategory), Summary, Note, Visits (bar and count), Saved, Last visit.
- **Search:** across name, domain, summary, note and subcategory. Focus it with `/`.
- **Category tabs** with live counts. **Sort** by any column; the default is last visit, newest first.
- **Inline editing:** click the category cell to open the "Move to category" menu. Click type or note to edit them in place. Star with one click.
- **Row hover actions:** Open ↗ (in a new tab), Copy link, Edit, Delete. Delete has a 5-second Undo toast.
- **Stats strip:** Saved, This week, Tabs closed, Most visited.
- **Footer:** "Stored on this device · Unlimited · Free & open source".
- **Performance:** load all records once. Render only the visible rows (a windowed list) once there are more than about 300, so 50,000 rows still scroll smoothly. Search and filter in memory.
- **Empty state:** frame B, with the three setup steps.

### 5.8 Toast

After **Save, keep open**, a toast appears at the bottom right of the page for 5 seconds: "Saved · Product → Design tool · Undo". It is injected in a Shadow DOM so the page's styles can't break it. Undo deletes the row.

### 5.9 Backup, export and import

- **Export:** CSV (one row per site, all fields) and JSON (the full records plus a schema version).
- **Import (v1 scope):**
  - Sheaf's own CSV and JSON.
  - Any CSV that has a column of URLs, such as the owner's old Google Sheet. The URL column is detected automatically. These rows are filed with rules based on the URL alone, because the page isn't opened, and are marked `categorySource: rules`. The site's next visit re-reads the page and improves the category, unless the owner set it by hand.
  - Browser bookmarks, OneTab and Raindrop imports are later work.
- **Import merge rules** for a site key that already exists (my call):
  - `visits`: take the larger number. Never add them, so re-importing a backup can't inflate counts.
  - `savedAt`: the earlier date.
  - `lastVisitedAt`: the later date.
  - `starred`: true if either is true.
  - `note`: keep the existing one; use the imported one only if the existing one is empty.
  - Category and subcategory: a value with `categorySource: user` wins; otherwise keep the existing one.
  - Import never deletes rows.
- **Weekly backup:** a `chrome.alarms` alarm writes `Downloads/Sheaf/sheaf-backup-YYYY-MM-DD.json` with `chrome.downloads`.
  - It keeps the **last 4** backups by deleting older Sheaf backup files it created itself, which it tracks by download ID.
  - It **skips writing** when the library is empty, or has fewer than half the rows of the previous backup, and shows a warning in the dashboard instead. A wiped or corrupted library therefore never replaces a good backup.
  - It is on by default and can be turned off in settings. The dashboard shows "Last backup: <date>".

### 5.10 Permissions and privacy

`storage`, `unlimitedStorage`, `tabs` (needed to see tab URLs for visit counting; Chrome shows "Read your browsing history" at install), `activeTab`, `scripting`, `alarms`, `downloads` and `offscreen` (only if needed for AI).

No host permissions beyond what `activeTab` gives at save time. No network requests at all, except the one-time AI model download, which Chrome itself manages. The README explains each permission in plain words.

### 5.11 Look and feel

Follow the Figma file and the visual spec exactly:

- **Name:** Sheaf.
- **Style:** the "research ledger": warm paper (#F3F0E8), ink (#1C1B18) and a single vermilion accent (#C93A22).
- **Fonts:** Instrument Serif for titles and notes, Instrument Sans for the interface, DM Mono for data.
- **Grid details:** column letters and row numbers, and hairlines.

All colours and type become CSS custom properties named after the Figma tokens (for example `--color-paper`, `--cat-product-bg`). Light theme only in v1, but the tokens are structured so a dark theme can be added later.

## 6. Delivery phases

Each phase ends with something the owner can load in Chrome and try.

1. **Skeleton:** the extension loads, the popup saves the current site with the URL and title (no category yet), and the dashboard lists saved sites in a plain table. Site identity has tests.
2. **Visit counting and toolbar icon states**, with tests for same-tab site changes.
3. **Rules-based categorising** and the full popup (frames C and D), including category and type editing and the note.
4. **The full dashboard** with the Figma styling: search, tabs, sort, inline edit, stats, empty state and the windowed list.
5. **Keyboard shortcut, save-and-close flow, "just saved" flash, and the toast with Undo.**
6. **Export, import and weekly backup.**
7. **Chrome built-in AI** (optional path) and the "Turn on smart sorting" card.
8. **Polish:**
   - a performance check with 20,000 generated rows
   - a README with install steps and screenshots
   - an MIT licence
   - a versioned release zip

## 7. Decided by the owner

- One-press save, rather than automatically saving every site (2026-11-22).
- Visit counts for sites that are already saved, including moving to a different site inside the same tab (2026-11-22).
- Its own interface, inspired by a spreadsheet but not Google Sheets (2026-11-22).
- Free, open source, unlimited, with nothing to pay (2026-11-22).
- Build Sheaf instead of adopting an existing extension (2026-11-24).
- Storage on this computer, inside the extension (approach A), on the recommendation (2026-11-24).

## 8. Calls made by Claude (open to change)

- Name and visual direction: "Sheaf", "research ledger" (the owner hasn't reacted yet).
- Site identity rule, including the shared-platform list (5.2).
- `chrome.storage.local` as the store behind a swappable module (5.3).
- Saving counts as visit 1. Saving again never adds a row or a visit.
- Restored session tabs don't count as visits.
- The weekly backup is on by default, keeps the last 4 files, and never overwrites a good backup with a much smaller library.
- Import scope and merge rules (5.9).
- Plain JavaScript with no build step; Node is used only for tests.
- The default subcategory lists (5.5).

## 9. Left to the builder

- Internal module design within the structure above, and the CSS architecture.
- The exact rules-scoring weights and keyword lists (as long as the categories and examples above hold).
- How the dashboard opens apart from the popup link.
- Whether AI runs in the service worker or an offscreen document.
- The windowed-list implementation.
- The visual details not covered by the Figma file: loading states, error messages, the settings panel layout. Use the existing tokens and components.
