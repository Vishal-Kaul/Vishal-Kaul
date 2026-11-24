import test from "node:test";
import assert from "node:assert/strict";
import { runBackup } from "../background/backup.js";
import { createStore, memoryArea } from "../lib/store.js";
import { newRecord } from "../lib/records.js";

function fakeDownloads() {
  let id = 0;
  const log = { downloads: [], removed: [], erased: [] };
  return {
    log,
    async download(o) { log.downloads.push(o); return ++id; },
    async removeFile(i) { log.removed.push(i); },
    async erase(q) { log.erased.push(q.id); },
  };
}
async function seeded(n) {
  const s = createStore(memoryArea());
  for (let i = 0; i < n; i++) await s.put(newRecord({ url: `https://a.com/${i}`, name: "n", category: "Blog", subcategory: "Design", categorySource: "rules" }, 1));
  return s;
}
const T = new Date(2026, 10, 24, 12).getTime();

test("writes Sheaf/sheaf-backup-DATE.json and records meta", async () => {
  const s = await seeded(3), d = fakeDownloads();
  assert.equal((await runBackup(s, d, T)).status, "done");
  const o = d.log.downloads[0];
  assert.equal(o.filename, "Sheaf/sheaf-backup-2026-11-24.json");
  assert.equal(o.conflictAction, "uniquify");
  assert.equal(o.saveAs, false);
  assert.ok(o.url.startsWith("data:application/json;charset=utf-8,"));
  const m = await s.getMeta();
  assert.deepEqual(m.backups, [1]);
  assert.equal(m.lastBackupAt, T);
});

test("skips when library is empty", async () => {
  const s = await seeded(0), d = fakeDownloads();
  assert.equal((await runBackup(s, d, T)).status, "skipped");
  assert.equal(d.log.downloads.length, 0);
});

test("skips when fewer than half the rows of the last backup", async () => {
  const s = await seeded(3), d = fakeDownloads();
  await s.setMeta({ lastBackupCount: 10, backups: [1] });
  assert.equal((await runBackup(s, d, T)).status, "skipped");
  assert.equal(d.log.downloads.length, 0);
});

test("the 5th backup removes the 1st", async () => {
  const s = await seeded(3), d = fakeDownloads();
  for (let i = 0; i < 5; i++) await runBackup(s, d, T + i);
  assert.deepEqual(d.log.removed, [1]);
  assert.deepEqual(d.log.erased, [1]);
  assert.deepEqual((await s.getMeta()).backups, [2, 3, 4, 5]);
});

test("a shrink skip is recorded, and the next run at the same size writes the backup", async () => {
  const s = await seeded(3), d = fakeDownloads();
  await s.setMeta({ lastBackupCount: 10, backups: [1] });
  assert.equal((await runBackup(s, d, T)).status, "skipped");
  const m = await s.getMeta();
  assert.equal(m.backupSkippedAt, T);
  assert.equal(m.backupSkippedCount, 3);
  assert.equal((await runBackup(s, d, T + 1)).status, "done");
  const after = await s.getMeta();
  assert.equal(after.lastBackupCount, 3);
  assert.equal(after.backupSkippedAt, null);
  assert.equal(d.log.downloads.length, 1);
});

test("a second shrink skip with a larger library still skips", async () => {
  const s = await seeded(4), d = fakeDownloads();
  await s.setMeta({ lastBackupCount: 10, backupSkippedAt: T, backupSkippedCount: 3 });
  assert.equal((await runBackup(s, d, T + 1)).status, "skipped");
  assert.equal(d.log.downloads.length, 0);
});
