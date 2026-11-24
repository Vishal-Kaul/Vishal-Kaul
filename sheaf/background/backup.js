import { toJson } from "../lib/csv.js";
import { PRODUCT_NAME } from "../lib/config.js";

export const BACKUP_ALARM = "weekly-backup";
export const BACKUP_PERIOD_MIN = 10080;
const KEEP = 4;

function dateStamp(now) {
  const d = new Date(now);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function runBackup(store, downloads, now) {
  const records = await store.all();
  const meta = await store.getMeta();
  if (!records.length) return { status: "skipped", reason: "empty" };
  if (meta.lastBackupCount && records.length < meta.lastBackupCount / 2) {
    // A deliberate big delete must not stop backups forever: skip once, then accept
    // the new size if the next run sees the same (or a smaller) library.
    const prev = meta.backupSkippedCount;
    if (prev == null || records.length > prev) {
      await store.setMeta({ backupSkippedAt: now, backupSkippedCount: records.length });
      return { status: "skipped", reason: "shrunk" };
    }
  }
  const json = toJson(records, now);
  const id = await downloads.download({
    url: "data:application/json;charset=utf-8," + encodeURIComponent(json),
    filename: `${PRODUCT_NAME}/${PRODUCT_NAME.toLowerCase()}-backup-${dateStamp(now)}.json`,
    conflictAction: "uniquify",
    saveAs: false,
  });
  const all = [...(meta.backups || []), id];
  const old = all.slice(0, Math.max(0, all.length - KEEP));
  for (const oldId of old) {
    try { await downloads.removeFile(oldId); } catch { /* file already gone */ }
    try { await downloads.erase({ id: oldId }); } catch { /* ignore */ }
  }
  await store.setMeta({ backups: all.slice(-KEEP), lastBackupAt: now, lastBackupCount: records.length, backupSkippedAt: null, backupSkippedCount: null });
  return { status: "done", id };
}

export async function ensureAlarm(alarms) {
  if (!(await alarms.get(BACKUP_ALARM))) {
    alarms.create(BACKUP_ALARM, { periodInMinutes: BACKUP_PERIOD_MIN, delayInMinutes: BACKUP_PERIOD_MIN });
  }
}
