import { StoryCluster, SteeringContext } from '@/types';

export class Scorer {
  /**
   * Stage 7: Scoring & Ranking.
   * Calculates the final rank based on Relevance, Momentum, and Temporal Decay.
   */
  async score(clusters: StoryCluster[], context: SteeringContext): Promise<StoryCluster[]> {
    console.log(`[Score] Ranking ${clusters.length} clusters...`);

    const now = new Date().getTime();

    for (const cluster of clusters) {
      // 1. Relevance Score (Interest Equalizer)
      cluster.relevanceScore = this.calculateRelevance(cluster, context);

      // 2. Momentum Score (Signal Volume)
      cluster.momentumScore = this.calculateMomentum(cluster);

      // 3. Temporal Decay (The Forgetting Constant)
      // For MVP, we use the timestamp of the first item
      const publishedAt = new Date(cluster.items[0].publishedAt).getTime();
      const ageHours = (now - publishedAt) / (1000 * 60 * 60);
      
      const lambda = this.getForgettingConstant(cluster.category);
      const decayFactor = Math.exp(-lambda * ageHours);

      // Final Rank Calculation
      // Formula: ((Relevance * 0.7) + (Momentum * 0.3)) * Decay
      cluster.finalRank = ((cluster.relevanceScore * 0.7) + (cluster.momentumScore * 0.3)) * decayFactor;
    }

    // Sort by final rank descending
    return clusters.sort((a, b) => b.finalRank - a.finalRank);
  }

  private calculateRelevance(cluster: StoryCluster, context: SteeringContext): number {
    // Basic weight matching for MVP
    const interestWeights = context.parameters.interests || {};
    const weight = interestWeights[cluster.category] || 50; // Default 50
    return weight;
  }

  private calculateMomentum(cluster: StoryCluster): number {
    // Simple volume-based momentum
    return Math.min(100, cluster.items.length * 20);
  }

  private getForgettingConstant(category: string): number {
    // Half-life mapping (Simplified REQ-CORE-007)
    switch (category) {
      case 'GOSSIP': return 0.05;    // Fast decay (~14h half-life)
      case 'TECH': return 0.01;      // Med decay (~70h half-life)
      case 'PHILOSOPHY': return 0.001; // Slow decay (~700h half-life)
      default: return 0.01;
    }
  }
}
