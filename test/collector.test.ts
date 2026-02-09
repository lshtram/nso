import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RSSCollector } from '../src/services/rss/collector';

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>W3Schools Home Page</title>
  <item>
    <title>RSS Tutorial</title>
    <link>https://www.w3schools.com/xml/xml_rss.asp</link>
    <pubDate>Thu, 27 Apr 2006 01:00:00 +0000</pubDate>
  </item>
</channel>
</rss>`;

describe('RSSCollector', () => {
  let collector: RSSCollector;
  const originalFetch = global.fetch;

  beforeEach(() => {
    collector = new RSSCollector();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should collect feeds successfully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(RSS_SAMPLE),
    });

    const results = await collector.collect(['https://example.com/rss']);
    
    expect(results).toHaveLength(1);
    expect(results[0]!.url).toBe('https://example.com/rss');
    expect(results[0]!.error).toBeUndefined();
    expect(results[0]!.items).toHaveLength(1);
    expect(results[0]!.items[0]!.title).toBe('RSS Tutorial');
  });

  it('should handle fetch errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const results = await collector.collect(['https://example.com/rss']);
    
    expect(results).toHaveLength(1);
    expect(results[0]!.error).toBeDefined();
    expect(results[0]!.items).toHaveLength(0);
  });

  it('should handle parse errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('invalid xml'),
    });

    const results = await collector.collect(['https://example.com/rss']);
    
    expect(results).toHaveLength(1);
    expect(results[0]!.error).toContain('Empty result'); // or whatever error message
    expect(results[0]!.items).toHaveLength(0);
  });

  it('should collect multiple feeds in parallel', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(RSS_SAMPLE),
    });

    const results = await collector.collect(['url1', 'url2']);
    expect(results).toHaveLength(2);
    expect(results[0]!.items).toHaveLength(1);
    expect(results[1]!.items).toHaveLength(1);
  });
});
