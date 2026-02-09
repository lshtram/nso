
import { StoryCluster } from '@/types';
import { PipelineContext, PipelineControlParams, PipelineStage, HydratedItem } from '../types';

export class ClusteringStage implements PipelineStage<HydratedItem[], StoryCluster[]> {
  name = 'Stage 8: Semantic Clustering';
  description = 'Groups unique stories into narrative clusters.';
  summary = 'Group-level grouping based on vector similarity.';

  async run(
    input: HydratedItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<StoryCluster[]> {
    if (input.length === 0) return [];
    
    // Using O(N^2) greedy clustering for MVP 
    // In production, use HNSW or vector DB
    
    const clusters: StoryCluster[] = [];
    const assignedIds = new Set<string>();
    
    // Brain Params
    const threshold = controls.clustering.epsilon || 0.85;

    for (const item of input) {
      if (assignedIds.has(item.id)) continue;
      
      const members = [item];
      assignedIds.add(item.id);
      
      for (const candidate of input) {
        if (assignedIds.has(candidate.id)) continue;
        
        const sim = this.cosineSimilarity(item.embedding, candidate.embedding);
        if (sim >= threshold) {
          members.push(candidate);
          assignedIds.add(candidate.id);
        }
      }
      
      // Create Cluster Object
      // NOTE: Synthesis happens in next stage. Here we just group.
      clusters.push({
        id: `cluster-${Date.now()}-${clusters.length}`,
        title: item.title, // Temp title
        narrative: '',
        whyItMatters: '',
        items: members,
        topItems: members.slice(0, 3),
        momentumScore: 0, 
        relevanceScore: 0,
        finalRank: 0,
        category: 'TECH', // Default, to be refined
        trendIndicator: 'new'
      });
    }

    context.events.emit('progress', `[Clustering] Formed ${clusters.length} clusters from ${input.length} items.`);
    return clusters;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a?.length || !b?.length) return 0;
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    // Assuming normalized vectors for speed (Brain should normalize)
    return dot; 
  }
}
