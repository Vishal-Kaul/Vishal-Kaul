# Sheaf

Sheaf is a Chrome extension that saves the web pages you want to keep, files each one into a category, and keeps a searchable library of them. Press one shortcut on any tab: the page is saved and the tab closes.

"Sheaf" is a placeholder name and may change.

## What it does

- Press **Alt+Shift+S** on any page. Sheaf saves it, files it into a category, and closes the tab.
- Click the toolbar icon for two buttons: save this page, or open your library.
- Your library lists every saved page, 50 per page, newest first. You can search, sort by any column, and filter by category.
- Sheaf counts how many times you come back to a page you saved.

Phone and tablet access is coming in a later version, through Google Drive sync.

## Install

1. Download this project as a zip from GitHub (green **Code** button, then **Download ZIP**) and unzip it. Or clone it with git.
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked**.
5. Choose the `sheaf` folder from this project.
6. Click the puzzle-piece icon in Chrome's toolbar and pin Sheaf, so the icon stays visible.

Chrome may show a reminder about "developer mode extensions" when it starts. That is expected for extensions loaded this way. Dismiss it.

If you downloaded a release zip (`sheaf-v0.1.0.zip`), unzip it first and choose the unzipped folder in step 5.

## Using it

**The shortcut.** Alt+Shift+S saves the current tab and closes it. To change the keys, go to `chrome://extensions/shortcuts` and set a new shortcut for Sheaf.

**The icon.** Click it to save the current page without closing it, or to open your library. The icon shows when the current page is already saved.

**The library.** Open it from the icon's popup, or right-click the icon and choose **Options**. Click a page's name to open it. Hover a row to copy its link, edit it, or delete it.

**Categories.** Every page is filed as a main category and a subcategory, for example "Product · Productivity". The main categories are Portfolio, Blog, Product, Service and Other. You can change any page's category in the library; your choice is never overwritten afterwards.

**Visit counting.** Only pages you have saved are counted, and each exact link is counted separately. Pages you have not saved are not tracked.

**Selecting several pages.** Tick the boxes like in Gmail. Shift-click to select a range. Delete them together, and use **Undo** if you change your mind.

**Smarter sorting (optional).** On computers where Chrome has its built-in AI, Sheaf can use it to file pages more accurately. It runs on your computer. If your computer cannot do this, Sheaf quietly uses its simpler built-in rules instead.

## Export, import and backup

- **Export** (top right of the library) downloads your saved pages as a CSV (opens in Sheets or Excel) or JSON file.
- **Import** reads a Sheaf JSON or CSV file. It also reads an old Google Sheet exported as CSV, as long as it has a column of links. Pages you already have are merged, not duplicated.
- **Weekly backup.** Once a week Sheaf saves a backup file into your Downloads folder, in a folder called `Sheaf`. It keeps the latest 4. You can turn this off at the bottom of the library.

To restore: open the library, click **Import**, and choose a backup file.

## Permissions, in plain words

Chrome shows a warning when you install: **"Read your browsing history"**. This comes from the `tabs` permission. Sheaf needs it to notice when you open a page you saved, so it can count visits. Nothing leaves your computer. Sheaf makes no network requests at all.

| Permission | Why |
| --- | --- |
| `storage`, `unlimitedStorage` | Keep your library on this computer, however big it grows |
| `tabs` | Know the address and title of the page you save, close it after saving, and count visits to saved pages |
| `activeTab`, `scripting` | Read the page you are saving (its title and description) to file it |
| `alarms` | Run the weekly backup |
| `downloads` | Write the backup file and exports into your Downloads folder |

## Where your data lives

On this computer, in Chrome's extension storage. Nothing is uploaded. Removing the extension deletes your library, so use **Export** first if you want to keep it.

## For developers

No build step and no dependencies. Needs Node 22.

- Unit tests: `cd sheaf && node --test`
- Browser tests (need Playwright and Chromium installed): `cd sheaf && npm run e2e`. This includes a check that 20,000 saved pages stay fast, and a check that the release zip loads.
- Release zip: `cd sheaf && node tools/release.mjs` writes `dist/sheaf-v<version>.zip`, without tests or tools.

## Licence

MIT. See `LICENSE`.
