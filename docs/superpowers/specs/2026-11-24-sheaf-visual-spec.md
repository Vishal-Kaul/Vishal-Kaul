# Sheaf: Build Spec v1.0 (Figma Plugin API)

Follow this literally. Every value is final. Units are px. Notation:
- **H-AL / V-AL**: horizontal / vertical auto-layout (`layoutMode`).
- **pad T R B L**: padding in CSS order. **gap**: `itemSpacing`.
- **fill-w / fill-h**: `layoutSizingHorizontal/Vertical = "FILL"`. **hug** = `"HUG"`. A number = `"FIXED"`.
- **abs**: `layoutPositioning = "ABSOLUTE"`, then set x/y relative to the parent frame.
- **stroke B1 #hex**: stroke color with `strokeBottomWeight = 1` and the other sides set to 0 (same pattern for T/R/L). Use `strokeAlign = "INSIDE"` unless stated otherwise.
- Text nodes use `textAutoResize = "WIDTH_AND_HEIGHT"` unless the spec gives a width. All sample text is pre-fitted to its column, so nothing needs truncating. As a safety net, Summary cells use `textTruncation = "ENDING"`.
- Name every layer exactly as written in `quotes`.

## 0. Orchestrator amendments (these override anything below)

1. **Font swap:** "Inter Tight" is NOT installed in this Figma account. Every "Inter Tight" in the original spec has been replaced with **"Instrument Sans"** (styles available: "Regular", "Medium", "SemiBold", "Bold"; note: no space in "SemiBold"). Fallback stays Inter.
2. **Verified available font style names** in this file: Instrument Serif ["Regular","Italic"], Instrument Sans ["Regular","Medium","SemiBold","Bold"], DM Mono ["Regular","Medium","Light","Italic"], Inter ["Regular","Medium","Semi Bold","Bold","Italic"], Roboto Mono ["Regular","Medium"].
3. **Arrow/dot glyphs** (`↗ ↓ → ·`) are set in Inter, not Instrument Sans.
4. **Table/Row variants:** all three variants contain the same layers *including* a `Table/RowActions` abs child; it is `visible = false` in Default and Empty, visible only in Hover.
5. The file key is `RIPdRfahgtktGA1abkfVDX`, page "Page 1" (id 0:1), which is currently empty.

---

## 1. Product name

| Option | Why | Verdict |
|---|---|---|
| **Sheaf** | A gathered bundle of sheets. It nods to the spreadsheet and to collecting. Short, quiet, easy to own. | **Chosen** |
| Tabled | Set aside for later, plus table and tabs. But "tabled" means opposite things in UK and US English. | Rejected |
| Vitrine | A specimen display cabinet. Elegant, but hard to spell and say. | Rejected |

The logo is the wordmark **"Sheaf"** set in Instrument Serif, next to a "selected cell" mark: a 2×2 grid with the top-left cell filled vermilion.

## 2. Design direction: "The Research Ledger"

Sheaf looks like an archivist's ledger built on a spreadsheet's bones: warm paper, near-black ink and one vermilion mark, like a librarian's red pencil. The spreadsheet parts stay because scanning is the job. Those parts are column letters, row numbers, a frozen header, a hairline grid and monospaced data columns, so a domain is always found by reading straight down one column.

The personality comes from editorial details, not chrome:
- An Instrument Serif title and stat numbers.
- An accountant's double rule under the header.
- Category filters drawn as index-card divider tabs that join the sheet.
- Personal notes set in serif italic, like pencilled marginalia.
- A logo that is literally "the selected cell". The same vermilion selection ring appears when you edit a cell.

It suits a UX researcher who catalogues specimens every day: it treats their saves as a curated collection, not a dump of links. It is not a Google Sheet clone. There is no toolbar ribbon, no blue, no formula bar, and the colour, type and tabs come from print and archiving.

Mood: archival, calm, precise, warm, editorial, quietly witty.

---

## 3. Tokens

Create one variable collection `Sheaf Tokens` with a single mode `Light`, and add every color below as a COLOR variable using the name shown. Bind component fills and strokes with `setBoundVariableForPaint`. Frames may use raw hex values, but they must match these exactly.

### 3.1 Color

| Variable | Hex | Use |
|---|---|---|
| color/paper | #F3F0E8 | App canvas, top bar |
| color/sheet | #FBFAF6 | Table sheet, popups, cards, active tab |
| color/white | #FFFFFF | Inputs, menus, keycaps |
| color/sheet-head | #EFEBE2 | Column-letter row, row-number gutter |
| color/header | #F7F4EC | Table header row, sheet footer |
| color/row-hover | #F3EEE3 | Hovered row, hovered menu item |
| color/head-hover | #E6E0D3 | Gutter cell of the hovered row |
| color/ink | #1C1B18 | Primary text, primary button |
| color/ink-2 | #4A463F | Secondary text (8.9:1 on sheet) |
| color/ink-3 | #6F6A61 | Tertiary text, meta (≥4.5:1 on paper, sheet and sheet-head) |
| color/ink-4 | #A8A296 | Decorative only, never text |
| color/rule | #E5E0D5 | Row hairlines, dividers |
| color/rule-soft | #EEEAE1 | Vertical column lines |
| color/rule-head | #E2DCCF | Lines inside the letter row and gutter |
| color/rule-strong | #CFC8B8 | Sheet border, input borders, tab border |
| color/rule-ledger | #BDB5A3 | Header double rule, dashed empty-state border |
| color/accent | #C93A22 | Vermilion: logo cell, active tab count, selection ring, stars |
| color/accent-ink | #A3301B | Text on accent-tint |
| color/accent-tint | #F6DED8 | Active column letter and row number |
| color/success | #1F7A55 | Success badge, "stored" dot |
| color/success-ink | #1F6247 | Text on success-tint |
| color/success-tint | #DDEEE6 | "Already saved" pill, just-saved halo |
| color/danger | #A8321D | Destructive text on light |
| color/on-ink | #FBFAF6 | Text on ink |
| color/on-ink-2 | #BDB7AA | Secondary text on ink |
| color/on-ink-accent | #FF8A73 | Delete and Undo labels on ink |
| color/ink-raised | #34322D | Dark keycap, hovered button on ink |
| color/ink-line | #4A4740 | Dividers on ink |

