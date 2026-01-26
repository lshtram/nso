
import { StoryCluster } from '@/types';
import { PipelineContext, PipelineControlParams, PipelineStage } from '../types';

export class PersistenceStage implements PipelineStage<StoryCluster[], StoryCluster[]> {
  name = 'Stage 11: Persistence';
  description = 'Saves the final state to the repository.';
  summary = 'Final storage of processed clusters and summaries.';

  async run(
    input: StoryCluster[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<StoryCluster[]> {
    
    // Save Clusters
    await context.repository.saveClusters(input);
    
    // Suggestion: Save Summary here too? 
    // The previous orchestrator did Global Synthesis.
    // That should be a separate "GlobalSynthesisStage" or part of this?
    // It's technically logic, not persistence. But let's save the clusters first.
    
    context.events.emit('progress', `[Persistence] Saved ${input.length} clusters to database.`);
    return input;
  }
}
