import { describe, it, expect } from 'vitest';
import { FeedNormalizer } from '../src/services/rss/normalizer';
import type { NewsItem } from '../src/services/rss/types';

describe('FeedNormalizer', () => {
  const normalizer = new FeedNormalizer();

  it('should normalize RSS item', () => {
    const rssItem = {
      title: 'RSS Title',
      link: 'http://example.com/rss',
      pubDate: 'Thu, 27 Apr 2006 01:00:00 +0000',
      description: 'RSS Description',
      guid: 'http://example.com/rss',
      category: ['Tech', 'News']
    };

    const expected: NewsItem = {
      title: 'RSS Title',
      link: 'http://example.com/rss',
      pubDate: expect.any(Date),
      content: 'RSS Description',
      id: 'http://example.com/rss',
      isoDate: '2006-04-27T01:00:00.000Z'
    };

    const result = normalizer.normalizeItem(rssItem, 'rss');
    expect(result).toMatchObject({
      title: 'RSS Title',
      link: 'http://example.com/rss',
      content: 'RSS Description',
      id: 'http://example.com/rss'
    });
    expect(result.pubDate.toISOString()).toBe('2006-04-27T01:00:00.000Z');
  });

  it('should normalize Atom entry', () => {
    const atomEntry = {
      title: 'Atom Title',
      link: { '@_href': 'http://example.com/atom' },
      updated: '2003-12-13T18:30:02Z',
      summary: 'Atom Summary',
      id: 'urn:uuid:1234'
    };

    const result = normalizer.normalizeItem(atomEntry, 'atom');
    expect(result).toMatchObject({
      title: 'Atom Title',
      link: 'http://example.com/atom',
      content: 'Atom Summary',
      id: 'urn:uuid:1234'
    });
    expect(result.pubDate.toISOString()).toBe('2003-12-13T18:30:02.000Z');
  });

  it('should handle Atom link as array', () => {
     const atomEntry = {
      title: 'Atom Title',
      link: [
        { '@_href': 'http://example.com/atom/self', '@_rel': 'self' },
        { '@_href': 'http://example.com/atom', '@_rel': 'alternate' }
      ],
      updated: '2003-12-13T18:30:02Z',
      id: 'urn:uuid:1234'
    };
    
    const result = normalizer.normalizeItem(atomEntry, 'atom');
    expect(result.link).toBe('http://example.com/atom');
  });

  it('should handle missing fields', () => {
    const item = { title: 'Just Title' };
    const result = normalizer.normalizeItem(item, 'rss');
    expect(result.title).toBe('Just Title');
    expect(result.link).toBe(''); // Default to empty string
    expect(result.pubDate).toBeInstanceOf(Date); // Current date? Or Invalid Date?
  });
});
