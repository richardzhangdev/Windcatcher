import { readFileSync, writeFileSync, existsSync } from "fs";
import { AppConfig, DEFAULT_CONFIG, DEFAULT_SOURCE_ORDER } from "../shared/types.js";
import { ENV_FILE, LEGACY_CONFIG_FILE } from "./paths.js";

// ── .env parser / writer ──────────────────────────────────────────────────────

function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1); // do NOT trim — preserve intentional leading/trailing space in values
    // Strip a single layer of surrounding quotes (single or double)
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function buildEnvFile(cfg: AppConfig): string {
  const lines: string[] = [
    "# IBM Bob Tracker — configuration",
    "# Edit here or use the Settings panel in the UI.",
    "",
    "# ── API credentials ─────────────────────────────────────────────────────────",
    `TWITTER_BEARER_TOKEN=${cfg.twitter_bearer_token}`,
    `YOUTUBE_API_KEY=${cfg.youtube_api_key}`,
    `BLUESKY_HANDLE=${cfg.bluesky_handle}`,
    `BLUESKY_APP_PASSWORD=${cfg.bluesky_app_password}`,
    "",
    "# ── Sources (true / false) ───────────────────────────────────────────────────",
    `SOURCE_TWITTER=${cfg.sources.twitter}`,
    `SOURCE_REDDIT=${cfg.sources.reddit}`,
    `SOURCE_HACKERNEWS=${cfg.sources.hackernews}`,
    `SOURCE_NEWS=${cfg.sources.news}`,
    `SOURCE_YOUTUBE=${cfg.sources.youtube}`,
    `SOURCE_BLUESKY=${cfg.sources.bluesky}`,
    "",
    "# ── Keywords (JSON array) ────────────────────────────────────────────────────",
    `KEYWORDS=${JSON.stringify(cfg.keywords)}`,
    "",
    "# ── Custom RSS feeds (JSON array of {id,label,url,enabled}) ─────────────────",
    `CUSTOM_FEEDS=${JSON.stringify(cfg.custom_feeds)}`,
    "",
    "# ── Column order (JSON array of source IDs) ──────────────────────────────────",
    `SOURCE_ORDER=${JSON.stringify(cfg.source_order)}`,
  ];
  return lines.join("\n") + "\n";
}

// ── Public API ────────────────────────────────────────────────────────────────

export function loadConfig(): AppConfig {
  // One-time migration: if .env doesn't exist yet but config.json does, migrate it.
  if (!existsSync(ENV_FILE) && existsSync(LEGACY_CONFIG_FILE)) {
    try {
      const legacy = JSON.parse(readFileSync(LEGACY_CONFIG_FILE, "utf8")) as Partial<AppConfig>;
      const migrated: AppConfig = {
        sources: { ...DEFAULT_CONFIG.sources, ...(legacy.sources ?? {}) },
        source_order: legacy.source_order ?? DEFAULT_SOURCE_ORDER,
        custom_feeds: legacy.custom_feeds ?? [],
        keywords: legacy.keywords?.length ? legacy.keywords : DEFAULT_CONFIG.keywords,
        twitter_bearer_token: legacy.twitter_bearer_token ?? "",
        youtube_api_key: legacy.youtube_api_key ?? "",
        bluesky_handle: legacy.bluesky_handle ?? "",
        bluesky_app_password: legacy.bluesky_app_password ?? "",
      };
      writeFileSync(ENV_FILE, buildEnvFile(migrated), "utf8");
      console.log(`[config] Migrated config.json → .env`);
    } catch (e) {
      console.warn(`[config] Migration failed: ${e}`);
    }
  }

  if (!existsSync(ENV_FILE)) {
    return { ...DEFAULT_CONFIG, sources: { ...DEFAULT_CONFIG.sources } };
  }

  const env = parseEnvFile(readFileSync(ENV_FILE, "utf8"));

  const sources = { ...DEFAULT_CONFIG.sources };
  for (const key of Object.keys(sources)) {
    const envKey = `SOURCE_${key.toUpperCase()}`;
    if (env[envKey] !== undefined) sources[key] = env[envKey] !== "false";
  }

  let keywords = DEFAULT_CONFIG.keywords;
  if (env.KEYWORDS) {
    try { keywords = JSON.parse(env.KEYWORDS); } catch { /* keep default */ }
  }

  let custom_feeds: AppConfig["custom_feeds"] = [];
  if (env.CUSTOM_FEEDS) {
    try { custom_feeds = JSON.parse(env.CUSTOM_FEEDS); } catch { /* keep empty */ }
  }

  let source_order = DEFAULT_SOURCE_ORDER;
  if (env.SOURCE_ORDER) {
    try { source_order = JSON.parse(env.SOURCE_ORDER); } catch { /* keep default */ }
  }

  return {
    sources,
    source_order,
    custom_feeds,
    keywords,
    twitter_bearer_token: env.TWITTER_BEARER_TOKEN ?? "",
    youtube_api_key: env.YOUTUBE_API_KEY ?? "",
    bluesky_handle: env.BLUESKY_HANDLE ?? "",
    bluesky_app_password: env.BLUESKY_APP_PASSWORD ?? "",
  };
}

export function saveConfig(cfg: AppConfig): void {
  writeFileSync(ENV_FILE, buildEnvFile(cfg), "utf8");
}
