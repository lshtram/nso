import { ContentItem, StoryCluster } from '@/types';

export interface ScrutinyResult {
  integrityScore: number;
  isControverial: boolean;
  conflictPoints?: string[];
  canonicalSelectionId?: string;
}

export interface NormalizationResult {
  topics: string[];
  entities: string[];
  summary: string;
}

export interface BrainProvider {
  /**
   * Stage 3: Normalization. Extracts topics, entities, and generates a summary.
   */
  normalize(text: string): Promise<NormalizationResult>;

  /**
   * Stage 3: Entity Anchoring. Normalizes a list of entities to canonical forms.
   */
  anchorEntities(entities: string[]): Promise<string[]>;

  /**
   * Stage 4: Scrutiny. Cross-references multiple items to find contradictions and quality issues.
   */
  scrutinize(items: ContentItem[]): Promise<ScrutinyResult>;

  /**
   * Stage 5: Embedding. Generates a semantic vector for text.
   */
  embed(text: string): Promise<number[]>;

  /**
   * Stage 8: Synthesis. Generates headlines and narratives for a cluster.
   */
  synthesize(cluster: StoryCluster, persona?: string, detailLevel?: 'brief' | 'detailed'): Promise<Partial<StoryCluster>>;

  /**
   * Fast Triage. Ranks raw items based on user interests without full analysis.
   */
  rank(items: { title: string; snippet: string }[], interests: Record<string, number>): Promise<number[]>;

  /**
   * Global Synthesis. Generates an overarching narrative for all clusters.
   */
  synthesizeGlobal(clusters: StoryCluster[], persona?: string): Promise<{ headline: string; content: string }>;

  /**
   * Conversational interface for discovery and profile updates.
   */
  chat(message: string, context: { profile: string; library: string }): Promise<{ response: string; tools?: any[] }>;
}
