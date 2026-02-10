/**
 * @file FeedScheduler.test.ts
 * @context RSS Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FeedScheduler } from './FeedScheduler';
import type { RSSCollector } from './collector';
import type { StorageService } from '../storage/ArticleStorage';

describe('FeedScheduler', () => {
  let scheduler: FeedScheduler;
  let mockCollector: any;
  let mockStorage: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(0));
    
    mockCollector = {
      collect: vi.fn().mockResolvedValue([{
        url: 'https://example.com/rss',
        items: [{ title: 'Article 1', link: 'https://example.com/1', pubDate: new Date() }],
        ttl: 30
      }])
    };

    mockStorage = {
      add: vi.fn().mockReturnValue({ added: 1, skipped: 0 }),
      getStats: vi.fn(),
      clear: vi.fn()
    };

    scheduler = new FeedScheduler(
      mockCollector as unknown as RSSCollector,
      mockStorage as unknown as StorageService,
      { defaultInterval: 15 }
    );
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
  });

  it('should register a feed and initialize status', () => {
    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed' });
    const status = scheduler.getStatus();
    
    expect(status.length).toBe(1);
    const firstStatus = status[0]!;
    expect(firstStatus.url).toBe('https://example.com/rss');
    expect(firstStatus.isFetching).toBe(false);
  });

  it('should fetch immediately on start', async () => {
    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed' });
    scheduler.start();
    
    // Wait for the async fetchFeed to complete
    await vi.waitFor(() => {
      expect(mockCollector.collect).toHaveBeenCalled();
    });
    
    expect(mockStorage.add).toHaveBeenCalled();
  });

  it('should respect TTL from feed', async () => {
    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed' });
    scheduler.start();
    
    await vi.waitFor(() => {
      const s = scheduler.getStatus();
      if (!s[0] || s[0].lastFetched === null) throw new Error('Not fetched yet');
    });
    
    const status = scheduler.getStatus();
    const firstStatus = status[0]!;
    // Use toBeGreaterThanOrEqual because waitFor might advance time slightly
    expect(firstStatus.nextFetch.getTime()).toBeGreaterThanOrEqual(30 * 60 * 1000);
    expect(firstStatus.nextFetch.getTime()).toBeLessThan(31 * 60 * 1000);
  });

  it('should enforce minimum interval of 5 minutes', async () => {
    mockCollector.collect.mockResolvedValueOnce([{
      url: 'https://example.com/rss',
      items: [],
      ttl: 1 // 1 minute
    }]);

    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed' });
    scheduler.start();
    
    await vi.waitFor(() => {
      const s = scheduler.getStatus();
      if (!s[0] || s[0].lastFetched === null) throw new Error('Not fetched yet');
    });
    
    const status = scheduler.getStatus();
    const firstStatus = status[0]!;
    expect(firstStatus.nextFetch.getTime()).toBeGreaterThanOrEqual(5 * 60 * 1000);
    expect(firstStatus.nextFetch.getTime()).toBeLessThan(6 * 60 * 1000);
  });

  it('should use default interval if no TTL provided', async () => {
    mockCollector.collect.mockResolvedValueOnce([{
      url: 'https://example.com/rss',
      items: [],
      ttl: undefined
    }]);

    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed', defaultIntervalMinutes: 20 });
    scheduler.start();
    
    await vi.waitFor(() => {
      const s = scheduler.getStatus();
      if (!s[0] || s[0].lastFetched === null) throw new Error('Not fetched yet');
    });
    
    const status = scheduler.getStatus();
    const firstStatus = status[0]!;
    expect(firstStatus.nextFetch.getTime()).toBeGreaterThanOrEqual(20 * 60 * 1000);
    expect(firstStatus.nextFetch.getTime()).toBeLessThan(21 * 60 * 1000);
  });

  it('should handle fetch errors and schedule retry', async () => {
    mockCollector.collect.mockResolvedValueOnce([{
      url: 'https://example.com/rss',
      items: [],
      error: 'Network Error'
    }]);

    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed' });
    scheduler.start();
    
    await vi.waitFor(() => {
      const s = scheduler.getStatus();
      if (!s[0] || s[0].lastError === undefined) throw new Error('No error yet');
    });
    
    const status = scheduler.getStatus();
    const firstStatus = status[0]!;
    expect(firstStatus.lastError).toBe('Network Error');
    // Retries using default interval (15 mins)
    expect(firstStatus.nextFetch.getTime()).toBeGreaterThanOrEqual(15 * 60 * 1000);
    expect(firstStatus.nextFetch.getTime()).toBeLessThan(16 * 60 * 1000);
  });

  it('should prevent overlapping fetches', async () => {
    // Slow collector
    let resolveCollect: any;
    const collectPromise = new Promise((resolve) => { resolveCollect = resolve; });
    mockCollector.collect.mockReturnValue(collectPromise);

    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed' });
    
    // First trigger
    scheduler.fetchNow('https://example.com/rss');
    
    const status1 = scheduler.getStatus()[0]!;
    expect(status1.isFetching).toBe(true);

    // Second trigger while first is still running
    await scheduler.fetchNow('https://example.com/rss');
    
    expect(mockCollector.collect).toHaveBeenCalledTimes(1);

    resolveCollect([{ url: 'https://example.com/rss', items: [] }]);
    await vi.waitFor(() => {
      const s = scheduler.getStatus();
      return !!s[0] && !s[0].isFetching;
    });
    
    const status2 = scheduler.getStatus()[0]!;
    expect(status2.isFetching).toBe(false);
  });

  it('should run scheduled fetches over time', async () => {
    mockCollector.collect.mockResolvedValueOnce([{
      url: 'https://example.com/rss',
      items: [],
      ttl: undefined
    }]);

    scheduler.registerFeed({ url: 'https://example.com/rss', name: 'Test Feed', defaultIntervalMinutes: 10 });
    scheduler.start();
    
    await vi.waitFor(() => {
      expect(mockCollector.collect).toHaveBeenCalledTimes(1);
    });

    // Advance time by 11 minutes (to be safe)
    for (let i = 0; i < 11; i++) {
      vi.advanceTimersByTime(60 * 1000);
      vi.runOnlyPendingTimers();
      await Promise.resolve();
    }
    
    await vi.waitFor(() => {
       expect(mockCollector.collect).toHaveBeenCalledTimes(2);
    });
  });
});
