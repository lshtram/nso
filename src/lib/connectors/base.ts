import { ContentItem, SourceEntity } from '@/types';
import { Connector, RawItem } from './types';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export abstract class BaseConnector implements Connector {
  abstract discover(entity: SourceEntity): Promise<RawItem[]>;

  /**
   * Default Hydration: Fetches full content if the RSS snippet is too thin or structure is missing.
   * Now uses Mozilla Readability for high-integrity extraction of headings, images, and code.
   */
  async hydrate(raw: RawItem): Promise<string> {
    // If we have less than 500 chars or it looks like a snippet, fetch the real page.
    const isSnippet = !raw.rawContent || raw.rawContent.length < 800 || !raw.rawContent.includes('<p>');
    
    if (isSnippet) {
      console.log(`[Hydrate] Content thin/snippet for "${raw.title}". Triggering high-fidelity scrape...`);
      try {
        const result = await this.scrapeWithReadability(raw.url);
        if (result && result.content.length > (raw.rawContent?.length || 0)) {
          // Store the lead image if discovered during scrape
          if (result.textContent && (raw as any)._discoveredImage === undefined) {
             (raw as any)._discoveredImage = result.excerptImage;
          }
          return result.content;
        }
      } catch (error) {
        console.warn(`[Hydrate] Failed to scrape ${raw.url}:`, error);
      }
    }
    return raw.rawContent;
  }

  /**
   * Advanced scraper using JSDOM and Readability.
   * Replicates "Reader Mode" for clean, structured content.
   */
  private async scrapeWithReadability(url: string, depth = 0): Promise<{
    content: string;
    textContent: string;
    excerptImage: string | undefined;
  } | null> {
    if (depth > 2) {
      console.warn(`[Readability] Max redirect depth reached for ${url}`);
      return null;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const html = await res.text();
      
      let dom = new JSDOM(html || "", { url });
      
      // Check for meta refresh (common in Google redirects)
      const metaRefresh = dom.window.document.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        const content = metaRefresh.getAttribute('content');
        const match = content?.match(/url=(.*)/i);
        if (match && match[1]) {
          const redirectUrl = new URL(match[1], url).href;
          console.log(`[Readability] Following meta redirect to: ${redirectUrl}`);
          return this.scrapeWithReadability(redirectUrl, depth + 1);
        }
      }

      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.content) return null;

      // Sanitization: Remove common technical clutter/placeholders
      const sanitizedContent = article.content
        .replace(/Listen to article/gi, '')
        .replace(/\[\[duration\]\]\s*minutes/gi, '')
        .replace(/Your browser does not support the audio element\./gi, '');

      // Post-process HTML to ensure all links/images/media are absolute
      const contentDom = new JSDOM(sanitizedContent, { url });
      const doc = contentDom.window.document;
      
      // Fix Media Tags (Images, Audio, Video)
      const mediaSelectors = ['img', 'audio', 'video', 'source'];
      mediaSelectors.forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => {
          const src = el.getAttribute('src');
          if (src) {
             try {
               el.setAttribute('src', new URL(src, url).href);
               if (tag === 'img') {
                 (el as HTMLElement).style.maxWidth = '100%';
                 (el as HTMLElement).style.height = 'auto';
                 (el as HTMLElement).style.borderRadius = '1rem';
                 (el as HTMLElement).style.margin = '2rem 0';
               }
               if (tag === 'audio' || tag === 'video') {
                 el.setAttribute('controls', 'true');
                 (el as HTMLElement).style.width = '100%';
                 (el as HTMLElement).style.margin = '1rem 0';
               }
             } catch (e) {}
          }
        });
      });

      // Fix Links
      doc.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (href) {
          try {
            a.setAttribute('href', new URL(href, url).href);
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          } catch (e) {}
        }
      });

      return {
        content: doc.body.innerHTML,
        textContent: article.textContent || "",
        excerptImage: this.discoverLeadImage(dom.window.document, url)
      };
    } catch (err) {
      console.error(`[Readability] Error processing ${url}:`, err);
      return null;
    }
  }

  /**
   * Discovers the best lead image using Open Graph or standard meta tags.
   */
  private discoverLeadImage(doc: Document, baseUrl: string): string | undefined {
    const selectors = [
      'meta[property="og:image"]',
      'meta[property="twitter:image"]',
      'meta[name="twitter:image"]',
      'meta[name="image"]',
      'link[rel="image_src"]'
    ];

    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      const content = el?.getAttribute('content') || el?.getAttribute('href');
      if (content) {
        try {
          return new URL(content, baseUrl).href;
        } catch (e) {}
      }
    }

    // Fallback: first meaningful image in article content
    const imgSelectors = ['article img', 'main img', '.content img', '#content img'];
    for (const selector of imgSelectors) {
      const img = doc.querySelector(selector) as HTMLImageElement;
      const src = img?.getAttribute('src');
      if (src && !src.includes('base64') && (parseInt(img.getAttribute('width') || '0') > 300 || !img.getAttribute('width'))) {
         try {
           return new URL(src, baseUrl).href;
         } catch(e) {}
      }
    }

    return undefined;
  }

  abstract normalize(raw: RawItem, entity: SourceEntity): ContentItem;

  async process(entity: SourceEntity): Promise<ContentItem[]> {
    console.log(`[Connector] Processing: ${entity.name}`);
    
    let raws = await this.discover(entity);
    
    if (raws.length > 20) {
      raws = raws.slice(0, 20);
    }

    const items: ContentItem[] = [];
    for (const raw of raws) {
      const fullContent = await this.hydrate(raw);
      
      // Sync discovered image back to normalization if present
      if ((raw as any)._discoveredImage && !(raw as any).imageUrl) {
        (raw as any).imageUrl = (raw as any)._discoveredImage;
      }
      
      const normalized = this.normalize({ ...raw, rawContent: fullContent }, entity);
      items.push(normalized);
    }

    return items;
  }
}
