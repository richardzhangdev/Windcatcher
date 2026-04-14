import { XMLParser } from "fast-xml-parser";
import { Item } from "../../shared/types.js";
import { log, fetchUrl } from "./utils.js";

function parseRfc2822(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {
    // fall through
  }
  return dateStr;
}

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  source?: string | { "#text"?: string };
}

export async function fetchGoogleNews(since: Date, maxResults = 30): Promise<Item[]> {
  const results: Item[] = [];
  const seen = new Set<string>();
  const parser = new XMLParser({ ignoreAttributes: false });

  for (const q of ["ibm+bob", "ibm+project+bob"]) {
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const xml = await fetchUrl(url);
      const parsed = parser.parse(xml);
      const items: RssItem[] = parsed?.rss?.channel?.item ?? [];
      const arr = Array.isArray(items) ? items : [items];
      for (const item of arr) {
        const link = item.link ?? "";
        if (!link || seen.has(link)) continue;
        seen.add(link);
        const pubTs = parseRfc2822(item.pubDate ?? "");
        if (pubTs && new Date(pubTs) < since) continue;
        const sourceVal = item.source;
        const sourceName =
          typeof sourceVal === "string"
            ? sourceVal
            : (sourceVal as any)?.["#text"] ?? "Google News";
        results.push({
          id: `news-${Math.abs(hashStr(link)) % 1_000_000_000}`,
          source: "news",
          type: "article",
          title: item.title ?? "",
          text: "",
          url: link,
          author: sourceName,
          subreddit: "",
          timestamp: pubTs,
          engagement: { likes: 0, upvotes: 0, comments: 0, points: 0 },
        });
        if (results.length >= maxResults) break;
      }
    } catch (e) {
      log(`Google News fetch error (${q}): ${e}`);
    }
  }
  log(`Google News: ${results.length} results`);
  return results;
}

export async function fetchCustomFeeds(
  feeds: { id: string; label: string; url: string; enabled?: boolean }[],
  since: Date
): Promise<Item[]> {
  const results: Item[] = [];
  const parser = new XMLParser({ ignoreAttributes: false });

  for (const feed of feeds) {
    if (feed.enabled === false) continue;
    const { id, label, url } = feed;
    if (!url) continue;
    const srcKey = `custom_${id}`;
    try {
      const xml = await fetchUrl(url);
      const parsed = parser.parse(xml);
      const items: RssItem[] = parsed?.rss?.channel?.item ?? [];
      const arr = Array.isArray(items) ? items : [items];
      let count = 0;
      for (const item of arr) {
        const link = item.link ?? "";
        const pub = item.pubDate ?? "";
        const ts = parseRfc2822(pub);
        if (ts && new Date(ts) < since) continue;
        results.push({
          id: `${srcKey}-${Math.abs(hashStr(link)) % 1_000_000_000}`,
          source: srcKey,
          type: "article",
          title: item.title ?? "",
          text: "",
          url: link,
          author: label,
          subreddit: "",
          timestamp: ts,
          engagement: { likes: 0, upvotes: 0, comments: 0, points: 0 },
        });
        count++;
      }
      log(`Custom feed '${label}': ${count} results`);
    } catch (e) {
      log(`Custom feed '${label}' error: ${e}`);
    }
  }
  return results;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
