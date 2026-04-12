import express, { Request, Response } from "express";
import { join } from "path";
import { existsSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { loadConfig, saveConfig } from "./config.js";
import { loadResults } from "./data.js";
import { ICONS_DIR, PORT, WINDCATCHER } from "./paths.js";
import { AppConfig } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

let _refreshRunning = false;

// ── Static icons ──────────────────────────────────────────────────────────────

app.use("/icons", express.static(ICONS_DIR));

// ── API ───────────────────────────────────────────────────────────────────────

app.get("/api/config", (_req: Request, res: Response) => {
  res.json(loadConfig());
});

app.post("/api/config", (req: Request, res: Response) => {
  try {
    const cfg = req.body as AppConfig;
    if (!cfg || typeof cfg !== "object") {
      res.status(400).json({ error: "invalid payload" });
      return;
    }
    saveConfig(cfg);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/data", (req: Request, res: Response) => {
  const days = parseInt(String(req.query.days ?? "90"), 10);
  res.json(loadResults(days));
});

app.get("/api/status", (_req: Request, res: Response) => {
  const data = loadResults(9999);
  res.json({
    last_updated: data.last_updated,
    total_items: data.items.length,
    refreshing: _refreshRunning,
  });
});

app.post("/api/refresh", (req: Request, res: Response) => {
  if (_refreshRunning) {
    res.status(409).set("Content-Type", "text/plain").send("Already running\n");
    return;
  }

  _refreshRunning = true;
  res.set({
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
  });

  // Resolve worker path — works for both tsx dev and compiled js
  const workerTs = join(__dirname, "worker", "index.ts");
  const workerJs = join(__dirname, "worker", "index.js");
  const workerPath = existsSync(workerTs) ? workerTs : workerJs;

  const proc = spawn("npx", ["tsx", workerPath], {
    cwd: WINDCATCHER,
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.stdout.on("data", (chunk: Buffer) => {
    res.write(chunk.toString());
  });
  proc.stderr.on("data", (chunk: Buffer) => {
    res.write(chunk.toString());
  });
  proc.on("close", (code: number | null) => {
    _refreshRunning = false;
    if (code !== 0) {
      res.write(`[error] worker exited with code ${code}\n`);
    }
    res.end();
  });
  proc.on("error", (err: Error) => {
    _refreshRunning = false;
    res.write(`[error] ${err.message}\n`);
    res.end();
  });
});

// ── Serve built frontend in production ───────────────────────────────────────

const distDir = join(__dirname, "..", "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(join(distDir, "index.html"));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, "127.0.0.1", () => {
  console.log(`IBM Bob Tracker API  →  http://localhost:${PORT}`);
  if (existsSync(distDir)) {
    console.log(`Frontend             →  http://localhost:${PORT}`);
  } else {
    console.log(`Frontend (dev)       →  http://localhost:5173`);
  }
  console.log("Press Ctrl+C to stop.");
});
