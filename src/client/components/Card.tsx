import React from "react";
import { Item } from "../../shared/types";
import { timeAgo, engagementStr } from "../utils";

interface CardProps {
  item: Item;
}

export function Card({ item }: CardProps) {
  const title = item.title || item.text.slice(0, 140) || "Untitled";
  const byline = [item.subreddit, item.author].filter(Boolean).join(" · ");
  const ago = timeAgo(item.timestamp);
  const eng = engagementStr(item);

  return (
    <article className="card" onClick={() => window.open(item.url, "_blank")}>
      <div className="card-meta">
        {ago && <span className="card-time">{ago}</span>}
        {eng && <span className="card-eng">{eng}</span>}
      </div>
      <h3 className="card-title">
        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
          {title}
        </a>
      </h3>
      {byline && <p className="card-author">{byline}</p>}
    </article>
  );
}
