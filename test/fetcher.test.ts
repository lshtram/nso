import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeedFetcher } from '../src/services/rss/fetcher';

describe('FeedFetcher', () => {
  let fetcher: FeedFetcher;

  const originalFetch = global.fetch;

  beforeEach(() => {
    fetcher = new FeedFetcher({ timeout: 100 }); // Fast timeout for tests
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch a single URL successfully', async () => {
    const mockResponse = {
      ok: true,
      text: () => Promise.resolve('<rss>...</rss>'),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await fetcher.fetch('https://example.com/rss');
    expect(result).toBe('<rss>...</rss>');
    expect(fetch).toHaveBeenCalledWith('https://example.com/rss', expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('should handle fetch errors', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(fetcher.fetch('https://example.com/rss')).rejects.toThrow('Network error');
  });

  it('should handle non-ok responses', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
    };
    (fetch as any).mockResolvedValue(mockResponse);

    await expect(fetcher.fetch('https://example.com/rss')).rejects.toThrow('HTTP 404: Not Found');
  });

  it('should timeout if request takes too long', async () => {
    (fetch as any).mockImplementation(async ({ signal }: { signal: AbortSignal }) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve({ ok: true, text: () => Promise.resolve('ok') });
        }, 200); // Longer than timeout
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      });
    });

    await expect(fetcher.fetch('https://example.com/rss')).rejects.toThrow();
  });

  it('should fetch multiple URLs in parallel using fetchAll', async () => {
    const mockResponse = {
      ok: true,
      text: () => Promise.resolve('<rss>...</rss>'),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const results = await fetcher.fetchAll(['https://a.com', 'https://b.com']);
    
    expect(results).toHaveLength(2);
    expect(results[0]!.status).toBe('fulfilled');
    expect(results[1]!.status).toBe('fulfilled');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
