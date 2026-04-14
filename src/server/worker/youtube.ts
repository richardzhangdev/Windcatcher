import { Item } from "../../shared/types.js";
import { log, fetchUrl } from "./utils.js";

export async function fetchYouTube(
  keywords: string[],
  apiKey: string,
  since: Date,
  maxResults = 30
): Promise<Item[]> {
  if (!apiKey) {
    log("YouTube: no API key configured, skipping");
    return [];
  }
  const results: Item[] = [];
  const publishedAfter = since.toISOString().replace(/\.\d+Z$/, "Z");
  const seen = new Set<string>();

  for (const kw of keywords) {
    const kwClean = kw.replace(/^"|"$/g, "");
    const q = encodeURIComponent(kwClean);
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${q}&type=video&order=date` +
      `&maxResults=${maxResults}` +
      `&publishedAfter=${encodeURIComponent(publishedAfter)}` +
      `&key=${apiKey}`;
    try {
      const data = JSON.parse(await fetchUrl(url));
      if ("error" in data) {
        log(`YouTube API error: ${data.error?.message ?? JSON.stringify(data.error)}`);
        break;
      }
      const items: any[] = data.items ?? [];
      for (const item of items) {
        const vidId: string = item?.id?.videoId ?? "";
        if (!vidId || seen.has(vidId)) continue;
        seen.add(vidId);
        const snippet = item.snippet ?? {};
        const published: string = snippet.publishedAt ?? "";
        const ts = published ? new Date(published).toISOString() : published;
        const thumb =
          snippet.thumbnails?.medium?.url ??
          snippet.thumbnails?.default?.url ??
          `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`;
        results.push({
          id: `yt-${vidId}`,
          source: "youtube",
          type: "video",
          title: snippet.title ?? "",
          text: (snippet.description ?? "").slice(0, 200),
          url: `https://www.youtube.com/watch?v=${vidId}`,
          author: snippet.channelTitle ?? "",
          subreddit: "",
          timestamp: ts,
          engagement: { likes: 0, upvotes: 0, comments: 0, points: 0 },
          thumbnail: thumb,
        });
      }
      log(`YouTube '${kwClean}': ${items.length} results`);
    } catch (e) {
      log(`YouTube error: ${e}`);
      break;
    }
  }
  log(`YouTube: ${results.length} total`);
  return results.slice(0, maxResults);
}
