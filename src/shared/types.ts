export interface Engagement {
  likes: number;
  upvotes: number;
  comments: number;
  points: number;
}

export interface Item {
  id: string;
  source: string;
  type: string;
  title: string;
  text: string;
  url: string;
  author: string;
  subreddit: string;
  timestamp: string;
  engagement: Engagement;
  thumbnail?: string;
}

export interface ResultsFile {
  last_updated: string | null;
  items: Item[];
}

export interface SourceConfig {
  twitter: boolean;
  reddit: boolean;
  hackernews: boolean;
  news: boolean;
  youtube: boolean;
  bluesky: boolean;
  [key: string]: boolean;
}

export interface CustomFeed {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface AppConfig {
  sources: SourceConfig;
  source_order: string[];
  custom_feeds: CustomFeed[];
  keywords: string[];
  twitter_bearer_token: string;
  youtube_api_key: string;
  bluesky_handle: string;
  bluesky_app_password: string;
  max_results_per_source: number;
}

export interface BuiltinSource {
  id: string;
  icon: string;
  label: string;
  color: string;
}

export const BUILTIN_SOURCES: BuiltinSource[] = [
  { id: "twitter",    icon: "x-social-media-logo-icon.svg", label: "Twitter / X", color: "#1d9bf0" },
  { id: "reddit",     icon: "reddit-icon.svg",               label: "Reddit",       color: "#ff4500" },
  { id: "hackernews", icon: "hacker-news-icon.svg",          label: "Hacker News",  color: "#ff6600" },
  { id: "news",       icon: "Google_News_icon.svg",          label: "Google News",  color: "#0f62fe" },
  { id: "youtube",    icon: "YouTube_Logo.svg",              label: "YouTube",      color: "#ff0000" },
  { id: "bluesky",    icon: "Bluesky_Logo.svg",              label: "Bluesky",      color: "#0085ff" },
];

export const DEFAULT_SOURCE_ORDER = ["twitter", "reddit", "youtube", "news", "bluesky", "hackernews"];

export const DEFAULT_CONFIG: AppConfig = {
  sources: {
    twitter:    false,
    reddit:     true,
    hackernews: true,
    news:       true,
    youtube:    false,
    bluesky:    false,
  },
  source_order:          DEFAULT_SOURCE_ORDER,
  custom_feeds:          [],
  keywords:              ['"IBM Bob"', '"IBM Project Bob"'],
  twitter_bearer_token:  "",
  youtube_api_key:       "",
  bluesky_handle:        "",
  bluesky_app_password:  "",
  max_results_per_source: 30,
};

export interface StatusResponse {
  last_updated: string | null;
  total_items: number;
  refreshing: boolean;
}
