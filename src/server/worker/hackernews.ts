import { Item } from "../../shared/types.js";
import { log, fetchUrl } from "./utils.js";

export async function fetchHN(keywords: string[], since: Date, maxResults = 30): Promise<Item[]> {
  const results: Item[] = [];
  const q = encodeURIComponent(keywords.join(" OR "));
  const cutoffTs = Math.floor(since.getTime() / 1000);
  const numeric = encodeURIComponent(`created_at_i>${cutoffTs}`);

  for (const tag of ["story", "comment"] as const) {
    let page = 0;
    while (true) {
      try {
        const url =
          `https://hn.algolia.com/api/v1/search_by_date` +
          `?query=${q}&tags=${tag}&hitsPerPage=50&page=${page}` +
          `&numericFilters=${numeric}`;
        const data = JSON.parse(await fetchUrl(url));
        const hits: any[] = data.hits ?? [];
        for (const hit of hits) {
          const oid: string = hit.objectID ?? "";
          const title =
            tag === "story"
              ? (hit.title ?? "")
              : ((hit.comment_text ?? "") as string).slice(0, 120);
          const link =
            tag === "story"
              ? hit.url ?? `https://news.ycombinator.com/item?id=${oid}`
              : `https://news.ycombinator.com/item?id=${oid}`;
          results.push({
            id: `hn-${oid}`,
            source: "hackernews",
            type: tag,
            title,
            text: tag === "comment" ? ((hit.comment_text ?? "") as string).slice(0, 300) : "",
            url: link,
            author: hit.author ?? "",
            subreddit: "",
            timestamp: hit.created_at ?? "",
            engagement: {
              likes: 0,
              upvotes: 0,
              comments: hit.num_comments ?? 0,
              points: hit.points ?? 0,
            },
          });
        }
        const nbPages: number = data.nbPages ?? 1;
        log(`HN ${tag}s page ${page + 1}/${nbPages}: ${hits.length} results`);
        if (results.length >= maxResults || page + 1 >= nbPages || page >= 4) break;
        page++;
      } catch (e) {
        log(`HN ${tag} error (page ${page}): ${e}`);
        break;
      }
    }
  }
  return results;
}
