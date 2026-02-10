export interface NewsItem {
  id?: string;
  title: string;
  link: string;
  pubDate: Date;
  content?: string;
  summary?: string;
  author?: string;
  categories?: string[];
  isoDate?: string;
  source?: string;
}

export interface CollectorOptions {
  timeout?: number; // ms, default 3000
  maxConcurrent?: number; // default 10
}

export interface FeedResult {
  url: string;
  items: NewsItem[];
  error?: string;
  latency?: number;
  ttl?: number; // Minutes
}

export interface ParsedFeed {
  title?: string;
  description?: string;
  link?: string;
  items: any[];
}
