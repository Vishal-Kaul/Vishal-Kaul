# Sheaf (working name): design

Date: 2026-11-24 (v2: simplified after owner review)
Status: approved to build (2026-11-24)
Product name: **not decided yet**. "Sheaf" is a placeholder.
Visual design: [Figma file](https://www.figma.com/design/RIPdRfahgtktGA1abkfVDX/Untitled), page "Page 1" (v2 frames). The v1 frames are kept for reference on the "v1 archive" page. Tokens and type styles are in [`2026-11-24-sheaf-visual-spec.md`](./2026-11-24-sheaf-visual-spec.md) (section 3). Its v1 screen layouts (sections 5.1–5.5) are **replaced** by section 5.7 of this document and the v2 Figma frames.

---

## 1. Why this exists

The owner is a UX researcher and product designer who looks at new websites and apps every day. They leave hundreds of tabs open because they're afraid of losing a site they might need. Those tabs slow their computer down. Copying links into a Google Sheet didn't work, because they forgot to do it and couldn't remember where things were.

Sheaf is one keyboard shortcut. Press **Alt+Shift+S** on any tab, and the page is saved into a simple list, filed into a category, and the tab closes. Success means the owner closes tabs as soon as they've looked at them, and can find any saved page again within seconds.

**Guiding principle (from the owner): very simple and easy to use, not complex at all.** When in doubt, leave it out. Text only, no decoration.

They checked existing tools (OneTab, Smart Tab Saver, Raindrop, Karakeep and others). None of them gives this exact mix:

- instant save and close
- automatic categories
- a visit count
- a plain, scannable list
- free, open source and unlimited

## 2. Goals, non-goals, anti-goals

**Goals (v1)**

1. **One shortcut, no window.** Alt+Shift+S saves the current page, files it into a category automatically, and closes the tab. No popup or form appears. The toolbar icon briefly shows a check.
2. **Automatic, pre-built categories.** Sheaf picks a main category and a second-level category from a fixed list it ships with (5.5). The owner can change it later with Edit.
3. **Visit count.** Whenever a tab opens a saved page again, including by moving to it inside the same tab, its visit count goes up by one.
4. **The list.** A full-page, spreadsheet-like list with four columns: Site, Link, Category, Visits. It has search, category tabs, pagination, hover actions (Open, Copy link, Edit, Delete) and Gmail-style multiple selection for deleting many rows at once.
5. **Free and unlimited.** $0 to use, no account, no server, no practical limit on the number of saved pages. MIT-licensed and public on GitHub.
6. **Never lose data.** Export to CSV and JSON, import from them, plus an automatic weekly backup file.
7. **See the list on a phone or tablet** (owner request, 2026-11-24). The library is synced to the owner's own Google Drive and shown on a mobile-friendly web page (5.11). This is built after the core works on the computer.

**Non-goals (v1)**

- saving from the phone (the phone can view, open, edit and delete; saving happens on the computer)
- automatically saving every site
- "save all open tabs at once" (the owner skipped this option on 2026-11-22)
- "save but keep the tab open" and the toast
- notes, stars, summaries
- the stats section
- favicons
- Firefox/Safari/Edge builds
- Chrome Web Store publishing

All of these can come later.

**Anti-goals** (failures even if everything else works):

- It feels complicated.
- Browsing data leaves the computer.
- Sheaf itself slows the browser.
- Duplicate rows for the same page.
- Recording pages the owner never chose to save.
- It needs a paid API, a server or an account.

## 3. Constraints

- Google Chrome on a desktop computer (Windows or Mac), Manifest V3 extension.
- Installed for free with **Developer mode → Load unpacked**. Chrome may show a reminder about developer-mode extensions. That is accepted.
- No build step needed to run: the repository folder (or a release zip) loads straight into Chrome.
- On-device AI is optional. The owner's computer may not meet Chrome's built-in AI requirements (a GPU with more than 4 GB of VRAM, or 16 GB of RAM and 4+ CPU cores, plus about 22 GB of free disk). Everything must work without it.

## 4. Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| **A. Everything inside the extension.** The list is an extension page. Data lives in Chrome's extension storage with the `unlimitedStorage` permission. | $0, private, offline, unlimited (limited only by disk: about 1 KB per page, so 100,000 pages is about 100 MB). It lives on one computer, and uninstalling deletes the data, which is covered by export and the weekly backup. | **Chosen** (2026-11-24). |
| B. Extension plus a free cloud database (Supabase or Firebase). | Works on a phone. But free tiers cap storage (500 MB to 1 GB), pause or limit activity, need an account, and send data off the device. | Rejected for v1. |
| C. Extension plus a private GitHub repository as the database. | Needs a token, is slow, and hosting a list from a private repo isn't free. | Rejected. |
| **D. A plus sync to the owner's own Google Drive**, plus the same library as a mobile-friendly web page on GitHub Pages (sign in with Google). | Free, 15 GB (millions of rows), private to the owner, no server of ours. Needs a one-time Google Cloud setup (an OAuth client ID), guided step by step. | **Chosen for phone and tablet access** (my call, 2026-11-24), added as a later phase on top of A. |

**Capture:** one shortcut saves instantly. This was chosen over automatically saving every site, and over a popup form. The owner rejected a form on save on 2026-11-24.

**Long lists:** pagination, Gmail style, **50 rows per page** with "1–50 of 248 ‹ ›" (my call). It was chosen over infinite scroll because:

- it fits Gmail-style "select all on this page, then select all 248"
- it keeps the page light with any number of saved pages
- you always know where you are

## 5. How it works

### 5.1 Pieces

```
manifest.json (MV3)
background/        service worker: shortcut, saving, tab watching, visit counting, icon states, backup alarm
popup/             toolbar-icon popup (two buttons, see 5.4)
library/           the full-page list (opens as a browser tab)
content/           injected only at save time to read the page's title and signals
lib/               pure modules with no Chrome APIs inside (testable in Node)
  url-key.js       URL normalisation → identity of a saved page
  categorize.js    rules-based category picker (fixed list)
  ai.js            optional Chrome built-in AI category picker (same fixed list)
  store.js         read and write records (wraps chrome.storage.local)
  csv.js           export and import
assets/fonts/      Instrument Serif, Instrument Sans, DM Mono (OFL, bundled locally)
assets/icons/      toolbar icon states (not saved, saved, just saved) at 16/32/48/128
```

- **Language:** plain modern JavaScript with ES modules, HTML and CSS, so there's no build step.
- **Tests:** the Node built-in test runner (`node --test`) for `lib/`, and Playwright (Chromium with the unpacked extension loaded) for end-to-end flows. Node is needed only to run tests.

### 5.2 What counts as "the same page"

**Owner's rule (2026-11-24): if the URL is different, the entry is different.** Two Nielsen Norman articles are two rows.

To avoid fake duplicates, URLs are normalised before they're compared:

1. Lowercase the host, remove a leading `www.`, and treat `http` and `https` as the same.
2. Remove the `#fragment`.
3. Remove tracking parameters: `utm_*`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`, `igshid`, `ref`, `ref_src`, `si`, `_hsenc`, `_hsmi`.
4. Remove a trailing `/`, except on the root.
5. Keep every other query parameter, because some sites need them (for example `?id=`).

Only `http` and `https` pages can be saved. On `chrome://` pages, the Web Store or `file://`, the shortcut does nothing, and the icon shows a brief "✕" badge.

### 5.3 Data stored per saved page

| Field | Notes |
|---|---|
| `key` | The normalised URL (5.2). Unique primary key. |
| `url` | The exact URL as saved. "Open" opens this. |
| `name` | Shown in the **Site** column: `og:site_name` for a site's home page, otherwise the page title cleaned of site-name suffixes (" – Nielsen Norman Group"), otherwise the domain. |
| `category` | One of the five main categories (5.5). |
| `subcategory` | One of the fixed subcategories for that main category (5.5). |
| `categorySource` | `ai`, `rules` or `user`. Saves never overwrite `user` values. |
| `visits` | Integer. Saving counts as visit 1. |
| `savedAt` | Timestamp. The default sort is newest saved first. |
| `lastVisitedAt` | Timestamp. Not shown in v1, but kept because it's cheap and useful later. |

- **Storage:** `chrome.storage.local` with `unlimitedStorage`, one key per page (`page:<key>`), plus a `meta` record (schema version, settings, last backup date).
- All access goes through `store.js`, so IndexedDB or sync can replace it later.

### 5.4 Saving

1. **Alt+Shift+S** (rebindable at `chrome://extensions/shortcuts`):
   1. Read the page (5.5).
   2. Pick a category.
   3. Save the record, or count a visit if the page is already saved.
   4. Close the tab.
   5. Show the "just saved" icon state (green check) for 2 seconds on the newly active tab.

   No window or form opens.
2. **Clicking the toolbar icon** opens a tiny popup with only:
   - the page title and domain
   - one button, **Save & close tab** (with an "Alt+Shift+S" hint), which does exactly what the shortcut does
   - a text link, **Open library**

   If the page is already saved, the second line reads "Saved · 14 visits" and the button is **Close tab**. *(My call: mouse users need a way to save and to reach the list. This is the smallest popup that does both.)*
3. **Reading the page** happens only at save time, with `chrome.scripting.executeScript`. It reads:
   - the title, meta description, `og:site_name`, `og:type` and JSON-LD `@type`
   - headings
   - the first ~2,000 characters of visible text
   - whether keywords appear, such as pricing, sign up, case study, blog, services, book a call

   If the page can't be read, save with the URL and title, and category **Other · Resource**.
4. **Already saved:** saving the same normalised URL again never adds a row. It just closes the tab; the visit was already counted when the page opened.
5. **AI timing:** the save never waits for AI. The rules result is stored immediately. If Chrome's built-in AI is on, it re-files the page in the background within a few seconds, unless the owner has edited it.

### 5.5 Categories: a pre-built, fixed list

Sheaf files every page into one main category and one subcategory from this list. Nothing outside the list is ever invented, so the list stays tidy.

| Main | Subcategories |
|---|---|
| **Portfolio** | Designer, Developer, 3D artist, Illustrator, Photographer, Studio |
| **Blog** | Design, UX research, Engineering, AI, Business, Personal |
| **Product** | Design tool, Dev tool, AI tool, Productivity, Fintech, E-commerce, Analytics, Marketing, Education, Health, Social, Media |
| **Service** | Agency, Consulting, Freelancer, Development, Marketing |
| **Other** | Inspiration, UI reference, News, Docs, Community, Resource |

It is shown as plain text in one column: "Product · Design tool". The list lives in one file (`lib/categories.js`), so it is easy to extend later.

1. **Rules (always available, instant).** Score the five main categories from the page signals. Examples:
   - JSON-LD `Person`/`ProfilePage`, "portfolio", "selected work" or "case study" → Portfolio
   - `BlogPosting`/`Article`, "/blog", "/articles" or an RSS link → Blog
   - "pricing", "sign up", "free trial", "download the app" or `SoftwareApplication` → Product
   - "services", "our clients", "book a call" or "agency" → Service
   - otherwise → Other

   Then pick the subcategory with keyword lists for that main category. If no subcategory keyword matches, use a default: Portfolio → Designer, Blog → Design, Product → Productivity, Service → Agency, Other → Resource. The weights and keywords are the builder's call; these examples must hold.
2. **Chrome built-in AI (optional, if the computer supports it).** Use the Prompt API with a JSON response constraint whose enums are exactly the list above.
   - Time out after 8 seconds and keep the rules result.
   - Whether this runs in the service worker or an offscreen document is the builder's call.
3. **Turning AI on:** the model download needs one user click. The library shows one line of text: "Smarter sorting is available on this computer. Turn on". It disappears once turned on or dismissed. On computers that can't run it, nothing is shown.
4. Edits made by the owner always win.

### 5.6 Visit counting

- The service worker listens to `chrome.tabs.onUpdated`, watching for URL changes, including single-page-app history changes, and to `chrome.tabs.onRemoved`.
- For each tab it remembers the last normalised URL in `chrome.storage.session`.
- When a tab's normalised URL **changes** (or a new tab's first URL loads) and the new URL is saved: `visits += 1` and `lastVisitedAt = now`.
- Reloading, or staying on the same URL, does not count.
- Pages that aren't saved are not written anywhere.
- Tabs that Chrome restores at browser start-up don't count. *(Builder may refine the detection.)*
- **Toolbar icon** for the active tab:
  - Not saved: grid mark.
  - Saved: red cell, with the badge showing the visit count (99+ when above 99).
  - Just saved: green check for 2 seconds.

