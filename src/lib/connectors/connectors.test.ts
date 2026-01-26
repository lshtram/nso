import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RssConnector } from './rss';
import { GitHubConnector } from './github';
import { SourceEntity } from '@/types';

// Mock RSS Parser
vi.mock('rss-parser', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        parseString: vi.fn().mockResolvedValue({
          items: [
            {
              guid: '1',
              link: 'https://example.com/1',
              title: 'Test RSS Item',
              content: '<p>Content</p>',
              pubDate: '2024-01-01T00:00:00Z',
              creator: 'Author'
            }
          ]
        })
      };
    })
  };
});

describe('Connectors', () => {
  describe('RssConnector', () => {
    it('should discover items correctly', async () => {
      const connector = new RssConnector();
      const entity: SourceEntity = {
        id: 'rss-1',
        name: 'Test RSS',
        type: 'rss',
        url: 'https://example.com/feed',
        isActive: true,
        healthStatus: 'active'
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<rss><channel><item></item></channel></rss>')
      });

      const raws = await connector.discover(entity);
      expect(raws).toHaveLength(1);
      expect(raws[0].title).toBe('Test RSS Item');
    });

    it('should normalize items correctly', () => {
      const connector = new RssConnector();
      const entity: SourceEntity = {
        id: 'rss-1',
        name: 'Test RSS',
        type: 'rss',
        url: 'https://example.com/feed',
        isActive: true,
        healthStatus: 'active'
      };
      
      const raw = {
        id: '1',
        url: 'https://example.com/1',
        title: 'Title',
        rawContent: '<img src="https://example.com/img.jpg" /> content',
        publishedAt: '2024-01-01',
        imageUrl: 'https://example.com/img.jpg'
      };

      const item = connector.normalize(raw, entity);
      expect(item.imageUrl).toBe('https://example.com/img.jpg');
      expect(item.sourceName).toBe('Test RSS');
    });
  });

  describe('GitHubConnector', () => {
    it('should discover releases correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 123,
            html_url: 'https://github.com/owner/repo/releases/1',
            tag_name: 'v1.0.0',
            body: 'Release notes',
            published_at: '2024-01-01',
            author: { login: 'octocat' }
          }
        ])
      });

      const connector = new GitHubConnector();
      const entity: SourceEntity = {
        id: 'gh-1',
        name: 'Test Repo',
        type: 'github',
        url: 'https://github.com/owner/repo',
        isActive: true,
        healthStatus: 'active'
      };

      const raws = await connector.discover(entity);
      expect(raws).toHaveLength(1);
      expect(raws[0].title).toContain('repo v1.0.0');
    });
  });
});
