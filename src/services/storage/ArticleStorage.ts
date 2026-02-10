import type { NewsItem } from '../rss/types';
import { DeduplicationService } from './DeduplicationService';

export interface StorageStats {
  totalCount: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}

export interface AddResult {
  added: number;
  skipped: number;
}

export interface StorageService {
  /**
   * Adds a batch of items to the store.
   * Handles deduplication based on URL.
   */
  add(items: NewsItem[]): AddResult;

  /**
   * Retrieves an article by its unique ID.
   */
  getById(id: string): NewsItem | null;

  /**
   * Retrieves articles published within a specific date range.
   * Inclusive of start and end dates.
   */
  getByDateRange(start: Date, end: Date): NewsItem[];

  /**
   * Searches articles by keyword in title or description.
   * Case-insensitive.
   */
  search(query: string): NewsItem[];

  /**
   * Returns current storage statistics.
   */
  getStats(): StorageStats;

  /**
   * Clears the storage (useful for testing/reset).
   */
  clear(): void;
}

export class ArticleStorageService implements StorageService {
  // Primary store: ID -> NewsItem
  private articles: Map<string, NewsItem> = new Map();

  // Deduplication index: URL -> ID
  private urlIndex: Map<string, string> = new Map();

  private deduplicationService = new DeduplicationService();

  /**
   * Simple hash function for generating deterministic IDs from URLs.
   * Uses a DJB2-like algorithm.
   */
  private generateId(url: string): string {
    let hash = 5381;
    for (let i = 0; i < url.length; i++) {
      hash = (hash * 33) ^ url.charCodeAt(i);
    }
    // Return positive hex string
    return (hash >>> 0).toString(16);
  }

  add(items: NewsItem[]): AddResult {
    let added = 0;
    let skipped = 0;

    // Prune deduplication index (items older than 7 days)
    this.deduplicationService.prune(7);

    for (const item of items) {
      if (!item.link) {
        continue;
      }

      // 1. Basic URL-based deduplication
      if (this.urlIndex.has(item.link)) {
        skipped++;
        continue;
      }

      // 2. Smart deduplication (Title/Content similarity)
      const dedupResult = this.deduplicationService.check(item);
      if (dedupResult.isDuplicate && dedupResult.originalId) {
        console.log(`[ArticleStorageService] Skipping smart duplicate: "${item.title}" (Reason: ${dedupResult.reason}, Original ID: ${dedupResult.originalId})`);
        
        // Merge metadata (alternate links)
        const existing = this.articles.get(dedupResult.originalId);
        if (existing) {
          existing.alternateLinks = existing.alternateLinks || [];
          if (!existing.alternateLinks.includes(item.link)) {
            existing.alternateLinks.push(item.link);
          }
        }
        
        skipped++;
        continue;
      }

      // Generate ID if missing
      const id = item.id || this.generateId(item.link);
      
      // Store item with ensured ID
      const storedItem: NewsItem = { ...item, id };
      
      this.articles.set(id, storedItem);
      this.urlIndex.set(item.link, id);
      this.deduplicationService.index(storedItem, id);
      added++;
    }

    return { added, skipped };
  }

  getById(id: string): NewsItem | null {
    return this.articles.get(id) || null;
  }

  getByDateRange(start: Date, end: Date): NewsItem[] {
    const results: NewsItem[] = [];
    if (start > end) {
        return [];
    }

    for (const item of this.articles.values()) {
      const pubDate = new Date(item.pubDate);
      if (pubDate >= start && pubDate <= end) {
        results.push(item);
      }
    }
    
    return results.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );
  }

  search(query: string): NewsItem[] {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: NewsItem[] = [];

    for (const item of this.articles.values()) {
      const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
      const summaryMatch = item.summary?.toLowerCase().includes(lowerQuery) || 
                           item.content?.toLowerCase().includes(lowerQuery);

      if (titleMatch || summaryMatch) {
        results.push(item);
      }
    }

    return results;
  }

  getStats(): StorageStats {
    let oldest: Date | null = null;
    let newest: Date | null = null;

    if (this.articles.size > 0) {
      for (const item of this.articles.values()) {
        const date = new Date(item.pubDate);
        if (!oldest || date < oldest) oldest = date;
        if (!newest || date > newest) newest = date;
      }
    }

    return {
      totalCount: this.articles.size,
      oldestDate: oldest,
      newestDate: newest
    };
  }

  clear(): void {
    this.articles.clear();
    this.urlIndex.clear();
    this.deduplicationService.clear();
  }
}
