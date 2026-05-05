import { Item } from "../../shared/types.js";
import { log, fetchUrl } from "./utils.js";

function sinceToRedditT(since: Date): string {
  const days = (Date.now() - since.getTime()) / 86_400_000;
  if (days <= 1) return "day";
  if (days <= 7) return "week";
  if (days <= 30) return "month";
  if (days <= 365) return "year";
  return "all";
}

export async function fetchReddit(keywords: string[], since: Date, maxResults = 30): Promise<Item[]> {
  const results: Item[] = [];
  const t = sinceToRedditT(since);
  const q = encodeURIComponent(keywords.join(" OR "));
  let after: string | null = null;
  let page = 0;

  while (page < 5) {
    try {
      let url = `https://www.reddit.com/search.json?q=${q}&sort=new&t=${t}&limit=25`;
      if (after) url += `&after=${after}`;
      const data = JSON.parse(
        await fetchUrl(url, {
          headers: { "User-Agent": "ibm-bob-tracker/2.0 (research; low-volume)" },
        })
      );
      const children: any[] = data?.data?.children ?? [];
      if (!children.length) break;
      for (const child of children) {
        const d = child.data ?? {};
        const ts = new Date(d.created_utc * 1000);
        if (ts < since) continue;
        let thumbnail: string | undefined;
        const rawThumb: string = d.thumbnail ?? "";
        if (rawThumb && rawThumb.startsWith("http")) {
          thumbnail = rawThumb;
        }
        const previewUrl: string =
          d.preview?.images?.[0]?.source?.url ?? "";
        if (previewUrl) {
          thumbnail = previewUrl.replace(/&amp;/g, "&");
        }

        results.push({
          id: `rd-${d.id ?? ""}`,
          source: "reddit",
          type: "post",
          title: d.title ?? "",
          text: (d.selftext ?? "").slice(0, 200),
          url: `https://reddit.com${d.permalink ?? ""}`,
          author: `u/${d.author ?? ""}`,
          subreddit: `r/${d.subreddit ?? ""}`,
          timestamp: ts.toISOString(),
          engagement: {
            likes: 0,
            upvotes: d.score ?? 0,
            comments: d.num_comments ?? 0,
            points: 0,
          },
          thumbnail,
        });
      }
      log(`Reddit page ${page + 1}: ${children.length} posts fetched, ${results.length} kept`);
      if (results.length >= maxResults) break;
      after = data?.data?.after ?? null;
      if (!after) break;
      page++;
    } catch (e) {
      log(`Reddit error (page ${page}): ${e}`);
      break;
    }
  }
  return results;
}
