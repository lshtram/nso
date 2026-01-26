
import { PipelineContext, PipelineControlParams, PipelineStage, DiscoveredItem } from '../types';
import { getBrainProvider } from '../../brain/factory';

export class TriageStage implements PipelineStage<DiscoveredItem[], DiscoveredItem[]> {
  name = 'Stage 4: Intelligent Triage';
  description = 'Uses LLM to rank items by interest before expensive scraping.';
  summary = 'Intelligent ranking of discovered items.';
  
  constructor(private brain = getBrainProvider()) {}

  async run(
    input: DiscoveredItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<DiscoveredItem[]> {
    if (input.length === 0) return [];
    
    // Batch processing to save API calls
    const BATCH_SIZE = 50; 
    const prioritizedItems: DiscoveredItem[] = [];

    for (let i = 0; i < input.length; i += BATCH_SIZE) {
      if (context.signal.aborted) break;
      
      const batch = input.slice(i, i + BATCH_SIZE);
      const ranks = await this.brain.rank(
        batch.map(b => ({ title: b.title, snippet: b.rawContent || "" })),
        {} // We need the interests map here! controls.triage.interests?
        // Note: The previous orchestrator passed `context.parameters.interests`. 
        // We might need to expand `PipelineControlParams` to include `interests`.
      );
      
      batch.forEach((item, idx) => {
        const interestScore = ranks[idx] || 50;
        const totalScore = (interestScore * 0.7) + (item.priorityScore * 0.3);
        item.priorityScore = totalScore;
        prioritizedItems.push(item);
      });
      
      context.events.emit('progress', `[Triage] Ranked batch ${Math.floor(i/BATCH_SIZE) + 1}`);
    }

    // Sort
    const sorted = prioritizedItems.sort((a,b) => b.priorityScore - a.priorityScore);
    
    // Filter by Score Threshold
    const aboveThreshold = sorted.filter(item => item.priorityScore >= controls.triage.minInterestScore);
    
    // Hard Cutoff (Budget Control)
    const topN = aboveThreshold.slice(0, controls.triage.maxHydrationLimit);
    
    context.events.emit('progress', `[Triage] ${aboveThreshold.length} items > ${controls.triage.minInterestScore} score. Keeping top ${topN.length}.`);
    return topN;
  }
}
