import Parser from 'rss-parser';
import { ContentItem, SourceEntity } from '@/types';
import { BaseConnector } from './base';
import { RawItem } from './types';

export class RssConnector extends BaseConnector {
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['media:thumbnail', 'mediaThumbnail'],
          ['content:encoded', 'contentEncoded'],
        ],
      },
    });
  }

  async discover(entity: SourceEntity): Promise<RawItem[]> {
    try {
      console.log(`[RssConnector] Fetching: ${entity.url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response = await fetch(entity.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', // More permissive UA
          'Accept': 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8'
        },
        next: { revalidate: 0 },
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[RssConnector] ${entity.name} HTTP Error: ${response.status}`);
        return [];
      }

      let text = await response.text();

      // HTML Feed Discovery Logic
      if (text.trim().startsWith('<!DOCTYPE html') || text.includes('<html')) {
         console.log(`[RssConnector] Detected HTML at ${entity.url}. Searching for feed links...`);
         
         // 1. Check <link rel="alternate" type="application/rss+xml">
         let feedMatch = text.match(/<link[^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["']/i);
         // 2. Check <link rel="alternate" type="application/atom+xml">
         if (!feedMatch) feedMatch = text.match(/<link[^>]+type=["']application\/atom\+xml["'][^>]+href=["']([^"']+)["']/i);
         // 3. Fallback: Check anchor tags with "rss" or "feed" in href
         if (!feedMatch) feedMatch = text.match(/<a[^>]+href=["']([^"']+\.(?:xml|rss))["'][^>]*>/i);

         if (feedMatch && feedMatch[1]) {
            let discoveredUrl = feedMatch[1];
             // Handle relative URLs
            if (discoveredUrl.startsWith('/')) {
              const u = new URL(entity.url);
              // Avoid double slashes if base ends with slash
              const protocol = u.protocol;
              const host = u.host;
              discoveredUrl = `${protocol}//${host}${discoveredUrl}`;
            } else if (!discoveredUrl.startsWith('http')) {
               // Handle relative path (e.g. "feed.xml" from "example.com/blog/")
               try {
                 const u = new URL(discoveredUrl, entity.url);
                 discoveredUrl = u.toString();
               } catch (e) {
                 // Fallback
                 const u = new URL(entity.url);
                 discoveredUrl = `${u.origin}/${discoveredUrl}`;
               }
            }

            console.log(`[RssConnector] Discovered feed: ${discoveredUrl}`);
            // Re-fetch the actual feed
            response = await fetch(discoveredUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            text = await response.text();
         } else {
            console.warn(`[RssConnector] No feed found on HTML page: ${entity.url}`);
         }
      }

      const feed = await this.parser.parseString(text);
      
      console.log(`[RssConnector] Parsed ${feed.items.length} items from ${entity.name}`);

      return feed.items.map(item => {
        // High-fidelity image and content extraction (same as before)
        let imageUrl = item.enclosure?.url;
        if ((item as any).mediaContent) {
           const media = (item as any).mediaContent;
           const bestMatch = media.find((m: any) => m.$?.medium === 'image' && parseInt(m.$?.width || '0') > 300) || media[0];
           imageUrl = bestMatch?.$?.url || imageUrl;
        }
        if (!imageUrl) {
          const content = (item as any).contentEncoded || item.content || item.contentSnippet || '';
          const match = content.match(/<img[^>]+src=["']([^"']+)["']/);
          if (match) imageUrl = match[1];
        }

        return {
          id: item.guid || item.link || `${entity.id}-${item.title}`,
          url: item.link || '',
          title: item.title || 'Untitled',
          rawContent: (item as any).contentEncoded || item.content || item.contentSnippet || '',
          publishedAt: item.pubDate || new Date().toISOString(),
          author: item.creator || item.author,
          imageUrl
        } as RawItem;
      });
    } catch (error) {
      console.error(`[RssConnector] Critical failure for ${entity.name}:`, error);
      return [];
    }
  }

  async hydrate(item: RawItem): Promise<string> {
    try {
      if (!item.url) return item.rawContent;

      console.log(`[RssConnector] Hydrating: ${item.url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(item.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) return item.rawContent;
      const html = await response.text();

      // Lazy Image Extraction: If we don't have an image yet, try to find og:image
      if (!item.imageUrl) {
        const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (ogMatch) {
           (item as any).imageUrl = ogMatch[1];
           console.log(`[RssConnector] Found og:image for ${item.title}: ${ogMatch[1]}`);
        }
      }

      // Lazy Author Extraction
      if (!item.author || item.author === 'Unknown' || item.author === 'Unknown Author') {
         const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i) || 
                             html.match(/<meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i);
         if (authorMatch) {
             item.author = authorMatch[1];
             console.log(`[RssConnector] Found author for ${item.title}: ${item.author}`);
         }
      }

      return html;
      
    } catch (e) {
      console.warn(`[RssConnector] Hydration skipped for ${item.url}`, e);
      return item.rawContent;
    }
  }

  normalize(raw: RawItem, entity: SourceEntity): ContentItem {
    return {
      id: raw.id,
      sourceType: 'rss',
      sourceName: entity.name,
      url: raw.url,
      title: raw.title,
      author: raw.author || entity.name,
      publishedAt: raw.publishedAt,
      fetchedAt: new Date().toISOString(),
      summary: '', 
      fullText: raw.rawContent,
      imageUrl: (raw as any).imageUrl,
      topics: [],
      entities: []
    };
  }
}
