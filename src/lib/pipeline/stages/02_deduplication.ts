
import { PipelineContext, PipelineControlParams, PipelineStage, DiscoveredItem } from '../types';

export class DeduplicationStage implements PipelineStage<DiscoveredItem[], DiscoveredItem[]> {
  name = 'Stage 2: URL Deduplication';
  description = 'Filters out URLs that have been seen in previous runs.'
  summary = 'URL-based deduplication against processed history.';

  async run(
    input: DiscoveredItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<DiscoveredItem[]> {
    if (input.length === 0) return [];
    
    // 1. In-memory batch dedupe (don't process same URL twice in this batch)
    const uniqueMap = new Map<string, DiscoveredItem>();
    input.forEach(item => uniqueMap.set(item.url, item));
    const uniqueBatch = Array.from(uniqueMap.values());

    // 2. Database History Check (SCALABLE: Only check existing)
    const urlsToCheck = uniqueBatch.map(i => i.url);
    const windowMs = controls.ingestion.lookbackHours * 60 * 60 * 1000;
    
    const newWindowUrls = await context.repository.filterNewUrls(urlsToCheck, windowMs);
    const newUrlSet = new Set(newWindowUrls);
    
    const finalItems = uniqueBatch.filter(item => newUrlSet.has(item.url));
    
    context.events.emit('progress', `[Dedupe] Filtered ${input.length} -> ${finalItems.length} new items.`);
    return finalItems;
  }
}
