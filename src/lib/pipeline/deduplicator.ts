import { ContentItem } from '@/types';
import { BrainProvider } from '../brain/types';

export class Deduplicator {
  constructor(private brain: BrainProvider) {}

  /**
   * Stage 4: Dedupe & Scrutiny.
   * Groups near-duplicates and selects a canonical survivor.
   */
  async dedupeAndScrutinize(items: ContentItem[]): Promise<ContentItem[]> {
    console.log(`[Dedupe] Scrutinizing ${items.length} items...`);
    
    // 1. Exact URL/ID Dedupe
    const uniqueMap = new Map<string, ContentItem>();
    for (const item of items) {
      uniqueMap.set(item.url || item.id, item);
    }

    const uniqueItems = Array.from(uniqueMap.values());
    console.log(`[Dedupe] Exact uniqueness: ${uniqueItems.length}/${items.length}`);

    // 2. Semantic Scrutiny
    // Filter out items with very short or missing content
    const validItems = uniqueItems.filter(item => item.title && item.title.length > 5);

    // Group items that are semantically identical (mock implementation)
    // We use a more specific title prefix to avoid over-deduping
    const clusters = new Map<string, ContentItem[]>();
    for (const item of validItems) {
      // Use first 40 chars for the cluster key to be less aggressive
      const key = item.title.substring(0, 40).toLowerCase().trim();
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(item);
    }

    const finalizedItems: ContentItem[] = [];

    for (const [key, clusterItems] of clusters.entries()) {
      if (clusterItems.length > 1) {
        console.log(`[Dedupe] Scrutinizing near-dupe cluster: "${key}" (${clusterItems.length} items)`);
        const result = await this.brain.scrutinize(clusterItems);
        
        // Select canonical survivor (the one with an image if available, else first)
        const survivor = clusterItems.find(i => i.imageUrl) || clusterItems[0]; 
        
        // Attach conflict points to the survivor
        (survivor as any).conflictPoints = result.conflictPoints;
        finalizedItems.push(survivor);
      } else {
        finalizedItems.push(clusterItems[0]);
      }
    }

    return finalizedItems;
  }
}
