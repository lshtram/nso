
import { PipelineContext, PipelineControlParams, PipelineStage, DiscoveredItem } from '../types';

export class NoiseFilterStage implements PipelineStage<DiscoveredItem[], DiscoveredItem[]> {
  name = 'Stage 3: Noise Filtering';
  description = 'Removes obviously low-quality items using heuristics (RegEx).'

  async run(
    input: DiscoveredItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<DiscoveredItem[]> {
    const filters = [
      'sponsored', 'advertisement', 'promoted', 'newsletter', 'digest',
      'daily briefing', 'weekly roundup'
    ];
    
    // Allow Brain to inject custom blocklist? 
    // Ideally this comes from controls.triage.blocklist if we add it.

    const clean = input.filter(item => {
      const titleLower = item.title.toLowerCase();
      const isNoise = filters.some(f => titleLower.includes(f));
      return !isNoise; 
    });

    context.events.emit('progress', `[Noise] Removed ${input.length - clean.length} noise items.`);
    return clean;
  }
}
