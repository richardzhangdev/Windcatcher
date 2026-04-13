import { Item } from "../../shared/types.js";
import { log, fetchUrl } from "./utils.js";

const MAX_PER_SOURCE = 30;
// Twitter free tier limits search to the past 7 days
const TWITTER_MAX_DAYS = 7;

export async function fetchTwitter(
  keywords: string[],
  bearerToken: string,
  since: Date
): Promise<Item[]> {
  if (!bearerToken) {
    log("Twitter: no Bearer Token configured, skipping");
    return [];
  }
  const results: Item[] = [];
  const twitterFloor = new Date(Date.now() - TWITTER_MAX_DAYS * 86_400_000);
  const effectiveSince = since > twitterFloor ? since : twitterFloor;
  const twTerms = keywords.map((kw) => kw.replace(/^"|"$/g, "")).join(" OR ");
  const query = `(${twTerms}) -is:retweet`;

  const baseParams = new URLSearchParams({
    query,
    max_results: String(MAX_PER_SOURCE),
    "tweet.fields": "created_at,public_metrics,author_id,attachments",
    expansions: "author_id,attachments.media_keys",
    "user.fields": "username,name",
    "media.fields": "url,preview_image_url,type",
    start_time: effectiveSince.toISOString().replace(/\.\d+Z$/, "Z"),
  });

  let page = 0;
  let nextToken: string | null = null;

  while (page < 3) {
    const params = new URLSearchParams(baseParams);
    if (nextToken) params.set("next_token", nextToken);
    const url = `https://api.twitter.com/2/tweets/search/recent?${params}`;
    try {
      const raw = await fetchUrl(url, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      const data = JSON.parse(raw);
      if ("errors" in data && !("data" in data)) {
        log(`Twitter API rejected query: ${JSON.stringify(data.errors)}`);
        break;
      }
      const tweets: any[] = data.data ?? [];
      const users: Record<string, any> = {};
      for (const u of data?.includes?.users ?? []) users[u.id] = u;
      const mediaMap: Record<string, any> = {};
      for (const m of data?.includes?.media ?? []) mediaMap[m.media_key] = m;

      for (const t of tweets) {
        const tid: string = t.id;
        const uid: string = t.author_id ?? "";
        const user = users[uid] ?? {};
        const username: string = user.username ?? "";
        const metrics = t.public_metrics ?? {};
        const tweetUrl = username
          ? `https://x.com/${username}/status/${tid}`
          : `https://x.com/i/web/status/${tid}`;

        let thumbnail: string | undefined;
        const mediaKeys: string[] = t.attachments?.media_keys ?? [];
        for (const mk of mediaKeys) {
          const media = mediaMap[mk];
          if (media) {
            thumbnail = media.url ?? media.preview_image_url;
            if (thumbnail) break;
          }
        }

        results.push({
          id: `tw-${tid}`,
          source: "twitter",
          type: "tweet",
          title: "",
          text: t.text ?? "",
          url: tweetUrl,
          author: username ? `@${username}` : user.name ?? "",
          subreddit: "",
          timestamp: t.created_at ?? new Date().toISOString(),
          engagement: {
            likes: metrics.like_count ?? 0,
            retweets: metrics.retweet_count ?? 0,
            upvotes: 0,
            comments: 0,
            points: 0,
          },
          thumbnail,
        });
      }
      log(`Twitter API page ${page + 1}: ${tweets.length} tweets`);
      if (results.length >= MAX_PER_SOURCE) break;
      nextToken = data?.meta?.next_token ?? null;
      if (!nextToken || !tweets.length) break;
      page++;
    } catch (e) {
      log(`Twitter API error: ${e}`);
      break;
    }
  }
  log(`Twitter API: ${results.length} tweets total`);
  return results;
}
