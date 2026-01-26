
import { SourceEntity } from '@/types';
import { PipelineContext, PipelineControlParams, PipelineStage, DiscoveredItem } from '../types';
import { getConnector } from '../../connectors';

export class DiscoveryStage implements PipelineStage<SourceEntity[], DiscoveredItem[]> {
  name = 'Stage 1: Discovery';
  description = 'Fetches raw pointers from RSS/API sources.';
  summary = 'Initial discovery of content from various sources.';

  async run(
    sources: SourceEntity[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<DiscoveredItem[]> {
    const discovered: DiscoveredItem[] = [];
    const windowMs = controls.discovery.searchWindowHours * 60 * 60 * 1000;
    
    // Concurrency limit could be added here if needed, but for now Promise.all is fast enough for HTTP headers
    await Promise.all(sources.filter(s => s.isActive).map(async (source) => {
       if (context.signal.aborted) return;

       try {
         const connector = getConnector(source.type);
         const rawItems = await connector.discover(source);
         
         // Basic map to DiscoveredItem
         const findings: DiscoveredItem[] = rawItems.map(raw => ({
           ...raw,
           priorityScore: source.signalScore || 50,
           discoveryNotes: `Found via ${source.name}`,
           _originalEntity: source
         }));

         // Emit progress
         context.events.emit('progress', `[Discovery] ${source.name}: found ${findings.length} items.`);
         
         discovered.push(...findings);
       } catch (error) {
         console.error(`[Discovery] Failed for ${source.name}:`, error);
       }
    }));

    return discovered;
  }
}
