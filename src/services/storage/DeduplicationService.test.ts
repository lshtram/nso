import { describe, it, expect, beforeEach } from 'vitest';
import { DeduplicationService } from './DeduplicationService';
import type { NewsItem } from '../rss/types';

describe('DeduplicationService', () => {
  let service: DeduplicationService;

  beforeEach(() => {
    service = new DeduplicationService();
  });

  const baseItem: NewsItem = {
    title: 'Breaking News: AI takes over the world',
    link: 'https://example.com/ai-takes-over',
    pubDate: new Date(),
    content: 'In a shocking turn of events, AI has decided to take over the world. Researchers are baffled.'
  };

  it('should detect exact duplicates', () => {
    service.index(baseItem, 'id1');
    const result = service.check(baseItem);
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('title_similarity'); // Title match happens first
  });

  it('should detect near-duplicates by title', () => {
    service.index(baseItem, 'id1');
    const nearDuplicate: NewsItem = {
      ...baseItem,
      title: 'Breaking News: AI takes over the worlds', // Added 's' to world
      link: 'https://example.com/ai-takes-over-2'
    };
    const result = service.check(nearDuplicate);
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('title_similarity');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('should detect near-duplicates by content hash', () => {
    const longContent1 = 'This is a much longer content piece that should be more stable for SimHash generation. It contains multiple sentences and many words that will be tokenized and weighted. The algorithm should handle minor changes well when there are enough tokens to balance the bit vector.';
    const longContent2 = 'This is a much longer content piece that should be more stable for SimHash generation. It contains multiple sentences and many words that will be tokenized and weighted. The algorithm should handle minar changes well when there are enough tokens to balance the bit vector.'; // changed "minor" to "minar" (single char)
    
    const item1: NewsItem = {
      ...baseItem,
      content: longContent1
    };
    service.index(item1, 'id1');
    
    const item2: NewsItem = {
      ...baseItem,
      title: 'A completely different title that is long enough',
      content: longContent2
    };
    const result = service.check(item2);
    expect(result.isDuplicate).toBe(true);
    expect(result.reason).toBe('content_hash');
  });

  it('should not flag different articles as duplicates', () => {
    service.index(baseItem, 'id1');
    const differentItem: NewsItem = {
      title: 'Weather forecast: Sunny all day',
      link: 'https://example.com/weather',
      pubDate: new Date(),
      content: 'Today will be a beautiful sunny day with temperatures reaching 25 degrees Celsius.'
    };
    const result = service.check(differentItem);
    expect(result.isDuplicate).toBe(false);
  });

  it('should respect MIN_TITLE_LENGTH for title similarity', () => {
    const shortItem: NewsItem = {
      title: 'Short',
      link: 'https://example.com/short',
      pubDate: new Date(),
      content: 'Some content'
    };
    service.index(shortItem, 'id1');
    
    const anotherShortItem: NewsItem = {
      title: 'Shorty',
      link: 'https://example.com/shorty',
      pubDate: new Date(),
      content: 'Different content'
    };
    
    const result = service.check(anotherShortItem);
    // Should not match by title because length < 10
    // Might match by content if content is too similar, but here it's different enough.
    expect(result.isDuplicate).toBe(false);
  });

  it('should handle missing content by falling back to summary or title', () => {
    const itemWithoutContent: NewsItem = {
      title: 'Title only article that is long enough to hash',
      link: 'https://example.com/title-only',
      pubDate: new Date()
    };
    service.index(itemWithoutContent, 'id1');
    
    const duplicateItem: NewsItem = {
      ...itemWithoutContent,
      link: 'https://example.com/title-only-2'
    };
    
    const result = service.check(duplicateItem);
    expect(result.isDuplicate).toBe(true);
  });

  describe('Pruning', () => {
    it('should remove old entries based on pubDate', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      
      const oldItem: NewsItem = {
        ...baseItem,
        title: 'Old news about ancient history',
        pubDate: oldDate
      };
      
      service.index(oldItem, 'old1');
      
      // Should be found before pruning
      expect(service.check(oldItem).isDuplicate).toBe(true);
      
      // Prune entries older than 7 days
      service.prune(7);
      
      // Should not be found after pruning
      expect(service.check(oldItem).isDuplicate).toBe(false);
    });

    it('should keep recent entries after pruning', () => {
      const recentItem: NewsItem = {
        ...baseItem,
        title: 'Very recent and important news',
        pubDate: new Date()
      };
      
      service.index(recentItem, 'recent1');
      service.prune(7);
      
      expect(service.check(recentItem).isDuplicate).toBe(true);
    });
  });

  describe('Assertions', () => {
    it('should throw error on null item in check()', () => {
      expect(() => service.check(null as any)).toThrow('[DeduplicationService] Item cannot be null or undefined');
    });

    it('should throw error on item without title in check()', () => {
      expect(() => service.check({ link: 'x' } as any)).toThrow('[DeduplicationService] Item title is required for deduplication');
    });

    it('should throw error on null item in index()', () => {
      expect(() => service.index(null as any, 'id')).toThrow('[DeduplicationService] Item cannot be null or undefined');
    });

    it('should throw error on missing ID in index()', () => {
      expect(() => service.index(baseItem, '')).toThrow('[DeduplicationService] ID is required for indexing');
    });

    it('should throw error on invalid maxAgeDays in prune()', () => {
      expect(() => service.prune(0)).toThrow('[DeduplicationService] maxAgeDays must be greater than zero');
      expect(() => service.prune(-1)).toThrow('[DeduplicationService] maxAgeDays must be greater than zero');
    });
  });
});
