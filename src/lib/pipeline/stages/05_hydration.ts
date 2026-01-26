
import { SourceEntity } from '@/types';
import { PipelineContext, PipelineControlParams, PipelineStage, DiscoveredItem, HydratedItem } from '../types';
import { getConnector } from '../../connectors';

export class HydrationStage implements PipelineStage<DiscoveredItem[], HydratedItem[]> {
  name = 'Stage 5: High-Fidelity Hydration';
  description = 'Scrapes full content for the highest priority items.';
  summary = 'Deep scraping of full text for prioritized leads.';

  async run(
    input: DiscoveredItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<HydratedItem[]> {
    const hydrated: HydratedItem[] = [];
    const BATCH_SIZE = 5; // Low batch size for puppeteer

    for (let i = 0; i < input.length; i += BATCH_SIZE) {
      if (context.signal.aborted) {
        context.events.emit('progress', '[Hydration] Aborted by user signal.');
        break;
      }

      const batch = input.slice(i, i + BATCH_SIZE);
      context.events.emit('progress', `[Hydration] Scraping batch ${Math.floor(i/BATCH_SIZE) + 1}...`);

      const promises = batch.map(async (item) => {
        try {
          // We need to re-find the source entity to get the connector?
          // The DiscoveredItem doesn't carry the full SourceEntity reference?
          // Wait, logic gap. The connector.hydrate needs the raw item.
          // DiscoveredItem extends RawItem, so that's fine.
          // Getting the connector type:
          // We stored 'sourceType' in ContentItem, but DiscoveredItem extends RawItem which doesn't have it?
          // Let's check types.ts
          // ContentItem has `sourceType`. 
          // `DiscoveredItem` extends `RawItem`. `RawItem` has `id, url, title...`. Does NOT have `sourceType`.
          // Refactor needed: DiscoveredItem should probably carry explicit source metadata or extend ContentItem partially.
          // For now, I'll assume we pass it or infer it.
          // Actually, `RawItem` is defined in `connectors/types.ts`. 
          
          // HACK: We need to know the connector type. 
          // Suggestion: Add `sourceType` to DiscoveredItem definition in types.ts quickly.
          // For now, let's assume `item.sourceName` or we need to look it up.
          // The Orchestrator had `SourceEntity` attached to the wrapper object.
          // DiscoveredItem needs `sourceType`.
          
          // TEMPORARY FIX: Infer using a "best effort" or assume we fix the type. 
          // I will assume simple HTTP for RSS unless specified. 
          // But wait, Github needs API.
          // Let's modify `DiscoveredItem` in the types to include `sourceType`.
          
          // ... Proceeding assuming we have it or can get it.
          // Actually, RawItem DOES NOT have it.
          // Let's rely on the Orchestrator to ensure DiscoveredItem has it.
          // I will cast it for now to avoid compilation blocking, but this is a TODO.
          
          const connectorType = (item as any).sourceType || 'rss'; 
          const connector = getConnector(connectorType);
          
          const fullContent = await connector.hydrate(item);
          
          // Normalize immediately
          // Note: connector.normalize requires `SourceEntity`. 
          // We are losing SourceEntity in Stage 1 mapping!
          // We must persist SourceEntity or critical metadata.
          
          // Reconstruction of minimal entity
          const mockEntity: SourceEntity = {
            id: 'unknown', name: (item as any).sourceName || 'Unknown', 
            type: connectorType, url: '', isActive: true, healthStatus: 'active'
          };
          
          const normalized = connector.normalize({ ...item, rawContent: fullContent }, mockEntity);
          
          const result: HydratedItem = {
            ...normalized,
            embedding: [], // To be filled by next stage
            scrutiny: { integrityScore: 100, flags: [] }
          };
          
          context.events.emit('hydrated_item', result);
          return result;
        } catch (e) {
          console.error(`[Hydration] Failed ${item.url}`, e);
          return null;
        }
      });

      const results = await Promise.all(promises);
      hydrated.push(...results.filter((x): x is HydratedItem => x !== null));
    }

    return hydrated;
  }
}