### 3.2 Category colors

The label text is always shown, so a category is never identified by colour alone. Each text colour passes AA (≥4.5:1) on its background.

| Category | bg | text | dot | Contrast |
|---|---|---|---|---|
| Portfolio | #F6E1E4 | #8C2944 | #C9476A | 6.7:1 |
| Blog | #F5EACB | #7A5300 | #C98A0B | 5.7:1 |
| Product | #E3E8F7 | #2A3F8F | #3D5BD9 | 7.8:1 |
| Service | #DDEEE6 | #1F6247 | #2F8F68 | 6.0:1 |
| Other | #ECE8DF | #4A463F | #8A857A | 7.7:1 |

Variables: `cat/portfolio/bg`, `cat/portfolio/text`, `cat/portfolio/dot`, and so on for each category.

### 3.3 Type styles

Create these as local text styles. Letter spacing is in px. Line height is in px.

| Style | Family | Style | Size | LH | LS | Use |
|---|---|---|---|---|---|---|
| display/xl | Instrument Serif | Regular | 48 | 52 | -0.5 | "Library", "Foundations" |
| display/lg | Instrument Serif | Regular | 40 | 44 | -0.4 | Empty-state headline |
| display/md | Instrument Serif | Regular | 36 | 40 | -0.3 | Stat values |
| display/sm | Instrument Serif | Regular | 24 | 28 | -0.2 | Popup fact values |
| display/section | Instrument Serif | Regular | 32 | 36 | -0.3 | Spec-sheet section titles (E, F) |
| logo/lg | Instrument Serif | Regular | 26 | 28 | -0.3 | Dashboard wordmark |
| logo/sm | Instrument Serif | Regular | 20 | 24 | -0.2 | Popup wordmark |
| note | Instrument Serif | Italic | 16 | 20 | 0 | Personal notes, note placeholder |
| title/md | Instrument Sans | Medium | 15 | 20 | -0.1 | Popup page title |
| body/lg | Instrument Sans | Regular | 15 | 22 | 0 | Empty-state paragraph |
| body/md | Instrument Sans | Regular | 14 | 20 | 0 | General |
| body/sm | Instrument Sans | Regular | 13 | 18 | 0 | Table cells |
| body/sm-strong | Instrument Sans | Medium | 13 | 18 | 0 | Site names, md/lg button labels, tabs (active) |
| body/xs | Instrument Sans | Regular | 12 | 16 | 0 | Footer reassurance |
| label/sm | Instrument Sans | Medium | 12 | 16 | 0 | Chips, header cells, sm buttons |
| label/caps | Instrument Sans | Medium | 11 | 14 | 0.66 | Section labels. Type the text in UPPERCASE. |
| mono/sm | DM Mono | Regular | 12 | 16 | 0 | Domains, dates |
| mono/sm-strong | DM Mono | Medium | 12 | 16 | 0 | Visit numbers, "Today" |
| mono/xs | DM Mono | Regular | 11 | 14 | 0.2 | Row numbers, letters, meta captions |
| mono/key | DM Mono | Medium | 11 | 14 | 0 | Keycaps, count pills |

**Font loading.** Wrap every `loadFontAsync` in try/catch and apply these fallbacks:
- Instrument Serif Regular → Inter "Semi Bold", at `round(size × 0.8)`, with the same line height and LS 0.
- Instrument Serif Italic → Inter "Italic", at `round(size × 0.85)`.
- Instrument Sans Regular/Medium → Inter Regular/Medium, same size.
- DM Mono Regular/Medium → Roboto Mono Regular/Medium, same size.

Only Regular, Medium and Italic are used, which avoids the "Semi Bold" vs "SemiBold" naming problem.

**Glyph rule.** Only these text glyphs may be used, and they must be set in **Inter** (Regular or Medium, same size as surrounding text), because Instrument Sans may lack arrow glyphs: `↗ ↓ → ·`. Every other icon is a vector (see 4.1).

### 3.4 Spacing, radii, strokes, shadows

- **Spacing scale:** 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64.
- **Radii:** 4 (keycap, sm chip, selection), 6 (md chip, menu item, action button), 8 (buttons, inputs, tab tops), 10 (toast, menu, 40 px favicon, fact box), 12 (sheet, popups, tiles), 999 (pills).
- **Strokes:** hairline 1, mark/glyph 1.5, selection 2.

Effect styles:

