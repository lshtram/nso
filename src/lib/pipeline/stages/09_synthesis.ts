
import { StoryCluster } from '@/types';
import { PipelineContext, PipelineControlParams, PipelineStage } from '../types';
import { getBrainProvider } from '../../brain/factory';

export class SynthesisStage implements PipelineStage<StoryCluster[], StoryCluster[]> {
  name = 'Stage 9: Narrative Synthesis';
  description = 'Generates narratives and "Why It Matters" for each cluster.';

  summary = 'Narrative generation for clusters.';

  constructor(private brain = getBrainProvider()) {}

  async run(
    input: StoryCluster[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<StoryCluster[]> {
    
    // Concurrency control for LLM calls
    const BATCH_SIZE = 3;
    const synthesized: StoryCluster[] = [];
    
    for (let i = 0; i < input.length; i += BATCH_SIZE) {
      if (context.signal.aborted) break;
      const batch = input.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.all(batch.map(async (cluster) => {
        try {
          const result = await this.brain.synthesize(cluster, controls.synthesis.persona, controls.synthesis.detailLevel || 'brief');
          return { ...cluster, ...result };
        } catch (e) {
          console.error(`[Synthesis] Failed for ${cluster.id}`, e);
          return cluster; // Return raw if failed
        }
      }));
      
      synthesized.push(...results);
      context.events.emit('progress', `[Synthesis] Generated NARRATIVES for batch ${Math.floor(i/BATCH_SIZE) + 1}`);
    }

    return synthesized;
  }
}
