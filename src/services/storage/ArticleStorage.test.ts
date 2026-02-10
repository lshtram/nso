import { describe, it, expect, beforeEach } from 'vitest';
import { ArticleStorageService } from './ArticleStorage';
import type { NewsItem } from '../rss/types';

describe('ArticleStorageService', () => {
  let storage: ArticleStorageService;
  const now = new Date();

  const mockItem1: NewsItem = {
    title: 'Test Article 1',
    link: 'https://example.com/1',
    pubDate: new Date(now.getTime() - 1000 * 60 * 60), // 1 hour ago
    summary: 'This is the first test article',
    source: 'Test Source'
  };

  const mockItem2: NewsItem = {
    title: 'Test Article 2',
    link: 'https://example.com/2',
    pubDate: new Date(now.getTime() - 1000 * 60 * 60 * 24), // 1 day ago
    summary: 'This is the second test article with keyword',
    source: 'Test Source'
  };

  const mockItem3: NewsItem = {
    title: 'Another Article',
    link: 'https://example.com/3',
    pubDate: new Date(now.getTime() - 1000 * 60 * 60 * 48), // 2 days ago
    summary: 'Summary with keyword',
    source: 'Other Source'
  };

  beforeEach(() => {
    storage = new ArticleStorageService();
  });

  it('should add items and assign IDs', () => {
    const result = storage.add([mockItem1]);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);

    const stats = storage.getStats();
    expect(stats.totalCount).toBe(1);

    const items = storage.search('Article');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.id).toBeDefined();
  });

  it('should deduplicate items by URL', () => {
    storage.add([mockItem1]);
    const result = storage.add([mockItem1]); // Add same item again
    
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(1);
    
    const stats = storage.getStats();
    expect(stats.totalCount).toBe(1);
  });

  it('should retrieve item by ID', () => {
    storage.add([mockItem1]);
    const stored = storage.search('Article')[0];
    
    // Check type narrowing
    if (!stored || !stored.id) throw new Error('Item not stored correctly');

    const retrieved = storage.getById(stored.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.link).toBe(mockItem1.link);
  });

  it('should filter by date range', () => {
    storage.add([mockItem1, mockItem2, mockItem3]);

    // Range covering only item 1 (last 2 hours)
    const start = new Date(now.getTime() - 1000 * 60 * 120);
    const end = now;
    
    const results = storage.getByDateRange(start, end);
    expect(results.length).toBe(1);
    expect(results[0]?.title).toBe(mockItem1.title);
  });

  it('should search by keyword', () => {
    storage.add([mockItem1, mockItem2, mockItem3]);

    const results = storage.search('keyword');
    // item2 ("...with keyword") and item3 ("Summary with keyword")
    expect(results.length).toBe(2);
    
    const noResults = storage.search('nonexistent');
    expect(noResults.length).toBe(0);
  });

  it('should return correct stats', () => {
    storage.add([mockItem1, mockItem2]);
    const stats = storage.getStats();
    
    expect(stats.totalCount).toBe(2);
    expect(stats.newestDate).toEqual(mockItem1.pubDate);
    expect(stats.oldestDate).toEqual(mockItem2.pubDate);
  });

  it('should clear storage', () => {
    storage.add([mockItem1]);
    storage.clear();
    
    const stats = storage.getStats();
    expect(stats.totalCount).toBe(0);
    expect(stats.newestDate).toBeNull();
  });
});