| Style | Layers (all DROP_SHADOW, color #1C1B18 unless stated) |
|---|---|
| shadow/popover | α0.14, offset 0/8, blur 24 · α0.08, 0/1, blur 2 |
| shadow/toast | α0.28, 0/10, blur 30 · α0.12, 0/2, blur 4 |
| shadow/actions | α0.18, 0/4, blur 12 |
| shadow/key-light | #CFC8B8 α1, 0/1, blur 0 |
| shadow/key-dark | #0E0D0B α1, 0/1, blur 0 |

---

## 4. Components

Place every component set inside the frame `Components` (see section 6).

### 4.1 Glyphs and the logo mark

- **`Glyph/Chevron`** 8×5: a vector with path `M 0.75 0.75 L 4 4.25 L 7.25 0.75`. Stroke 1.5, round cap and join, no fill. Default color ink-3.
- **`Glyph/Check`** 10×8: a vector with path `M 1 4.2 L 3.8 7 L 9 1`. Stroke 1.6, round cap and join.
- **`Glyph/Search`** 14×14: an ellipse at x1 y1, 9×9, stroke 1.5, no fill, plus a vector `M 8.8 8.8 L 12.5 12.5` with stroke 1.5 and round cap. Color ink-3.
- **`Glyph/Star`** 12×12: `figma.createStar()` with `pointCount` 5 and `innerRadius` 0.45. Fill accent.
- **`Logo/Mark`**, variants `Cell=Filled|Empty`:
  - Frame 22×22, radius 5, `clipsContent` true, fill sheet, stroke 1.5 INSIDE ink.
  - Children in this order:
    1. `cell`: rect at x0 y0, 11×11, fill accent. Hidden in the Empty variant.
    2. `v-rule`: rect at x10.25 y0, 1.5×22, fill ink.
    3. `h-rule`: rect at x0 y10.25, 22×1.5, fill ink.
  - For other sizes, create an instance and call `instance.rescale(target/22)`. Sizes used: 16, 20, 22, 28, 32.

### 4.2 Keycap: `Keycap`, variants `Tone=Light|Dark`

- H-AL, height 20, min-width 20, pad 0 6, radius 4, center/center. Text uses mono/key.
- **Light:** fill white, stroke 1 rule-strong, effect shadow/key-light, text ink-2.
- **Dark:** fill ink-raised, no stroke, effect shadow/key-dark, text on-ink-2.
- Shortcut sets are always three keycaps, "Alt", "Shift" and "S", in an H-AL group with gap 4.

### 4.3 Button: `Button`, variants `Type=Primary|Secondary|Ghost` × `Size=sm|md|lg`

| Size | Height | Pad | Label style |
|---|---|---|---|
| sm | 28 | 0 10 | label/sm |
| md | 36 | 0 14 | body/sm-strong |
| lg | 44 | 0 16 | body/sm-strong |

All sizes: H-AL, gap 8, radius 8, center/center.

| Type | Fill | Stroke | Label |
|---|---|---|---|
| Primary | ink | none | on-ink |
| Secondary | sheet | 1 rule-strong | ink |
| Ghost | none | none | ink-2 |

There is an optional trailing slot for a chevron, keycaps or an `↗` text glyph.

### 4.4 Category chip: `Chip/Category`, variants `Category=Portfolio|Blog|Product|Service|Other` × `Style=Solid-sm|Solid-md|Outline-md`

- **Solid-sm** (used in the table): H-AL hug, height 22, pad 0 8, gap 6, radius 4, fill cat bg. Children: `dot` ellipse 6×6 in the cat dot color, then the label in label/sm, cat text color.
- **Solid-md** (selected chip in the popup): height 26, pad 0 8, gap 6, radius 6, fill cat bg, stroke 1 in the cat dot color. Same children as Solid-sm.
- **Outline-md** (unselected option in the popup): height 26, pad 0 8, radius 6, fill white, stroke 1 rule-strong. **No dot.** Label in label/sm, ink-2.
- Label text is exactly "Portfolio", "Blog", "Product", "Service" or "Other".

### 4.5 Subcategory tag: `Tag/Sub`, variants `Style=Text|Inline|Field`

- **Text** (table): the label alone in body/sm, ink-2. No container styling.
- **Inline:** H-AL, height 26, pad 0 8 0 10, gap 6, radius 6, fill white, stroke 1 rule-strong. Label in label/sm ink, followed by `Glyph/Chevron`.
- **Field:** H-AL, fill-w, height 36, pad 0 12, SPACE_BETWEEN, radius 8, fill white, stroke 1 rule-strong. Label in body/sm ink, followed by `Glyph/Chevron`.

### 4.6 Favicon: `Favicon`, variants `Size=20|40`

- **20:** frame 20×20, radius 5, center/center. Child `letter` in Instrument Sans Medium 11/14.
- **40:** frame 40×40, radius 10. Child `letter` in Instrument Sans Medium 18/22.
- The fill color, the letter and the letter color are overridden per site (see the data table).

### 4.7 Search field: `Search/Field`

- 400×36, H-AL, pad 0 8 0 12, gap 8, center, radius 8, fill sheet, stroke 1 rule-strong.
- Children:
  1. `Glyph/Search`.
  2. `placeholder` text in body/sm, ink-3, fill-w.
  3. `Keycap` Light with "/".

### 4.8 Filter tab: `Tab/Filter`, variants `State=Active|Inactive`

Both states: H-AL, height 36, pad 0 14, gap 8, center, top-left and top-right radius 8, bottom radii 0.

- **Inactive:** no fill, no stroke. Children:
  1. `dot` 6×6 in the cat dot color. Hidden on the "All" tab.
  2. `label` in body/sm, ink-2.
  3. `count` in mono/xs, ink-3.
- **Active:** fill sheet, stroke rule-strong with T1, L1, R1 and B0. Children:
  1. `dot`: same rules as Inactive.
  2. `label` in body/sm-strong, ink.
  3. `count` pill: H-AL, height 18, pad 0 6, radius 999, fill accent. Its text is mono/key in #FFFFFF (5.1:1).

### 4.9 Stat item: `Stat`

- V-AL, pad 20 24 0 24, gap 4, stroke L1 rule.
- Children:
  1. `label` in label/caps, ink-3.
  2. `value` in display/md, ink.
  3. `caption` in mono/xs, ink-3.

### 4.10 Table parts

- **`Table/LetterCell`**, variants `State=Default|Active`: height 24, center/center, fill sheet-head, stroke rule-head with R1 and B1. Text in mono/xs, ink-3. Active: fill accent-tint, text accent-ink.
- **`Table/RowNumber`**, variants `State=Default|Hover|Active`: width 44, fill-h, center/center, fill sheet-head, stroke R1 rule-head, `num` text in mono/xs ink-3.
  - Hover: fill head-hover, text ink.
  - Active: fill accent-tint, text accent-ink.
- **`Table/HeaderCell`**, variants `Align=Left|Right` × `Sorted=False|True`: height 36, pad 0 12, gap 4, center, fill header, stroke R1 rule-soft. `label` in label/sm, ink-2.
  - Right: `primaryAxisAlignItems = "MAX"`.
  - Sorted=True: label in ink, followed by a text "↓" in Instrument Sans Medium 12, ink.
- **`Table/RowActions`**:
  - H-AL, pad 3, gap 2, center, radius 8, fill ink, effect shadow/actions.
  - Each child `act` button is H-AL, height 24, pad 0 9, radius 6, label in label/sm on-ink.
  - Children in order:
    1. "Open ↗" with fill ink-raised (it is the focused action).
    2. "Copy link".
    3. "Edit".
    4. `div`: rect 1×14 in ink-line.
    5. "Delete" with its label in on-ink-accent.
- **`Table/Row`**, variants `State=Default|Hover|Empty`:
  - Row frame: H-AL, width 1360, height 46, fill sheet, stroke B1 rule. All three variants keep identical layers. The Empty variant just hides every content node (`visible = false`).
  - Cells in order, each `layoutSizingVertical = FILL`, H-AL, pad 0 12, vertically centered, stroke R1 rule-soft. The last cell has no stroke.

| Cell | W | Content (layer names) |
|---|---|---|
| `num` | 44 | `Table/RowNumber` instance |
| `site` | 196 | gap 10: `Favicon` 20 · `name` (body/sm-strong ink) · `star` (`Glyph/Star`, gap 6 after name, hidden unless starred) |
| `link` | 176 | gap 4: `domain` (mono/sm ink-2) · `go` "↗" (body/sm ink-3, hidden in Default) |
| `category` | 116 | `Chip/Category` Solid-sm |
| `type` | 128 | `Tag/Sub` Text |
| `summary` | 300 | `summary` (body/sm ink, fill-w, truncation ENDING) |
| `note` | 144 | `note` (note style, ink-2) |
| `visits` | 84 | right-aligned, gap 8: `track` frame 28×4, radius 2, fill rule, containing `bar` (rect at x0, height 4, radius 2, fill ink-3, width per data) · `count` (mono/sm-strong ink, fixed width 18, text-align RIGHT) |
| `saved` | 72 | `saved` (mono/sm ink-2) |
| `last` | 100 | `last` (mono/sm ink-2. When the value is "Today", use mono/sm-strong in ink.) |

  Column widths sum to 1360.

  - **Hover variant:**
    - Row fill row-hover. RowNumber uses State=Hover.
    - `domain` turns ink with `textDecoration = "UNDERLINE"`, and `go` becomes visible.
    - Add a `Table/RowActions` instance as an abs child. Set `y = 8` and `x = 1360 − 10 − actions.width`, with constraint horizontal RIGHT.

### 4.11 Menu: `Menu/Category`

- V-AL, width 200, pad 6, gap 0, radius 10, fill white, stroke 1 rule-strong, effect shadow/popover.
- Children:
  1. `head`: pad 8 8 4 8, text "MOVE TO CATEGORY" in label/caps, ink-3.
  2. Five `Menu/Item` rows, each H-AL, fill-w, height 32, pad 0 8, gap 8, radius 6, center. Children: `dot` 6×6 in the cat dot color · `label` in body/sm ink, fill-w · `check` (`Glyph/Check` in ink, visible only when selected).
     - Variants: `State=Default|Hover|Selected`.
     - Hover has fill row-hover.
     - Selected has its label in body/sm-strong and a visible check.
  3. `div`: frame fill-w, pad 4 0, containing a rect fill-w×1 in rule.
  4. `foot`: H-AL, height 28, pad 0 8, center. Text "Auto-filed by on-device AI" in mono/xs, ink-3.

### 4.12 Toolbar icon: `Toolbar/Icon`, variants `State=Not saved|Saved|Just saved`

- The base is a frame 32×32, no fill, `clipsContent` false. It contains a `Logo/Mark` rescaled to 28, placed at x2 y2.
- **Not saved:** Mark Cell=Empty.
- **Saved:** Mark Cell=Filled. Add a `badge` as an abs child:
  - Position x15 y19, height 15. H-AL, pad 0 4, center, radius 4.
  - Fill ink, stroke 1.5 OUTSIDE #FFFFFF.
  - Text "14" in DM Mono Medium 10/12, #FFFFFF.
- **Just saved:** Mark Cell=Filled.
  - First child is a `halo` ellipse 48×48 at x−8 y−8, fill success-tint, placed behind the mark.
  - Add a `badge` as an abs child at x17 y19, 15×15, radius 4, fill success, stroke 1.5 OUTSIDE #FFFFFF. It contains `Glyph/Check` scaled to 8×6, stroke #FFFFFF, centered.

### 4.13 Toast: `Toast`

- H-AL, height 44, pad 0 6 0 12, gap 10, center, radius 10, fill ink, effect shadow/toast.
- Children in order:
  1. `Logo/Mark` at 16 (Filled).
  2. "Saved" in body/sm-strong, on-ink.
  3. "·" in body/sm, on-ink-2.
  4. "Product → Design tool" in body/sm, on-ink-2.
  5. `div` rect 1×20 in ink-line.
  6. `undo`: H-AL, height 32, pad 0 10, radius 7, label "Undo" in body/sm-strong, on-ink-accent.

---

## 5. Frames

### 5.0 Canvas placement (Page 1)

The frames sit in one row with 160 gaps. `Components` goes in a second row.

| Frame name | W × H | x | y |
|---|---|---|---|
| `A — Dashboard` | 1440 × 1024 | 0 | 0 |
| `B — Dashboard · Empty` | 1440 × 1024 | 1600 | 0 |
| `C — Popup · New site` | 360 × hug (≈508) | 3200 | 0 |
| `D — Popup · Already saved` | 360 × hug (≈498) | 3720 | 0 |
| `E — Toolbar icon & toast` | 960 × hug (≈656) | 4240 | 0 |
| `F — Foundations` | 1440 × hug (≈1160) | 5360 | 0 |
| `Components` | 1440 × hug | 0 | 1184 |

### 5.1 A — Dashboard (1440 × 1024)

Root: V-AL, gap 0, fill paper, `clipsContent` true. It has two children, `TopBar` and `Body`, plus abs overlays (5.1.6).

#### 5.1.1 `TopBar` (y 0–72)

- H-AL, fill-w, height 72, pad 0 40, SPACE_BETWEEN, center. Fill paper, stroke B1 rule.
- **`Left`** (H-AL, gap 56, center):
  - `Logo`: H-AL, gap 10, center. Contains `Logo/Mark` 22 Filled and "Sheaf" in logo/lg, ink.
  - `Search/Field` with placeholder "Search 248 sites, links and notes".
- **`Right`** (H-AL, gap 12, center):
  1. `Hint`: H-AL, gap 8, center. "Save any tab" in body/sm ink-2, then Keycaps Light "Alt" "Shift" "S".
  2. `div`: rect 1×20 in rule-strong.
  3. Button Ghost md "Import".
  4. Button Secondary md "Export", with a trailing `Glyph/Chevron` in ink-2.

#### 5.1.2 `Body`

- V-AL, fill-w, fill-h, pad 0 40 32 40, gap 24.
- Children: `Stats` (y 72–184), then `TabsGroup`, which contains the tab row (y 208–244) and the sheet (y 244–992).

**`Stats`**: H-AL, fill-w, height 112, gap 0, align top.
- `TitleBlock`: width 352, fill-h, V-AL, pad 24 0 0 0, gap 6. Contains "Library" in display/xl ink, then "Sun, 22 Nov 2026" in mono/xs ink-3.
- Four `Stat` instances, each with `layoutGrow` 1 and fill-h (252 wide each):

| label | value | caption |
|---|---|---|
| SAVED | 248 | sites in your library |
| THIS WEEK | 17 | +5 on last week |
| TABS CLOSED | 231 | without losing a thing |
| MOST VISITED | Linear | linear.app · 23 visits |

**`TabsGroup`**: V-AL, fill-w, gap 0.

**`TabsRow`**: H-AL, fill-w, height 36, SPACE_BETWEEN, center.
- `Tabs` (H-AL, gap 2, align bottom), using `Tab/Filter`:

| Tab | State | Count | Dot color |
|---|---|---|---|
| All | Active | 248 | none |
| Portfolio | Inactive | 41 | Portfolio dot |
| Blog | Inactive | 37 | Blog dot |
| Product | Inactive | 96 | Product dot |
| Service | Inactive | 29 | Service dot |
| Other | Inactive | 45 | Other dot |

- `Sort`: Button Secondary sm. Content (gap 6): "Sort" in label/sm ink-3 · "Last visit" in label/sm ink · `Glyph/Chevron`.

#### 5.1.3 `Sheet` (y 244–992)

- V-AL, width 1360, height 748, gap 0, fill sheet, stroke 1 INSIDE rule-strong.
- Radii: top-left 0, top-right 12, bottom-right 12, bottom-left 12. `clipsContent` true.

1. **`Letters`** (H-AL, height 24): a corner cell 44 wide with the same styling as LetterCell but no text, followed by `Table/LetterCell` instances using the column widths from 4.10, with the texts **A B C D E F G H I**. Set **C to State=Active**.
2. **`Header`**:
   - H-AL, height 36, stroke B1 rule-ledger.
   - Add an abs child `ledger-line`: rect at x0 y32, width 1360, height 1, fill rule-ledger, constraint horizontal STRETCH. Together with the bottom stroke this forms the double rule.
   - Cells: a gutter cell 44 wide (fill sheet-head, stroke R1 rule-head, empty), then `Table/HeaderCell` instances:

| Label | Align | Sorted |
|---|---|---|
| Site | Left | False |
| Link | Left | False |
| Category | Left | False |
| Type | Left | False |
| Summary | Left | False |
| Note | Left | False |
| Visits | Right | False |
| Saved | Left | False |
| Last visit | Left | **True** (shows ↓) |

3. **Rows 1–14**: `Table/Row` instances filled from the data table in 5.1.5.
   - Row n spans y = 304 + 46·(n−1) in frame coordinates.
   - **Row 3 uses State=Hover.**
   - **Row 9's** RowNumber uses State=Active.
4. **`Footer`**: H-AL, fill-w, height 44, pad 0 16, SPACE_BETWEEN, center, fill header.
   - Left: "Showing 14 of 248 · sorted by last visit" in mono/xs, ink-3.
   - Right (H-AL, gap 8, center):
     1. A 6×6 ellipse in success.
     2. "Stored on this device" in body/xs, ink-2.
     3. "·" in body/xs, ink-3.
     4. "Unlimited" in body/xs, ink-2.
     5. "·" in body/xs, ink-3.
     6. "Free & open source" in body/xs, ink-2.

#### 5.1.4 Column x positions (frame coordinates)

| Column | x range |
|---|---|
| num | 40–84 |
| site | 84–280 |
| link | 280–456 |
| category | 456–572 |
| type | 572–700 |
| summary | 700–1000 |
| note | 1000–1144 |
| visits | 1144–1228 |
| saved | 1228–1300 |
| last | 1300–1400 |

#### 5.1.5 Row data (sorted by Last visit)

"(empty)" means the text is set to an empty string. Bar is the width of `bar` in px, calculated as round(28 × visits / 23) with a minimum of 2.

| # | Name | Domain | Favicon fill | Letter / color | Category | Type | Summary | Note | Visits | Bar | Saved | Last | ★ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Linear | linear.app | #5E6AD2 | L / #FFFFFF | Product | Dev tool | Issue tracking with a keyboard-first UI | steal the cmd menu | 23 | 28 | 03 Oct | Today | ★ |
| 2 | Framer | framer.com | #0055FF | F / #FFFFFF | Product | Design tool | No-code sites with design-tool controls | (empty) | 14 | 17 | 12 Oct | Today | |
| 3 | Mobbin | mobbin.com | #111111 | M / #FFFFFF | Other | UI reference | Searchable library of real app screens | onboarding flows | 19 | 23 | 05 Oct | Today | |
| 4 | Rauno Freiberg | rauno.me | #F1F0EC + stroke 1 #CFC8B8 | R / #1C1B18 | Portfolio | Design engineer | Craft notes on interaction details | study the menus | 9 | 11 | 21 Oct | Yesterday | |
| 5 | Spline | spline.design | #6B4EFF | S / #FFFFFF | Product | Design tool | Browser 3D design with live collaboration | learn: materials | 11 | 13 | 28 Oct | Yesterday | ★ |
| 6 | Nielsen Norman | nngroup.com | #2A2A2A | N / #FFFFFF | Blog | UX research | Research-backed articles on usability | cite in reports | 16 | 19 | 02 Oct | 2d ago | |
| 7 | Stripe | stripe.com | #635BFF | S / #FFFFFF | Product | Fintech | Payments API with famously clear docs | (empty) | 7 | 9 | 09 Oct | 3d ago | |
| 8 | Bruno Simon | bruno-simon.com | #E8A33D | B / #1C1B18 | Portfolio | 3D developer | Drivable 3D portfolio built in Three.js | how is it lit? | 5 | 6 | 19 Nov | 3d ago | ★ |
| 9 | Basement Studio | basement.studio | #FF4D00 | B / #FFFFFF | Product | Dev tool | Dev-led studio with loud, playful sites | (empty) | 4 | 5 | 06 Nov | 5d ago | |
| 10 | Smashing Magazine | smashingmagazine.com | #D33A2C | S / #FFFFFF | Blog | Design | Long-form articles on UX and front-end | (empty) | 6 | 7 | 18 Oct | 1w ago | |
| 11 | Overreacted | overreacted.io | #FFA7C4 | O / #282C35 | Blog | Engineering | Dan Abramov on React and mental models | (empty) | 3 | 4 | 25 Oct | 1w ago | |
| 12 | Brittany Chiang | brittanychiang.com | #0A192F | B / #64FFDA | Portfolio | Developer | Minimal dev portfolio, sharp layout | (empty) | 8 | 10 | 15 Oct | 2w ago | |
| 13 | Pentagram | pentagram.com | #111111 | P / #FFFFFF | Service | Consulting | Design consultancy with deep case studies | (empty) | 1 | 2 | 08 Nov | 2w ago | |
| 14 | Godly | godly.website | #FFD60A | G / #1C1B18 | Other | Inspiration | Curated gallery of striking web design | (empty) | 12 | 15 | 01 Oct | 3w ago | |

- **Hover row:** row 3 (Mobbin). Its action toolbar covers the Visits, Saved and Last cells. That is intended.
- **Edit row:** row 9 (Basement Studio). The on-device AI misfiled it as Product → Dev tool, and the user is moving it to Service, so the cell still shows the AI's guess. This is the "correct the AI" moment. Keep the chip as **Product** and the type as **Dev tool**.

#### 5.1.6 Overlays

These are abs children of the root `A — Dashboard`, added in this order:

1. **`tab-joiner`**: rect at x 41, y 244, width = (All tab width − 2), height 1, fill sheet. It hides the sheet border under the active tab.
2. **`selection-ring`**: rect at x 456, y 672, 116×46, no fill, stroke 2 INSIDE accent.
3. **`fill-handle`**: rect at x 569, y 715, 6×6, fill accent, stroke 1 OUTSIDE sheet.
4. **`category-menu`**: a `Menu/Category` instance at x 456, y 722. Items in order:
   - Portfolio: Default.
   - Blog: Default.
   - **Product: Selected**, showing the check.
   - **Service: Hover**.
   - Other: Default.

### 5.2 B — Dashboard · Empty (1440 × 1024)

Duplicate A, then make these changes:

- Search placeholder: "Search sites, links and notes".
- Caption under "Library": "Sun, 22 Nov 2026 · nothing saved yet".
- Stats:

| label | value | caption |
|---|---|---|
| SAVED | 0 | sites in your library |
| THIS WEEK | 0 | nothing saved yet |
| TABS CLOSED | 0 | close one with Save & close |
| MOST VISITED | — | counts start after saving |

- Every tab count is "0". All stays Active. Re-measure and resize the `tab-joiner`.
- Delete `selection-ring`, `fill-handle` and `category-menu`. Set letter C back to Default.
- The 14 rows use State=Empty, with row numbers 1–14 still visible, so the empty grid shows.
- Footer left text: "No sites yet".
- **`EmptyCard`** (abs in the root, x 440, y = 304 + (644 − card.height)/2, which is about 391):
  - V-AL, width 560, hug height, pad 40 48, gap 20, center-aligned. Fill sheet (this masks the grid).
  - Stroke 1 INSIDE rule-ledger with `dashPattern [6,4]` and radius 12: the "marching-ants" range waiting to be filled.
  - Children:
    1. `Logo/Mark` at 32, Filled.
    2. "Close a tab. Keep the site." in display/lg, ink, centered.
    3. "Sheaf files every page you save into a category and counts each time you come back. It all stays on this device." in body/lg, ink-2, centered, fixed width 440.
    4. **`Steps`**: V-AL, width 464, fill white, stroke 1 rule-strong, radius 10, clip.
       - Three rows, each H-AL, fill-w, height 52, pad 0 16, gap 14, center, stroke B1 rule. The last row has no stroke.
       - Each row starts with a `n` cell: 24×24, radius 4, fill sheet-head, holding the step number ("1", "2", "3") in mono/xs ink-3, centered. The step text follows in body/sm, ink:
         - Row 1: "Pin Sheaf: open Chrome's puzzle-piece menu and click the pin."
         - Row 2: H-AL, gap 6: "On any site, press" · Keycaps Light "Alt" "Shift" "S" · "or click the Sheaf icon."
         - Row 3: "Choose Save & close tab. The site lands here, already sorted."
    5. **`Import`**: H-AL, gap 6, center. "Moving from another browser?" in body/sm ink-2, then Button Ghost sm "Import CSV or JSON" with its label in ink and `textDecoration UNDERLINE`.

### 5.3 C — Popup · New site (360 × hug)

Root: V-AL, width 360, gap 0, fill sheet, radius 12, stroke 1 INSIDE rule-strong, effect shadow/popover, clip. "Divider" means a rect fill-w×1 in rule.

1. **`Header`**: H-AL, fill-w, height 48, pad 0 16, SPACE_BETWEEN, center.
   - Left (gap 8): `Logo/Mark` 20 Filled and "Sheaf" in logo/sm, ink.
   - Right: "Not saved yet" in mono/xs, ink-3.
2. Divider.
3. **`Page`**: H-AL, fill-w, pad 16, gap 12, align top.
   - `Favicon` 40: fill #1D1D1D, letter "R" in #FFFFFF.
   - `Text` (V-AL, fill-w, gap 4):
     - "Rive — Build interactive motion" in title/md, ink.
     - "rive.app" in mono/sm, ink-3.
     - "Interactive animations that run in any app" in body/sm, ink-2.
4. **`Classify`**: V-AL, fill-w, pad 0 16 16 16, gap 10.
   - `Category` (V-AL, gap 8):
     - Label row (SPACE_BETWEEN): "CATEGORY" in label/caps ink-3, and "Auto-filed · on-device" in mono/xs ink-3.
     - `Chips` (H-AL, gap 4, `layoutWrap WRAP`, `counterAxisSpacing` 4), in this order:
       - Portfolio: Outline-md.
       - Blog: Outline-md.
       - **Product: Solid-md**.
       - Service: Outline-md.
       - Other: Outline-md.
   - `Type` (V-AL, gap 8): "TYPE" in label/caps ink-3, then `Tag/Sub` Field "Design tool".
   - `Note` (V-AL, gap 8):
     - Label row (SPACE_BETWEEN): "NOTE" in label/caps ink-3, and "Optional" in mono/xs ink-3.
     - `Textarea`: fill-w, height 52, pad 10 12, radius 8, fill white, stroke 1 rule-strong. Placeholder "Why are you saving this?" in the note style, ink-3.
5. **`Actions`**: V-AL, fill-w, pad 0 16 16 16, gap 8.
   - Button Primary lg, fill-w, pad 0 12 0 16, SPACE_BETWEEN: "Save & close tab", then Keycaps Dark "Alt" "Shift" "S" (gap 4).
   - Button Secondary md, fill-w, centered: "Save, keep open".
6. Divider.
7. **`Footer`**: H-AL, fill-w, height 44, pad 0 16, SPACE_BETWEEN, center.
   - Left: "Open library ↗" in body/sm-strong, ink.
   - Right: "248 saved · this device" in mono/xs, ink-3.

### 5.4 D — Popup · Already saved (360 × hug)

The root, `Header` structure and dividers are the same as C.

1. **`Header`** right side: a `Saved` pill.
   - H-AL, height 22, pad 0 8 0 6, gap 4, radius 999, fill success-tint.
   - Contains `Glyph/Check` stroked in success, then "Already saved" in label/sm, success-ink.
2. Divider.
3. **`Page`**: as in C, with:
   - Favicon 40 fill #0055FF, letter "F" in #FFFFFF.
   - "Framer — Ship sites like a designer".
   - "framer.com".
   - "No-code sites with design-tool controls".
4. **`Facts`** wrapper: pad 0 16. Inside it, `FactBox`:
   - H-AL, fill-w, fill white, stroke 1 rule-strong, radius 10, clip.
   - Three cells, each `layoutGrow` 1, V-AL, pad 10 12 12 12, gap 2. Cells 2 and 3 have stroke L1 rule.
   - Each cell holds a label in label/caps ink-3 and a value in display/sm ink:

| label | value |
|---|---|
| SAVED | 12 Oct |
| VISITS | 14 |
| LAST VISIT | 3d ago |

5. **`Caption`**: pad 8 16 0 16. Text "Visit #14 counted just now." in mono/xs, ink-3.
6. **`Filed`**: V-AL, fill-w, pad 16 16 0 16, gap 8.
   - Label row (SPACE_BETWEEN): "FILED UNDER" in label/caps ink-3, and "Click to change" in mono/xs ink-3.
   - Row (H-AL, gap 6, center): Chip Product Solid-md · "→" in body/sm ink-3 · `Tag/Sub` Inline "Design tool".
7. **`MyNote`** wrapper: pad 14 16 0 16. Inside it, a frame with stroke L2 rule-ledger and pad 2 0 2 12, holding "Check how they onboard to the CMS" in the note style, ink-2.
8. **`Actions`**: V-AL, fill-w, pad 16, gap 8.
   - Button Primary lg, fill-w, centered: "Close tab".
   - Button Secondary md, fill-w, centered: "Open in library ↗".
9. Divider.
10. **`Footer`** (same layout as C):
    - Left: "Remove from library" in body/sm-strong, danger.
    - Right: "248 saved · this device" in mono/xs, ink-3.

### 5.5 E — Toolbar icon & toast (960 × hug)

Root: V-AL, width 960, pad 56, gap 32, fill paper.

1. **`IconHead`** (V-AL, gap 6):
   - "Toolbar icon" in display/section, ink.
   - "32 px in Chrome's toolbar. Chrome draws the badge from text the extension sets." in body/md, ink-2.
2. **`Tiles`** (H-AL, gap 24): three tiles, each 264 wide.
   - Tile: V-AL, pad 20, gap 14, fill sheet, stroke 1 rule-strong, radius 12.
   - Tile children:
     1. `Stage`: fill-w, height 96, fill white, stroke 1 rule, radius 8, center/center, holding a `Toolbar/Icon` instance.
     2. Title in title/md, ink.
     3. Caption in body/sm, ink-2, fill-w.

| Icon state | Title | Caption |
|---|---|---|
| Not saved | Not saved | Neutral mark. Click it or press Alt Shift S to save this page. |
| Saved | Saved | Cell turns vermilion. Badge shows your visits to this site. |
| Just saved | Just saved | Green check for 2 seconds after saving, then shows Saved. |

3. **`ToastHead`** (V-AL, gap 6):
   - "In-page toast" in display/section, ink.
   - "Bottom-right of the page for 5 seconds after Save, keep open. Undo removes the row." in body/md, ink-2.
4. **`ToastStage`**:
   - H-AL, fill-w, height 120, pad 20, fill white, stroke 1 rule, radius 12.
   - `primaryAxisAlignItems MAX` and `counterAxisAlignItems MAX`, so the toast sits bottom-right.
   - Contains a `Toast` instance.

### 5.6 F — Foundations (1440 × hug)

Root: V-AL, width 1440, pad 64, gap 40, fill paper.

1. **`Head`** (V-AL, gap 8):
   - "Foundations" in display/xl.
   - "Sheaf tokens v0.1 · light theme · extend by adding tokens, never raw hex" in body/md, ink-2.
2. **`Cols`** (H-AL, gap 48): two columns, each 632 wide, V-AL, gap 40.

**Left column:**
- **`Color`**: "COLOR" in label/caps ink-3, then a grid (H-AL, wrap, gap 16, `counterAxisSpacing` 16).
  - One swatch per token in 3.1, in table order.
  - Swatch: V-AL, width 112, gap 6.
    1. Rect 112×40, radius 8, filled with the token. Add stroke 1 rule when the token is lighter than #E0E0E0.
    2. Token name without "color/" in label/sm, ink.
    3. Hex in mono/xs, ink-3.
- **`Categories`**: "CATEGORY" in label/caps ink-3, then five rows (V-AL, gap 8).
  - Row: H-AL, gap 16, center. A Chip Solid-sm inside a fixed 96-wide holder, then "bg #F6E1E4 · text #8C2944 · dot #C9476A" in mono/xs ink-2, using each category's values.

**Right column:**
- **`Type`**: "TYPE" in label/caps ink-3, then one row per style in 3.3 (V-AL, gap 8).
  - Row: H-AL, gap 16, center. The style name in mono/xs ink-3 at a fixed width of 132, then the sample "Close a tab. Keep the site." set in that style. For mono styles use "linear.app · 23 · 03 Oct" instead.
- **`System`**: "SPACE · RADIUS · SHADOW" in label/caps ink-3, then three rows (V-AL, gap 16).
  1. Spacing: H-AL, gap 12, align bottom. One V-AL item per scale value: a rect (width = value, height 8, fill ink-4), then the value in mono/xs ink-3.
  2. Radii: H-AL, gap 16. Rects 40×40 with no fill, stroke 1.5 ink-3, and radii 4, 6, 8, 10, 12 and 999. Each has its value in mono/xs below it.
  3. Shadows: H-AL, gap 24. Three 120×56 white rects, radius 10, with shadow/popover, shadow/actions and shadow/toast. Each has its style name in mono/xs below it.

---

## 6. Build order

Do one script call per step. After each step, `return` the IDs you created.

1. **Fonts and setup.** Load every font with the fallbacks from 3.3. Rename the page "Page 1" if needed. Create an empty frame `Components` at (0, 1184): width 1440, H-AL with wrap, pad 64, gap 64, `counterAxisSpacing` 64, fill white.
2. **Variables.** Create the collection `Sheaf Tokens` with mode `Light`, the 28 color variables and the 15 category variables.
3. **Text styles** (3.3, 20 styles) and **effect styles** (3.4, 5 styles).
4. **Glyphs and mark.** Build `Glyph/Chevron`, `Glyph/Check`, `Glyph/Search`, `Glyph/Star` and the `Logo/Mark` set.
5. **Primitives.** Build `Keycap`, `Button` (9 variants) and `Favicon`.
6. **Chips and tags.** Build `Chip/Category` (15 variants) and `Tag/Sub` (3 variants).
7. **Controls.** Build `Search/Field`, `Tab/Filter`, `Stat`, `Menu/Item`, `Menu/Category` and `Table/RowActions`.
8. **Table cells.** Build `Table/LetterCell`, `Table/RowNumber` and `Table/HeaderCell`.
9. **Rows.** Build `Table/Row` (Default, Hover, Empty). Check the widths sum to 1360.
10. **Remaining components.** Build `Toolbar/Icon` (3 variants) and `Toast`.
11. **Frame A shell.** Build the root, `TopBar`, `Stats`, `TabsRow`, and the `Sheet` with its letters, header and footer, but no rows yet.
12. **Frame A rows 1–7.** Insert them before `Footer` and override per the data table. Set row 3 to Hover.
13. **Frame A rows 8–14.** Same as step 12, plus row 9's RowNumber Active and letter C Active.
14. **Frame A overlays.** Add tab-joiner, selection-ring, fill-handle and category-menu. Verify the coordinates against 5.1.4.
15. **Frame B.** Duplicate A, apply the 5.2 changes and add `EmptyCard`.
16. **Frame C.**
17. **Frame D.**
18. **Frame E.**
19. **Frame F.**
20. **QA pass.** Check:
    - Frame positions match 5.0.
    - No text node is wider than its cell. Check the `summary` truncation.
    - Every text uses a local text style.
    - Rows sit at y = 304 + 46(n−1).
    - The popups hug to roughly 508 and 498.

**Override tips.** Find nodes inside an instance with `instance.findOne(n => n.name === "...")`. Set chips with `chip.setProperties({Category: "Blog", Style: "Solid-sm"})`. Set text with `characters` after loading fonts. Resize `bar` with `resize(w, 4)`. Show or hide `star` with `.visible`.

---

## 7. Open questions for the user

1. **Palette.** Do warm paper with a single vermilion accent feel like *you*? The alternatives are a cooler blue-grey ledger paper, or another single accent such as cobalt or moss.
2. **Voice of the type.** Should Sheaf keep the editorial serif (titles, stats, and italic "marginalia" notes), or would you prefer it fully sans and mono?
3. **Density.** The 46 px rows show about 14 sites per screen. Should a compact 32 px "true spreadsheet" density be the default instead?
