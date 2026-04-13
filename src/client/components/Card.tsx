import React from "react";
import { Item } from "../../shared/types";
import { timeAgo, engagementStr } from "../utils";

interface CardProps {
  item: Item;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1] : null;
}

function getThumbnail(item: Item): string | undefined {
  if (item.thumbnail) return item.thumbnail;
  if (item.source === "youtube") {
    const vid = getYouTubeId(item.url);
    if (vid) return `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
  }
  return undefined;
}

function stripTrailingUrls(text: string): string {
  return text.replace(/\s*https?:\/\/\S+$/g, "").trim();
}

function CardBody({ item }: { item: Item }) {
  const thumb = getThumbnail(item);
  const src = item.source;

  if (src === "youtube") {
    return (
      <>
        {thumb && (
          <div className="card-thumb-wrap card-thumb-video">
            <img className="card-thumb" src={thumb} alt="" loading="lazy" />
            <div className="card-play">▶</div>
          </div>
        )}
        <h3 className="card-title">
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {item.title || "Untitled"}
          </a>
        </h3>
        {item.text && <p className="card-snippet">{item.text}</p>}
      </>
    );
  }

  if (src === "twitter" || src === "bluesky") {
    const body = stripTrailingUrls(item.text);
    return (
      <>
        <p className="card-body-text">{body || "View post"}</p>
        {thumb && (
          <div className="card-thumb-wrap">
            <img className="card-thumb" src={thumb} alt="" loading="lazy" />
          </div>
        )}
      </>
    );
  }

  if (src === "reddit") {
    const title = item.title || item.text.slice(0, 140) || "Untitled";
    return (
      <>
        <h3 className="card-title">
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {title}
          </a>
        </h3>
        {item.text && <p className="card-snippet">{item.text}</p>}
        {thumb && (
          <div className="card-thumb-wrap">
            <img className="card-thumb" src={thumb} alt="" loading="lazy" />
          </div>
        )}
      </>
    );
  }

  if (src === "hackernews") {
    const title = item.title || item.text.slice(0, 140) || "Untitled";
    const isComment = item.type === "comment";
    return (
      <>
        <h3 className="card-title">
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {isComment ? `💬 ${title}` : title}
          </a>
        </h3>
        {isComment && item.text && <p className="card-snippet">{item.text}</p>}
      </>
    );
  }

  // news / default
  const title = item.title || item.text.slice(0, 140) || "Untitled";
  return (
    <>
      <h3 className="card-title">
        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {title}
        </a>
      </h3>
      {item.text && <p className="card-snippet">{item.text}</p>}
      {thumb && (
        <div className="card-thumb-wrap">
          <img className="card-thumb" src={thumb} alt="" loading="lazy" />
        </div>
      )}
    </>
  );
}

export function Card({ item }: CardProps) {
  const byline = [item.subreddit, item.author].filter(Boolean).join(" · ");
  const ago = timeAgo(item.timestamp);
  const eng = engagementStr(item);

  return (
    <article className={`card card-${item.source}`} onClick={() => window.open(item.url, "_blank")}>
      <div className="card-meta">
        {ago && <span className="card-time">{ago}</span>}
        {eng && <span className="card-eng">{eng}</span>}
      </div>
      <CardBody item={item} />
      {byline && <p className="card-author">{byline}</p>}
    </article>
  );
}
