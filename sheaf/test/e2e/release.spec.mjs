import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { launch } from "./fixtures.mjs";
import { release, crc32 } from "../../tools/release.mjs";
import { PRODUCT_NAME } from "../../lib/config.js";

// Tiny unzip: reads the central directory, inflates, checks CRC.
function unzip(zipPath, destDir) {
  const buf = fs.readFileSync(zipPath);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const names = [];
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    const dataStart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(dataStart, dataStart + csize);
    const data = method === 8 ? zlib.inflateRawSync(raw) : raw;
    assert.equal(crc32(data), crc, `CRC mismatch for ${name}`);
    const out = path.join(destDir, name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, data);
    names.push(name);
    p += 46 + nlen + xlen + clen;
  }
  return names;
}

test("release zip unpacks, leaves out dev files, and loads in Chromium", async () => {
  const { out } = release();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sheaf-zip-"));
  const names = unzip(out, dir);
  for (const n of names) assert.ok(!/^(test|tools|dist)\//.test(n) && n !== "package.json", `unexpected ${n}`);
  assert.ok(names.includes("manifest.json"));

  const env = await launch({ extensionDir: dir });
  try {
    const page = await env.context.newPage();
    await page.goto(`chrome-extension://${env.extensionId}/library/library.html`);
    await page.waitForSelector("[data-ready]");
    assert.equal(await page.title(), PRODUCT_NAME);
  } finally {
    await env.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
