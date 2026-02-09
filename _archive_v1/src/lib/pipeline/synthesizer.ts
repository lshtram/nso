import { StoryCluster } from '@/types';
import { BrainProvider } from '../brain/types';

export class Synthesizer {
  constructor(private brain: BrainProvider) {}

  /**
   * Stage 8: Synthesis.
   * Generates readable headlines and narratives for each cluster.
   */
  async synthesize(clusters: StoryCluster[], persona?: string): Promise<StoryCluster[]> {
    console.log(`[Synthesizer] Synthesizing ${clusters.length} narratives...`);

    // Limit synthesis to top 15 clusters to save time/cost. The rest keep raw titles.
    const clustersToSynthesize = clusters.slice(0, 15);
    const batchSize = 5;

    for (let i = 0; i < clustersToSynthesize.length; i += batchSize) {
      const batch = clustersToSynthesize.slice(i, i + batchSize);
      await Promise.all(batch.map(async (cluster) => {
        try {
          const synthesis = await this.brain.synthesize(cluster, persona);
          Object.assign(cluster, synthesis);
        } catch (e) {
          console.error(`[Synthesizer] Failed for cluster ${cluster.id}:`, e);
        }
      }));
    }

    return clusters;
  }
}
