import type { NewsItem } from './types';

export class FeedNormalizer {
  normalizeItem(item: any, type: 'rss' | 'atom' | 'rdf' = 'rss'): NewsItem {
    let title = item.title;
    if (typeof title === 'object') {
      // Atom title might have type="text"
      title = title['#text'] || title.text || '';
    }
    
    let link = '';
    if (type === 'rss' || type === 'rdf') {
      link = item.link || '';
    } else if (type === 'atom') {
      // Atom link handling
      const links = Array.isArray(item.link) ? item.link : [item.link];
      const alternate = links.find((l: any) => !l['@_rel'] || l['@_rel'] === 'alternate');
      if (alternate) {
        link = alternate['@_href'] || '';
      } else if (links.length > 0) {
        link = links[0]['@_href'] || '';
      }
    }

    // Date handling
    let pubDateStr = '';
    if (type === 'rss' || type === 'rdf') {
      pubDateStr = item.pubDate || item['dc:date'] || '';
    } else if (type === 'atom') {
      pubDateStr = item.published || item.updated || '';
    }
    
    let pubDate = new Date(pubDateStr);
    if (isNaN(pubDate.getTime())) {
      pubDate = new Date(); // Fallback to now if invalid or missing
    }

    // Content handling
    let content = '';
    let summary = '';
    
    if (type === 'rss' || type === 'rdf') {
      content = item['content:encoded'] || item.description || '';
      summary = item.description || '';
    } else if (type === 'atom') {
      content = item.content ? (typeof item.content === 'object' ? (item.content['#text'] || '') : item.content) : '';
      summary = item.summary ? (typeof item.summary === 'object' ? (item.summary['#text'] || '') : item.summary) : '';
      if (!content && summary) content = summary;
    }

    // ID handling
    let id = '';
    if (type === 'rss' || type === 'rdf') {
      id = (typeof item.guid === 'object' ? item.guid['#text'] : item.guid) || link;
    } else if (type === 'atom') {
      id = item.id || link;
    }

    // Categories
    let categories: string[] = [];
    if (item.category) {
      if (Array.isArray(item.category)) {
        categories = item.category.map((c: any) => (typeof c === 'object' ? (c['@_term'] || c['#text']) : c));
      } else {
        const c = item.category;
        categories = [typeof c === 'object' ? (c['@_term'] || c['#text']) : c];
      }
    }

    // Author
    let author = '';
    if (item.author) {
       if (typeof item.author === 'object') {
         author = item.author.name || item.author['#text'] || '';
       } else {
         author = item.author;
       }
    } else if (item['dc:creator']) {
       author = item['dc:creator'];
    }

    return {
      id,
      title: title || '',
      link,
      pubDate,
      isoDate: pubDate.toISOString(),
      content: content || summary, // Use summary if content is missing, logic up to you
      summary,
      author,
      categories,
      // source?
    };
  }

  normalize(parsed: any): { items: NewsItem[], ttl?: number } {
    const items: NewsItem[] = [];
    let ttl: number | undefined;
    
    if (parsed.rss && parsed.rss.channel) {
      // RSS 2.0
      const channel = parsed.rss.channel;
      
      // Extract TTL
      if (channel.ttl) {
        const val = parseInt(channel.ttl, 10);
        if (!isNaN(val)) ttl = val;
      }
      
      // RSS 1.0 Extension in RSS 2.0
      if (!ttl && channel['sy:updatePeriod']) {
        ttl = this.calculateTTLFromSy(channel['sy:updatePeriod'], channel['sy:updateFrequency']);
      }

      // Handle items which might be single object or array
      const rawItems = Array.isArray(channel.item) ? channel.item : (channel.item ? [channel.item] : []);
      rawItems.forEach((item: any) => {
        items.push(this.normalizeItem(item, 'rss'));
      });
    } else if (parsed.feed && parsed.feed.entry) {
      // Atom 1.0
      const rawEntries = Array.isArray(parsed.feed.entry) ? parsed.feed.entry : [parsed.feed.entry];
      rawEntries.forEach((entry: any) => {
        items.push(this.normalizeItem(entry, 'atom'));
      });
      
      // Atom might have sy extensions at root
      if (parsed.feed['sy:updatePeriod']) {
        ttl = this.calculateTTLFromSy(parsed.feed['sy:updatePeriod'], parsed.feed['sy:updateFrequency']);
      }
    } else if (parsed['rdf:RDF']) {
      // RDF (RSS 1.0)
      const rdf = parsed['rdf:RDF'];
      
      // RSS 1.0 sy extensions are common
      const channel = rdf.channel;
      if (channel && channel['sy:updatePeriod']) {
        ttl = this.calculateTTLFromSy(channel['sy:updatePeriod'], channel['sy:updateFrequency']);
      }

      const rawItems = Array.isArray(rdf.item) ? rdf.item : (rdf.item ? [rdf.item] : []);
      rawItems.forEach((item: any) => {
        items.push(this.normalizeItem(item, 'rdf'));
      });
    }

    return { items, ttl };
  }

  private calculateTTLFromSy(period: string, frequency?: string): number | undefined {
    const freq = parseInt(frequency || '1', 10) || 1;
    switch (period) {
      case 'hourly': return 60 / freq;
      case 'daily': return (24 * 60) / freq;
      case 'weekly': return (7 * 24 * 60) / freq;
      case 'monthly': return (30 * 24 * 60) / freq;
      case 'yearly': return (365 * 24 * 60) / freq;
      default: return undefined;
    }
  }
}
