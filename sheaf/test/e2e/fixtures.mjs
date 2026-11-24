import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const sheafDir = path.resolve(here, "../..");
const pagesDir = path.join(here, "pages");

export async function launch({ extensionDir = sheafDir } = {}) {
  const server = http.createServer((req, res) => {
    const name = path.basename(new URL(req.url, "http://x").pathname) || "index.html";
    const file = path.join(pagesDir, name);
    if (!file.startsWith(pagesDir) || !fs.existsSync(file)) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const serverUrl = `http://127.0.0.1:${server.address().port}`;

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "sheaf-e2e-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extensionDir}`, `--load-extension=${extensionDir}`],
  });
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent("serviceworker");
  const extensionId = new URL(worker.url()).host;

  return {
    context,
    worker,
    extensionId,
    serverUrl,
    async close() {
      await context.close();
      await new Promise((r) => server.close(r));
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
  };
}

export const allRecords = (worker) => worker.evaluate(() => self.__sheaf.store.all());
