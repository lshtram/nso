
import { PipelineContext, PipelineControlParams, PipelineStage, HydratedItem } from '../types';
import { getBrainProvider } from '../../brain/factory';

export class SemanticDeduplicationStage implements PipelineStage<HydratedItem[], HydratedItem[]> {
  name = 'Stage 7: Near-Duplicate Resolution';
  description = 'Clusters semantically identical items and keeps the best canonical version.';

  summary = 'Deduplication of items with high semantic similarity.';
  
  constructor(private brain = getBrainProvider()) {}

  async run(
    input: HydratedItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<HydratedItem[]> {
    if (input.length === 0) return [];
    
    // Group by high cosine similarity (>0.95)
    const clusters: HydratedItem[][] = [];
    const assigned = new Set<string>();

    for (const item of input) {
        if (assigned.has(item.id)) continue;
        
        const cluster = [item];
        assigned.add(item.id);

        for (const other of input) {
            if (assigned.has(other.id)) continue;
            const sim = this.cosineSimilarity(item.embedding, other.embedding);
            if (sim > 0.95) {
                cluster.push(other);
                assigned.add(other.id);
            }
        }
        clusters.push(cluster);
    }

    const canonicals: HydratedItem[] = [];

    // Resolve clusters
    for (const cluster of clusters) {
        if (cluster.length === 1) {
            canonicals.push(cluster[0]);
        } else {
            // Conflict! Ask Brain to scrutinize or simple heuristic?
            // "Multi-Perspective Audit" says scrutinize.
            const result = await this.brain.scrutinize(cluster);
            
            // Pick the one with the best image or longest content
            const best = cluster.find(i => i.imageUrl) || cluster[0];
            
            if (best.scrutiny) best.scrutiny.conflictPoints = result.conflictPoints;
            canonicals.push(best);
        }
    }

    context.events.emit('progress', `[Near-Dedupe] ${input.length} -> ${canonicals.length} unique stories.`);
    return canonicals;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
      if (!a || !b || a.length !== b.length) return 0;
      let dot = 0;
      let magA = 0; let magB = 0;
      for(let i=0; i< a.length; i++) {
          dot += a[i] * b[i];
          magA += a[i] * a[i];
          magB += b[i] * b[i];
      }
      return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}
