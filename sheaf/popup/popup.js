import { displayLink, isSaveable } from "../lib/url-key.js";

const $ = (id) => document.getElementById(id);
const tabParam = new URLSearchParams(location.search).get("tab");
const tabId = tabParam ? Number(tabParam) : undefined;

const domainOf = (url) => displayLink(url).split(/[/?]/)[0];

async function init() {
  const s = await chrome.runtime.sendMessage({ type: "state-for-active", tabId });
  $("title").textContent = s.title || s.url || "";
  const primary = $("primary");
  if (!isSaveable(s.url)) {
    $("meta").textContent = "This page can't be saved";
    primary.remove();
  } else if (s.saved) {
    const n = s.record.visits;
    $("meta").textContent = `${domainOf(s.url)} · Saved · ${n} ${n === 1 ? "visit" : "visits"}`;
    $("primary-label").textContent = "Close tab";
    $("hint").remove();
    primary.hidden = false;
  } else {
    $("meta").textContent = domainOf(s.url);
    $("primary-label").textContent = "Save & close tab";
    $("hint").hidden = false;
    primary.hidden = false;
  }
  primary.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "save-active" });
    window.close();
  });
  $("library").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: "open-library" });
    window.close();
  });
  document.body.dataset.ready = "";
}
init();
