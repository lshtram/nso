/**
 * @file FeedScheduler.ts
 * @context RSS Service
 * @desc Manages the lifecycle of RSS feed fetching based on TTL.
 * @dependencies [RSSCollector, ArticleStorageService]
 */

import type { RSSCollector } from './collector';
import type { StorageService } from '../storage/ArticleStorage';

export interface FeedConfig {
  url: string;
  name: string;
  defaultIntervalMinutes?: number; // fallback if no TTL
}

export interface FeedStatus {
  url: string;
  lastFetched: Date | null;
  nextFetch: Date;
  lastError?: string;
  isFetching: boolean;
}

export class FeedScheduler {
  private feeds: Map<string, FeedConfig> = new Map();
  private status: Map<string, FeedStatus> = new Map();
  private timer: Timer | null = null;
  private readonly MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private collector: RSSCollector,
    private storage: StorageService,
    private options: { defaultInterval: number } = { defaultInterval: 15 }
  ) {}

  /**
   * Registers a new feed to be polled.
   */
  registerFeed(config: FeedConfig): void {
    if (!config.url) throw new Error('Feed URL is required');
    this.feeds.set(config.url, config);
    
    // Initialize status if not present
    if (!this.status.has(config.url)) {
      this.status.set(config.url, {
        url: config.url,
        lastFetched: null,
        nextFetch: new Date(), // Fetch immediately on start
        isFetching: false
      });
    }
  }

  /**
   * Starts the scheduler loop.
   */
  start(): void {
    if (this.timer) return;
    
    // Main loop runs every minute to check if any feed needs fetching
    this.timer = setInterval(() => {
      this.tick();
    }, 60 * 1000);

    // Also run immediately
    this.tick();
  }

  /**
   * Stops the scheduler loop.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Returns current status of all managed feeds.
   */
  getStatus(): FeedStatus[] {
    return Array.from(this.status.values());
  }

  /**
   * Force an immediate fetch for a specific feed or all feeds.
   */
  async fetchNow(url?: string): Promise<void> {
    if (url) {
      const status = this.status.get(url);
      if (status) {
        await this.fetchFeed(url);
      }
    } else {
      const urls = Array.from(this.feeds.keys());
      await Promise.all(urls.map(u => this.fetchFeed(u)));
    }
  }

  private async tick(): Promise<void> {
    const now = new Date();
    const fetchPromises: Promise<void>[] = [];

    for (const [url, status] of this.status.entries()) {
      if (!status.isFetching && now >= status.nextFetch) {
        fetchPromises.push(this.fetchFeed(url));
      }
    }

    await Promise.all(fetchPromises);
  }

  private async fetchFeed(url: string): Promise<void> {
    const config = this.feeds.get(url);
    const status = this.status.get(url);
    if (!config || !status || status.isFetching) return;

    status.isFetching = true;
    try {
      const results = await this.collector.collect([url]);
      const result = results[0];

      if (!result || result.error) {
        status.lastError = result?.error || 'Unknown error';
        // Schedule retry with default interval
        const interval = (config.defaultIntervalMinutes || this.options.defaultInterval) * 60 * 1000;
        status.nextFetch = new Date(Date.now() + interval);
      } else {
        // Save items
        this.storage.add(result.items);
        
        status.lastFetched = new Date();
        status.lastError = undefined;

        // Determine next fetch time
        let intervalMinutes = result.ttl || config.defaultIntervalMinutes || this.options.defaultInterval;
        let intervalMs = intervalMinutes * 60 * 1000;
        
        // Enforce minimum
        if (intervalMs < this.MIN_INTERVAL_MS) {
          intervalMs = this.MIN_INTERVAL_MS;
        }

        status.nextFetch = new Date(Date.now() + intervalMs);
      }
    } catch (error) {
      status.lastError = error instanceof Error ? error.message : String(error);
      const interval = (config.defaultIntervalMinutes || this.options.defaultInterval) * 60 * 1000;
      status.nextFetch = new Date(Date.now() + interval);
    } finally {
      status.isFetching = false;
    }
  }
}
