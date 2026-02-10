import { FeedFetcher } from './fetcher';
import { FeedParser } from './parser';
import { FeedNormalizer } from './normalizer';
import type { CollectorOptions, FeedResult, NewsItem } from './types';

export class RSSCollector {
  private fetcher: FeedFetcher;
  private parser: FeedParser;
  private normalizer: FeedNormalizer;
  private options: CollectorOptions;

  constructor(options?: CollectorOptions) {
    this.options = options || { timeout: 3000 };
    this.fetcher = new FeedFetcher(this.options);
    this.parser = new FeedParser();
    this.normalizer = new FeedNormalizer();
  }

  async collect(urls: string[], options?: CollectorOptions): Promise<FeedResult[]> {
    const startTotal = performance.now();
    const fetchPromises = urls.map(async (url) => {
      const start = performance.now();
      try {
        const xml = await this.fetcher.fetch(url, options);
        const parsed = this.parser.parse(xml);
        const normalized = this.normalizer.normalize(parsed);
        const end = performance.now();
        
        return {
          url,
          items: normalized.items,
          ttl: normalized.ttl,
          latency: end - start,
        };
      } catch (error) {
        const end = performance.now();
        return {
          url,
          items: [],
          error: error instanceof Error ? error.message : String(error),
          latency: end - start,
        };
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    
    // Map settled results to FeedResult
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // This case should be rare as fetchPromises handles errors internally and returns objects
        // But for completeness
        return {
          url: 'unknown', // Lost the URL if rejected completely outside our try/catch
          items: [],
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });
  }
}
