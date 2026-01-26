import { ContentItem, SourceEntity } from '@/types';
import { BaseConnector } from './base';
import { RawItem } from './types';

export class GitHubConnector extends BaseConnector {
  async discover(entity: SourceEntity): Promise<RawItem[]> {
    try {
      // Expects URL like https://github.com/owner/repo
      const parts = entity.url.split('github.com/')[1]?.split('/');
      if (!parts || parts.length < 2) {
        throw new Error('Invalid GitHub URL');
      }
      
      const [owner, repo] = parts;
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const releases = await response.json();
      
      return (releases as any[]).map(release => ({
        id: release.id.toString(),
        url: release.html_url,
        title: `${repo} ${release.name || release.tag_name}`,
        rawContent: release.body || '',
        publishedAt: release.published_at,
        author: release.author?.login,
        avatarUrl: release.author?.avatar_url
      }));
    } catch (error) {
      console.error(`[GitHubConnector] Error discovering ${entity.url}:`, error);
      return [];
    }
  }

  normalize(raw: RawItem, entity: SourceEntity): ContentItem {
    return {
      id: raw.id,
      sourceType: 'github',
      sourceName: entity.name,
      url: raw.url,
      title: raw.title,
      author: raw.author,
      publishedAt: raw.publishedAt,
      fetchedAt: new Date().toISOString(),
      summary: '', // Stage 8
      fullText: raw.rawContent,
      imageUrl: (raw as any).avatarUrl,
      topics: ['TECH', 'OPEN_SOURCE'],
      entities: []
    };
  }
}
