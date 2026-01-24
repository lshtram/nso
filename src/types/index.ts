/**
 * Core Domain Types for Dream News
 */

export type SourceType = 'rss' | 'reddit' | 'x' | 'youtube' | 'github' | 'medium' | 'arxiv';

export interface ContentItem {
  id: string;
  sourceType: SourceType;
  sourceName: string; // e.g. "Nate Jones"
  url: string;
  title: string;
  author?: string;
  publishedAt: string;
  fetchedAt: string;
  summary: string; // 2-3 sentences
  fullText?: string;
  imageUrl?: string;
  entities?: string[];
  topics?: string[];
  language?: string;
  embedding?: number[];
}

export interface StoryCluster {
  id: string;
  title: string;
  narrative: string; // The "Synthesis"
  whyItMatters: string;
  items: ContentItem[];
  topItems: ContentItem[];
  momentumScore: number;
  relevanceScore: number;
  finalRank: number;
  category: 'TECH' | 'POLITICS' | 'PHILOSOPHY' | 'MUSIC' | 'COOKING' | 'GENERAL';
  trendIndicator: 'rising' | 'stable' | 'new';
}

export interface DailySummary {
  headline: string;
  content: string; // Multi-paragraph narrative brief
  topClusters: StoryCluster[];
}

export interface SourceEntity {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  isActive: boolean;
  lastSyncedAt?: string;
  healthStatus: 'active' | 'error' | 'muted';
  signalScore?: number; // 0-100
}

export interface SteeringContext {
  globalStrategy: string;
  parameters: Record<string, any>;
}
