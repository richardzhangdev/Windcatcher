import { Item } from "../shared/types";

export function timeAgo(tsStr: string): string {
  if (!tsStr) return "";
  try {
    const ts = new Date(tsStr);
    const diff = Date.now() - ts.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3_600_000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diff / 86_400_000);
    if (days < 30) return `${days}d ago`;
    return ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export function engagementStr(item: Item): string {
  const e = item.engagement;
  const src = item.source;
  const parts: string[] = [];
  if (src === "twitter") {
    if (e.likes) parts.push(`♥ ${e.likes.toLocaleString()}`);
    if (e.upvotes) parts.push(`↺ ${e.upvotes.toLocaleString()}`);
    if (e.comments) parts.push(`💬 ${e.comments.toLocaleString()}`);
  } else if (src === "bluesky") {
    if (e.likes) parts.push(`♥ ${e.likes.toLocaleString()}`);
    if (e.comments) parts.push(`💬 ${e.comments.toLocaleString()}`);
  } else if (src === "reddit") {
    if (e.upvotes) parts.push(`▲ ${e.upvotes.toLocaleString()}`);
    if (e.comments) parts.push(`💬 ${e.comments.toLocaleString()}`);
  } else if (src === "hackernews") {
    if (e.points) parts.push(`▲ ${e.points.toLocaleString()}`);
    if (e.comments) parts.push(`💬 ${e.comments.toLocaleString()}`);
  }
  return parts.join("  ");
}

export function formatLastUpdated(ts: string | null): string {
  if (!ts) return "never";
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return "never";
  }
}
