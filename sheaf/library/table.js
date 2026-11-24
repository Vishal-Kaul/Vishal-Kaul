import { MAIN, SUBS, label, isValid } from "../lib/categories.js";
import { displayLink } from "../lib/url-key.js";

export function el(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, "");
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) n.append(c);
  return n;
}

export function checkbox(state, onClick, ariaLabel) {
  return el("button", {
    type: "button", class: "cb", role: "checkbox", "aria-checked": state, "aria-label": ariaLabel, onclick: onClick,
  });
}

const COLUMNS = [
  ["name", "Site", "c-name"],
  ["link", "Link", "c-link"],
  ["category", "Category", "c-cat"],
  ["visits", "Visits", "c-visits"],
];

export function renderHead(root, { sortKey, sortDir, selection, pageKeys, total, handlers }) {
  root.replaceChildren();
  const state = selection.headerState(pageKeys);
  const cbState = state === "none" ? "false" : state === "some" ? "mixed" : "true";
  root.append(el("div", { class: "c-check" }, checkbox(cbState, handlers.headerCheck, "Select page")));
  if (selection.size > 0) {
    const bulk = el("div", { class: "bulk" }, [
      el("span", { text: `${selection.size} selected` }),
      el("button", { type: "button", class: "del", text: "Delete", onclick: handlers.bulkDelete }),
      el("button", { type: "button", class: "cancel", text: "Cancel", onclick: handlers.cancel }),
    ]);
    if (state === "page" && total > pageKeys.length) {
      bulk.append(el("button", { type: "button", class: "all", text: `Select all ${total}`, onclick: handlers.selectAll }));
    }
    root.append(bulk);
    return;
  }
  for (const [key, text, cls] of COLUMNS) {
    const sorted = sortKey === key;
    root.append(el("div", { class: cls, role: "columnheader" },
      el("button", {
        type: "button", class: "hcell" + (sorted ? " sorted" : ""),
        text: text + (sorted ? (sortDir === "asc" ? " ↑" : " ↓") : ""),
        onclick: () => handlers.sort(key),
      })));
  }
}

export function renderRow(rec, { selected, editing, handlers }) {
  const row = el("div", {
    class: "row body" + (selected ? " selected" : "") + (editing ? " editing" : ""),
    role: "row", "data-key": rec.key,
  });
  row.append(el("div", { class: "c-check" },
    checkbox(selected ? "true" : "false", (e) => handlers.toggle(rec.key, e.shiftKey), `Select ${rec.name}`)));

  const nameCell = el("div", { class: "c-name", role: "cell" });
  const catCell = el("div", { class: "c-cat", role: "cell" });
  if (editing) {
    const input = el("input", { class: "edit-name", type: "text", value: rec.name, "aria-label": "Name" });
    input.value = rec.name;
    const select = el("select", { class: "edit-cat", "aria-label": "Category" });
    for (const main of MAIN) {
      const g = el("optgroup", { label: main });
      for (const sub of SUBS[main]) g.append(el("option", { value: `${main}|${sub}`, text: label(main, sub) }));
      select.append(g);
    }
    const cur = `${rec.category}|${rec.subcategory}`;
    select.value = isValid(rec.category, rec.subcategory) ? cur : `${MAIN[0]}|${SUBS[MAIN[0]][0]}`;
    const onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const [category, subcategory] = select.value.split("|");
        handlers.saveEdit(rec.key, { name: input.value.trim() || rec.name, category, subcategory });
      } else if (e.key === "Escape") {
        e.preventDefault();
        handlers.cancelEdit();
      }
    };
    input.addEventListener("keydown", onKey);
    select.addEventListener("keydown", onKey);
    nameCell.append(input);
    catCell.append(select);
  } else {
    nameCell.textContent = rec.name;
    nameCell.title = rec.name;
    catCell.textContent = label(rec.category, rec.subcategory);
  }
  const link = el("a", { href: rec.url, target: "_blank", rel: "noopener", text: displayLink(rec.url), title: rec.url });
  row.append(
    nameCell,
    el("div", { class: "c-link", role: "cell" }, link),
    catCell,
    el("div", { class: "c-visits", role: "cell", text: String(rec.visits) }),
  );
  row.append(el("div", { class: "pill" }, [
    el("a", { class: "open", href: rec.url, target: "_blank", rel: "noopener", text: "Open ↗" }),
    el("button", { type: "button", class: "copy", text: "Copy link", onclick: (e) => handlers.copy(rec, e.currentTarget) }),
    el("button", { type: "button", class: "edit", text: "Edit", onclick: () => handlers.edit(rec.key) }),
    el("span", { class: "sep" }),
    el("button", { type: "button", class: "delete", text: "Delete", onclick: () => handlers.remove(rec.key) }),
  ]));
  return row;
}
