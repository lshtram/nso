
import { StoryCluster } from '@/types';
import { PipelineContext, PipelineControlParams, PipelineStage } from '../types';

export class ScoringStage implements PipelineStage<StoryCluster[], StoryCluster[]> {
  name = 'Stage 10: Scoring & Ranking';
  description = 'Calculates final rank based on relevance, momentum, and decay.';
  summary = 'Multi-factor ranking and prioritization.';

  async run(
    input: StoryCluster[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<StoryCluster[]> {
    
    // 1. Calculate Scores
    input.forEach(cluster => {
        // Momentum = Volume (capped)
        const volume = cluster.items.length;
        cluster.momentumScore = Math.min(100, volume * 10);
        
        // Relevance = (Brain already assigned logic, or default?)
        // For now, assume Synthesis stage might have categorized it.
        // If not, heuristic map from Interest Weights?
        // Note: Interest is hard to calculate here without strict taxonomy.
        // We'll use a placeholder until improved.
        cluster.relevanceScore = 80; 

        // Time Decay
        const freshest = Math.max(...cluster.items.map(i => new Date(i.publishedAt).getTime()));
        const ageHours = (Date.now() - freshest) / (3600 * 1000);
        const halfLife = 24; 
        const decay = Math.pow(0.5, ageHours / halfLife);

        cluster.finalRank = (cluster.momentumScore * 0.4 + cluster.relevanceScore * 0.6) * decay;
    });

    // 2. Sort
    const ranked = input.sort((a,b) => b.finalRank - a.finalRank);
    
    context.events.emit('progress', `[Scoring] Ranked ${ranked.length} clusters.`);
    return ranked;
  }
}
