import { ContentItem, StoryCluster } from '@/types';

export class Clusterer {
  /**
   * Stage 6: Semantic Clustering.
   * Groups items into StoryClusters based on embedding similarity.
   */
  async cluster(items: ContentItem[]): Promise<StoryCluster[]> {
    console.log(`[Cluster] Grouping ${items.length} items into semantic stories...`);
    
    if (items.length === 0) return [];

    const clusters: StoryCluster[] = [];
    const processedIds = new Set<string>();

    for (const item of items) {
      if (processedIds.has(item.id)) continue;

      const clusterItems: ContentItem[] = [item];
      processedIds.add(item.id);

      for (const other of items) {
        if (processedIds.has(other.id)) continue;

        // REQ-CORE-006: High-Fidelity Clustering.
        // For the Alpha/MVP, we use a very high threshold (0.98) to avoid over-clustering.
        // We want to see distinct stories unless they are nearly identical.
        if (this.calculateSimilarity(item.embedding, other.embedding) > 0.98) {
          clusterItems.push(other);
          processedIds.add(other.id);
        }
      }

      clusters.push({
        id: `cluster-${item.id}`,
        title: item.title,
        narrative: '',     
        whyItMatters: '',  
        items: clusterItems,
        topItems: clusterItems.slice(0, 3),
        momentumScore: 0,
        relevanceScore: 0,
        finalRank: 0,
        category: (item.topics?.[0] as any) || 'TECH',
        trendIndicator: 'new'
      });
    }

    console.log(`[Cluster] Generated ${clusters.length} clusters.`);
    return clusters;
  }

  private calculateSimilarity(v1?: number[], v2?: number[]): number {
    if (!v1 || !v2 || v1.length !== v2.length) return 0;
    
    let dotProduct = 0;
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
    }
    return dotProduct; // Already normalized
  }
}
