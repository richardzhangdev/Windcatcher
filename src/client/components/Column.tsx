import React from "react";
import { Item, AppConfig, BuiltinSource } from "../../shared/types";
import { Card } from "./Card";

interface ColumnProps {
  source: BuiltinSource;
  items: Item[];
  config: AppConfig;
  onRemove: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function EmptyState({ sourceId, config }: { sourceId: string; config: AppConfig }) {
  if (sourceId === "twitter") {
    const hasToken = Boolean(config.twitter_bearer_token?.trim());
    return hasToken ? (
      <div className="col-empty">
        No tweets found yet.<br /><br />
        Check the Refresh log for API errors.
      </div>
    ) : (
      <div className="col-empty">
        No Twitter results.<br /><br />
        Add a Bearer Token in the .env file to enable Twitter / X search.
      </div>
    );
  }
  if (sourceId === "youtube") {
    const hasKey = Boolean(config.youtube_api_key?.trim());
    return hasKey ? (
      <div className="col-empty">No YouTube videos found yet.<br /><br />Click Refresh to search.</div>
    ) : (
      <div className="col-empty">
        No YouTube results.<br /><br />
        Add a free YouTube API key in the .env file. Get one at{" "}
        <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
          Google Cloud Console
        </a>.
      </div>
    );
  }
  if (sourceId === "bluesky") {
    const hasCreds = Boolean(config.bluesky_handle?.trim() && config.bluesky_app_password?.trim());
    return hasCreds ? (
      <div className="col-empty">No Bluesky posts found yet.<br /><br />Click Refresh to search.</div>
    ) : (
      <div className="col-empty">
        Bluesky search requires a login.<br /><br />
        Add your handle and an App Password in the .env file. Create one at{" "}
        <a href="https://bsky.app/settings/app-passwords" target="_blank" rel="noopener noreferrer">
          bsky.app/settings/app-passwords
        </a>.
      </div>
    );
  }
  return <div className="col-empty">No results yet — click Refresh to fetch.</div>;
}

export function Column({ source, items, config, onRemove, onDragStart, onDragOver, onDrop, onDragEnd, isDragging }: ColumnProps) {
  return (
    <div className={`col${isDragging ? " col-dragging" : ""}`}>
      <div
        className="col-hd"
        style={{ "--cc": source.color } as React.CSSProperties}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", source.id);
          onDragStart(source.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          onDragOver(e, source.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop();
        }}
        onDragEnd={() => onDragEnd()}
      >
        <img className="col-icon" src={`/icons/${source.icon}`} alt="" />
        <span className="col-label">{source.label}</span>
        {items.length > 0 && (
          <span className="col-count">{items.length}</span>
        )}
        <button
          className="col-rm"
          onClick={(e) => { e.stopPropagation(); onRemove(source.id); }}
          title="Remove column"
        >
          &times;
        </button>
      </div>
      <div className="col-body">
        {items.length > 0
          ? items.map((item) => <Card key={item.id} item={item} />)
          : <EmptyState sourceId={source.id} config={config} />}
      </div>
    </div>
  );
}