### 5.7 The library (full page)

Matches the v2 Figma frames `Library` and `Library · 3 selected`. **Text only.** No chips, dots, favicons, bars, stats or decoration.

- **Top bar:**
  - Left: logo and name, then the search field.
  - Right: "Press Alt+Shift+S on any tab to save it" in quiet text, then "Export".

  Import lives next to Export, as a menu or a second text link (builder's call, kept as text).
- **Category tabs:** the v1 index-card tabs (owner request, 2026-11-24): All · Portfolio · Blog · Product · Service · Other, each with a coloured dot and its count. The active tab joins the table like a folder tab, with its count in a vermilion pill.
- **Pager:** "1–50 of 248 ‹ ›", Gmail style, on the right of the tab row. 50 rows per page.
- **Columns:** a checkbox, **Site** (name), **Link** (domain and path, cut short with "…" when long), **Category** ("Product · Design tool"), **Visits** (number, right-aligned).
  - Clicking a column header sorts by it.
  - The default is newest saved first.
- **Hover a row:** the v1 dark pill toolbar appears on the right with Open ↗, Copy link, Edit, Delete. The owner preferred it over plain text (2026-11-24).
- **Hover a link:** it turns ink, gets an underline and shows "↗". Clicking it opens the page in a new tab.
  - **Edit** turns the Site name and the Category into in-place fields. Category is a plain list of the fixed categories. Enter saves; Esc cancels.
  - **Delete** removes the row, and a plain line "Deleted · Undo" appears in the tab row for 5 seconds.
- **Multiple selection (Gmail style):**
  - Each row has a checkbox. Shift-click selects a range.
  - The header checkbox selects every row on the current page. Then a text link appears: "Select all 248".
  - While anything is selected, the header shows "3 selected · Delete · Cancel".
  - Bulk delete shows "3 deleted · Undo" for 5 seconds.
- **Search:** matches name, link and category. Press `/` to focus it. The results are paginated the same way.
- **Empty library:** just the header row and no rows. No message, illustration or card (owner's request, 2026-11-24).
- **Performance:** load all records once and filter, sort and page in memory. Only 50 rows are ever in the page, so 50,000+ saved pages stay fast.

### 5.8 Backup, export and import

- **Export:** CSV (one row per page: name, url, category, subcategory, visits, saved date) and JSON (the full records plus the schema version).
- **Import (v1 scope):**
  - Sheaf's own CSV and JSON.
  - Any CSV that has a column of URLs, such as the owner's old Google Sheet. The URL column is detected automatically. These rows are filed with rules based on the URL alone.
- **Import merge rules** for a URL that already exists:
  - `visits`: take the larger number. Never add them.
  - `savedAt`: the earlier date.
  - `lastVisitedAt`: the later date.
  - Category: a value with `categorySource: user` wins; otherwise keep the existing one.
  - Import never deletes rows.
- **Weekly backup:** a `chrome.alarms` alarm writes `Downloads/Sheaf/sheaf-backup-YYYY-MM-DD.json` with `chrome.downloads`.
  - It keeps the last 4 files, deleting only files it created itself, which it tracks by download ID.
  - It skips writing when the library is empty, or has fewer than half the rows of the previous backup.
  - It is on by default. Turning it off is one text toggle.

### 5.11 Phone and tablet access (Google Drive sync)

- The extension keeps working fully offline on the computer. Sync is optional and is turned on with "Connect Google Drive" in the library.
- **Storage:** one file, `sheaf-library.json` (split into chunks if very large), in the owner's Drive **app data folder**. That folder is hidden and private to Sheaf. The only scope requested is `drive.appdata`, so Sheaf can't see any other Drive files.
- **Syncing:** the extension pushes changes a few seconds after any save, edit or delete, and pulls when the library opens.
- **Conflicts:** for each row, the later `updatedAt` wins. Deletes are kept as tombstones for 30 days so they sync too.
- **Mobile page:** the same library code, made responsive. Each row becomes one column: the site, with the link and category underneath and the visits on the right. It is hosted free on GitHub Pages from the project repository.
  - Signing in with Google reads the Drive file.
  - On the phone you can search, filter by category, open links, edit and delete.
  - "Add to Home Screen" makes it feel like an app.
- **One-time setup:** create a free Google Cloud project, then one OAuth client for the extension and one for the web page. The README walks through it with screenshots.

### 5.9 Permissions and privacy

`storage`, `unlimitedStorage`, `tabs` (to see tab URLs for visit counting; Chrome shows "Read your browsing history" at install), `activeTab`, `scripting`, `alarms`, `downloads` and `offscreen` (only if needed for AI).

No network requests at all, except the one-time AI model download that Chrome itself manages. The README explains each permission in plain words.

### 5.10 Look and feel

Use the tokens and type styles from the visual spec (section 3):

- warm paper (#F3F0E8) and ink (#1C1B18)
- danger red for Delete, accent tint for selected rows
- Instrument Serif for the logo only, Instrument Sans for the interface, DM Mono for links and numbers

There are no other colours. Light theme only in v1.

## 6. Delivery phases

Each phase ends with something the owner can load in Chrome and try.

1. **Skeleton:** the extension loads; Alt+Shift+S saves the page (URL and title) and closes the tab; the library lists the rows. URL normalisation has tests.
2. **Categories:** the rules picker with the fixed list, shown in the Category column. It has tests.
3. **Visit counting and toolbar icon states**, with tests for moving inside the same tab.
4. **The full library:** Figma styling, search, category tabs, sorting, pagination, hover actions, Edit, Delete with Undo, multiple selection.
5. **The popup** (two buttons).
6. **Export, import and weekly backup.**
7. **Chrome built-in AI** (optional path) and the one-line "Turn on" prompt.
8. **Google Drive sync and the mobile web page** (5.11).
9. **Polish:**
   - a performance check with 20,000 generated rows
   - a README with install steps
   - an MIT licence
   - a release zip

## 7. Decided by the owner

- One-shortcut save rather than automatically saving every site (2026-11-22).
- Visit counts for saved pages, including inside the same tab (2026-11-22).
- Its own interface, inspired by a spreadsheet (2026-11-22).
- Free, open source, unlimited (2026-11-22).
- Build it rather than adopt an existing extension (2026-11-24).
- Storage on this computer, inside the extension (2026-11-24).
- **Simplify (2026-11-24):**
  - no stats section
  - only four columns: Site, Link, Category, Visits
  - text only, with no dots or chips
  - hover actions Open, Copy link, Edit, Delete
  - Gmail-style multiple selection for deleting
  - the shortcut saves instantly with no window
  - categories pre-built and picked automatically
  - an empty library shows nothing extra
  - a different URL means a different entry
- The hover toolbar and category tabs use the v1 style. Links get an underline and ↗ on hover (2026-11-24).
- It must be reachable from a phone or tablet (2026-11-24).
- The name will be decided later; start building now (2026-11-24).
- **Repository:** "whatever is best for management." Decided as a dedicated public repository named after the product, created once the name is chosen.

## 8. Calls made by Claude (open to change)

- Pagination at 50 rows per page, Gmail style, rather than infinite scroll.
- The second-level category is shown inside the Category column ("Product · Design tool") rather than as its own column. It keeps the owner's original "what kind of product" need without adding a column.
- The two-button popup on icon click.
- The URL normalisation rules (5.2).
- The fixed category list (5.5).
- Saving counts as visit 1.
- Restored session tabs don't count as visits.
- The weekly backup: on by default, keeps 4 files, never overwrites a good backup with a much smaller library.
- Import scope and merge rules (5.8).
- Plain JavaScript with no build step.
- Visual style: warm paper and ink with serif, sans and mono type. The owner hasn't commented on the palette yet.

## 9. Left to the builder

- Internal module design and CSS architecture.
- Rules weights and keyword lists (the examples in 5.5 must hold).
- Whether AI runs in the service worker or an offscreen document.
- Where Import sits next to Export.
- Loading and error states, using the existing tokens, text only.

## 10. Open

- **Product name**: the owner wants a better name than "Sheaf". Pick one before the repository is created.
