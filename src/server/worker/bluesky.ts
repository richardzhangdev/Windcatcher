import { Item } from "../../shared/types.js";
import { log, fetchUrl } from "./utils.js";

const CUTOFF_DAYS = 30;
const MAX_PER_SOURCE = 30;

async function getBskyToken(handle: string, appPassword: string): Promise<string> {
  const body = JSON.stringify({ identifier: handle, password: appPassword });
  const raw = await fetchUrl("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return (JSON.parse(raw) as any).accessJwt ?? "";
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

export async function fetchBluesky(
  keywords: string[],
  handle: string,
  appPassword: string
): Promise<Item[]> {
  if (!handle || !appPassword) {
    log("Bluesky: no credentials configured, skipping");
    return [];
  }

  let token: string;
  try {
    token = await getBskyToken(handle, appPassword);
  } catch (e) {
    log(`Bluesky login failed: ${e}`);
    return [];
  }

  const results: Item[] = [];
  const cutoff = new Date(Date.now() - CUTOFF_DAYS * 86_400_000);
  const since = encodeURIComponent(cutoff.toISOString().replace(/\.\d+Z$/, "Z"));
  const seen = new Set<string>();

  for (const kw of keywords) {
    const kwClean = kw.replace(/^"|"$/g, "");
    const q = encodeURIComponent(kwClean);
    let cursor: string | null = null;
    let page = 0;

    while (page < 3) {
      let url =
        `https://bsky.social/xrpc/app.bsky.feed.searchPosts` +
        `?q=${q}&limit=25&sort=latest&since=${since}`;
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
      try {
        const raw = await fetchUrl(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = JSON.parse(raw);
        const posts: any[] = data.posts ?? [];
        if (!posts.length) break;
        for (const post of posts) {
          const uri: string = post.uri ?? "";
          if (!uri || seen.has(uri)) continue;
          seen.add(uri);
          const record = post.record ?? {};
          const author = post.author ?? {};
          const createdAt: string = record.createdAt ?? "";
          const ts = createdAt ? new Date(createdAt).toISOString() : "";
          const postHandle: string = author.handle ?? "";
          const rkey = uri.split("/").pop() ?? "";
          const postUrl =
            postHandle && rkey
              ? `https://bsky.app/profile/${postHandle}/post/${rkey}`
              : "";
          if (!postUrl) continue;
          results.push({
            id: `bsky-${Math.abs(hashStr(uri)) % 1_000_000_000_000}`,
            source: "bluesky",
            type: "post",
            title: "",
            text: record.text ?? "",
            url: postUrl,
            author: postHandle ? `@${postHandle}` : author.displayName ?? "",
            subreddit: "",
            timestamp: ts,
            engagement: {
              likes: post.likeCount ?? 0,
              retweets: post.repostCount ?? 0,
              upvotes: 0,
              comments: post.replyCount ?? 0,
              points: 0,
            },
          });
        }
        log(`Bluesky '${kwClean}' page ${page + 1}: ${posts.length} posts`);
        if (results.length >= MAX_PER_SOURCE) break;
        cursor = data.cursor ?? null;
        if (!cursor) break;
        page++;
      } catch (e) {
        log(`Bluesky error: ${e}`);
        break;
      }
    }
  }
  log(`Bluesky: ${results.length} total`);
  return results.slice(0, MAX_PER_SOURCE);
}
