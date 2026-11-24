import test from "node:test";
import assert from "node:assert/strict";
import { toCsv, parseCsv, detectUrlColumn, CSV_HEADER } from "../lib/csv.js";
import { newRecord } from "../lib/records.js";

test("CSV round-trip with comma, quote and newline in a name", () => {
  const r = newRecord({ url: "https://a.com/x", name: 'Say "hi", world\nline2', category: "Blog", subcategory: "Design", categorySource: "rules" }, Date.UTC(2026, 10, 24));
  const text = toCsv([r]);
  const rows = parseCsv(text);
  assert.equal(rows[0].join(","), CSV_HEADER);
  assert.deepEqual(rows[1], ['Say "hi", world\nline2', "https://a.com/x", "Blog", "Design", "1", "2026-11-24T00:00:00.000Z"]);
});

test("parseCsv handles CRLF, BOM and trailing newline", () => {
  assert.deepEqual(parseCsv("﻿a,b\r\n1,\"2,3\"\r\n"), [["a", "b"], ["1", "2,3"]]);
});

test("detectUrlColumn on a Google-Sheet-style CSV", () => {
  const rows = parseCsv("Title,Link,Notes\nA,https://a.com,hello\nB,https://b.com/x,https://not-counted-less.com\nC,,\n");
  assert.equal(detectUrlColumn(rows), 1);
});

test("detectUrlColumn returns -1 when no URLs", () => {
  assert.equal(detectUrlColumn([["a", "b"], ["c", "d"]]), -1);
});
