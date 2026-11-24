// Generates assets/icons/{idle,saved,done}-{16,32,48,128}.png with no dependencies.
// The mark is the Figma "Logo/Mark": a 22-unit frame with a 2x2 grid; saved fills the top-left cell.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/icons");
const INK = [0x1c, 0x1b, 0x18], SHEET = [0xfb, 0xfa, 0xf6], ACCENT = [0xc9, 0x3a, 0x22], GREEN = [0x1f, 0x7a, 0x55], WHITE = [255, 255, 255];

function inRoundRect(x, y, w, h, r) {
  if (x < 0 || y < 0 || x > w || y > h) return false;
  const cx = x < r ? r : x > w - r ? w - r : x, cy = y < r ? r : y > h - r ? h - r : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
// Colour at a point in 22-unit mark space, or null for transparent.
function sample(x, y, kind) {
  let c = null;
  if (inRoundRect(x, y, 22, 22, 5)) {
    c = SHEET;
    if (kind !== "idle" && x < 11 && y < 11) c = ACCENT;
    if ((x >= 10.25 && x <= 11.75) || (y >= 10.25 && y <= 11.75)) c = INK;
    if (!inRoundRect(x - 1.5, y - 1.5, 19, 19, 3.5)) c = INK;
  }
  if (kind === "done") {
    const d = Math.hypot(x - 17, y - 17);
    if (d <= 7.6) c = SHEET;
    if (d <= 6.2) c = GREEN;
    const w = Math.min(distSeg(x, y, 14, 17.2, 16.3, 19.4), distSeg(x, y, 16.3, 19.4, 20.2, 14.6));
    if (w <= 0.95) c = WHITE;
  }
  return c;
}
function render(size, kind) {
  const SS = 4, scale = 22 / size, px = Buffer.alloc(size * size * 4);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const c = sample((i + (sx + 0.5) / SS) * scale, (j + (sy + 0.5) / SS) * scale, kind);
      if (c) { r += c[0]; g += c[1]; b += c[2]; a++; }
    }
    const o = (j * size + i) * 4;
    if (a) { px[o] = Math.round(r / a); px[o + 1] = Math.round(g / a); px[o + 2] = Math.round(b / a); px[o + 3] = Math.round((a / (SS * SS)) * 255); }
  }
  return px;
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const t = Buffer.from(type), len = Buffer.alloc(4), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, sum]);
}
function png(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
fs.mkdirSync(OUT, { recursive: true });
for (const kind of ["idle", "saved", "done"]) for (const size of [16, 32, 48, 128]) fs.writeFileSync(path.join(OUT, `${kind}-${size}.png`), png(size, render(size, kind)));
