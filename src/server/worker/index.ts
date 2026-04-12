#!/usr/bin/env node
/**
 * IBM Bob News Tracker — data collection worker
 * Usage: npx tsx src/server/worker/index.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { Item } from "../../shared/types.js";
import { MEMORY_FILE } from "../paths.js";
import { loadConfig } from "../config.js";
import { log } from "./utils.js";
import { fetchHN } from "./hackernews.js";
import { fetchGoogleNews, fetchCustomFeeds } from "./news.js";
import { fetchReddit } from "./reddit.js";
import { fetchTwitter } from "./twitter.js";
import { fetchYouTube } from "./youtube.js";
import { fetchBluesky } from "./bluesky.js";

const CUTOFF_DAYS = 30;

function sourceEnabled(
  sources: Record<string, boolean>,
  sid: string,
  defaultVal = true
): boolean {
  return sources[sid] ?? defaultVal;
}

function mergeItems(existing: Item[], fresh: Item[]): Item[] {
  const cutoff = new Date(Date.now() - CUTOFF_DAYS * 86_400_000);
  const byUrl = new Map<string, Item>(
    existing.filter((i) => i.url).map((i) => [i.url, i])
  );
  for (const item of fresh) {
    if (item.url) byUrl.set(item.url, item);
  }
  const result: Item[] = [];
  for (const item of byUrl.values()) {
    try {
      if (new Date(item.timestamp) < cutoff) continue;
    } catch {
      // keep items with unparseable timestamps
    }
    result.push(item);
  }
  result.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
  return result;
}

async function main() {
  log("IBM Bob Tracker starting...");

  const cfg = loadConfig();
  const { sources, keywords, custom_feeds } = cfg;

  let existing: Item[] = [];
  if (existsSync(MEMORY_FILE)) {
    try {
      existing = (
        JSON.parse(readFileSync(MEMORY_FILE, "utf8")) as { items: Item[] }
      ).items;
      log(`Loaded ${existing.length} existing items`);
    } catch (e) {
      log(`Could not load existing results: ${e}`);
    }
  }

  log(`Keywords: ${JSON.stringify(keywords)}`);
  const disabledSources = Object.entries(sources)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (disabledSources.length) log(`Disabled sources: ${disabledSources.join(", ")}`);

  const newItems: Item[] = [];

  if (sourceEnabled(sources, "hackernews")) {
    newItems.push(...(await fetchHN(keywords)));
  } else {
    log("HN: skipped (disabled in config)");
  }

  if (sourceEnabled(sources, "news")) {
    newItems.push(...(await fetchGoogleNews()));
  } else {
    log("Google News: skipped (disabled in config)");
  }

  if (sourceEnabled(sources, "reddit")) {
    newItems.push(...(await fetchReddit(keywords)));
  } else {
    log("Reddit: skipped (disabled in config)");
  }

  if (sourceEnabled(sources, "twitter", false)) {
    newItems.push(...(await fetchTwitter(keywords, cfg.twitter_bearer_token)));
  } else {
    log("Twitter: skipped (disabled in config)");
  }

  if (sourceEnabled(sources, "youtube", false)) {
    newItems.push(...(await fetchYouTube(keywords, cfg.youtube_api_key)));
  } else {
    log("YouTube: skipped (disabled in config)");
  }

  if (sourceEnabled(sources, "bluesky", false)) {
    newItems.push(
      ...(await fetchBluesky(keywords, cfg.bluesky_handle, cfg.bluesky_app_password))
    );
  } else {
    log("Bluesky: skipped (disabled in config)");
  }

  if (custom_feeds.length) {
    newItems.push(...(await fetchCustomFeeds(custom_feeds, CUTOFF_DAYS)));
  }

  log(`Fetched ${newItems.length} new items across all sources`);

  const merged = mergeItems(existing, newItems);
  const output = {
    last_updated: new Date().toISOString(),
    items: merged,
  };

  mkdirSync(dirname(MEMORY_FILE), { recursive: true });
  writeFileSync(MEMORY_FILE, JSON.stringify(output, null, 2), "utf8");
  log(`Saved ${merged.length} items to ${MEMORY_FILE}`);
  log("Done.");
}

main().catch((e) => {
  log(`Fatal error: ${e}`);
  process.exit(1);
});
