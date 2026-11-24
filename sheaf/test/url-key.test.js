import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUrl, isSaveable, displayLink } from "../lib/url-key.js";

test("equivalent URLs normalize identically", () => {
  assert.equal(
    normalizeUrl("HTTPS://WWW.Example.com/Path/?utm_source=x&fbclid=1#top"),
    normalizeUrl("http://example.com/Path"),
  );
});

test("meaningful query params distinguish URLs", () => {
  assert.notEqual(normalizeUrl("https://a.com/?id=2"), normalizeUrl("https://a.com/?id=3"));
});

test("root keeps its slash", () => {
  assert.equal(normalizeUrl("https://a.com"), normalizeUrl("https://a.com/"));
  assert.ok(normalizeUrl("https://a.com").endsWith("/"));
});

test("tracking params are stripped", () => {
  for (const p of ["ref", "ref_src", "si", "gclid", "mc_cid", "mc_eid", "igshid", "_hsenc", "_hsmi", "utm_campaign", "fbclid"]) {
    assert.equal(normalizeUrl(`https://a.com/x?${p}=1`), normalizeUrl("https://a.com/x"), p);
  }
});

test("query param order does not matter", () => {
  assert.equal(normalizeUrl("https://a.com/?b=1&a=2"), normalizeUrl("https://a.com/?a=2&b=1"));
});

test("unsaveable URLs", () => {
  for (const u of [
    "chrome://newtab", "chrome-extension://x/y", "https://chromewebstore.google.com/detail/x",
    "https://chrome.google.com/webstore/detail/x", "file:///a", "about:blank", "", "not a url",
    "data:text/html,hi", "javascript:alert(1)", "view-source:https://a.com", "edge://settings",
  ]) {
    assert.equal(isSaveable(u), false, u);
    assert.equal(normalizeUrl(u), null, u);
  }
  assert.equal(isSaveable("https://example.com/a"), true);
  assert.equal(isSaveable("http://example.com/a"), true);
});

test("displayLink", () => {
  assert.equal(
    displayLink("https://www.nngroup.com/articles/card-sorting-definition/"),
    "nngroup.com/articles/card-sorting-definition",
  );
  assert.equal(displayLink("https://a.com/"), "a.com");
});
