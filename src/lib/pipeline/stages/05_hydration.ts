import { SourceEntity } from '@/types';
import { PipelineContext, PipelineControlParams, PipelineStage, DiscoveredItem, HydratedItem } from '../types';
import { getConnector } from '../../connectors';
import pLimit from 'p-limit';

export class HydrationStage implements PipelineStage<DiscoveredItem[], HydratedItem[]> {
  name = 'Stage 5: High-Fidelity Hydration';
  description = 'Scrapes full content for the highest priority items.';
  summary = 'Deep scraping of full text for prioritized leads.';

  async run(
    input: DiscoveredItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<HydratedItem[]> {
    const limit = pLimit(10); // Concurrent browser jobs (Optimize for memory vs speed)
    
    context.events.emit('progress', `[Hydration] Processing ${input.length} items with concurrency=10...`);

    const promises = input.map((item) => limit(async () => {
      if (context.signal.aborted) return null;

      try {
        const connectorType = (item as any).sourceType || 'rss';
        const connector = getConnector(connectorType);

        // Optimization: "Thin Content Check"
        // If the aggregator already gave us a substantial article (>2000 chars) with an image,
        // we can skip the expensive scrape.
        const hasSubstantialText = item.rawContent && item.rawContent.length > 2000;
        const hasImage = !!(item as any).imageUrl;
        
        // HACK: For testing purposes, we might want to force hydration on small batch.
        // But for prod, this saves 90% of time.
        let fullContent = item.rawContent || "";

        if (hasSubstantialText && hasImage) {
             // console.log(`[Hydration] Skipping scrape for "${item.title}" (Rich content present)`);
        } else {
             // Fetch full content
             fullContent = await connector.hydrate(item);
        }
        
        // Reconstruction of minimal entity for normalization
        const mockEntity: SourceEntity = {
          id: 'unknown', name: (item as any).sourceName || 'Unknown', 
          type: connectorType, url: '', isActive: true, healthStatus: 'active'
        };
        
        const normalized = connector.normalize({ ...item, rawContent: fullContent }, mockEntity);
        
        const result: HydratedItem = {
          ...normalized,
          embedding: [],
          scrutiny: { integrityScore: 100, flags: [] }
        };
        
        return result;
      } catch (e) {
        console.error(`[Hydration] Failed ${item.url}`, e);
        return null;
      }
    }));

    const results = await Promise.all(promises);
    return results.filter((x): x is HydratedItem => x !== null);
  }
}
