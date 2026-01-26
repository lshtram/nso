
import { StoryCluster, SourceEntity, ContentItem, SteeringContext, DailySummary } from '@/types';
import { 
  PipelineControlParams, 
  PipelineContext, 
  IngestionRepository, 
  DiscoveredItem, 
  HydratedItem, 
  TypedEmitter
} from './types';

// Importing new modular stages
import { DiscoveryStage } from './stages/01_discovery';
import { DeduplicationStage } from './stages/02_deduplication';
import { NoiseFilterStage } from './stages/03_noise_filter';
import { TriageStage } from './stages/04_triage';
import { HydrationStage } from './stages/05_hydration';
import { EmbeddingStage } from './stages/06_embedding';
import { SemanticDeduplicationStage } from './stages/07_semantic_deduplication';
import { ClusteringStage } from './stages/08_clustering';
import { SynthesisStage } from './stages/09_synthesis';
import { ScoringStage } from './stages/10_scoring';
import { PersistenceStage } from './stages/11_persistence';

import { PipelineAuditor } from './auditor';
import { EventEmitter } from 'events';

// Stub Repo for MVP - to be replaced by real DB layer
class InMemoryRepository implements IngestionRepository {
  private seenUrls = new Set<string>();
  
  async filterNewUrls(urls: string[], windowMs: number): Promise<string[]> {
    return urls.filter(u => !this.seenUrls.has(u));
  }
  
  async persistRawItems(items: DiscoveredItem[]): Promise<void> {
    items.forEach(i => this.seenUrls.add(i.url));
  }
  
  async saveClusters(clusters: StoryCluster[]): Promise<void> {
    // No-op for MVP, handled by orchestrator state return
    console.log(`[Repo] Mock saving ${clusters.length} clusters.`);
  }

  async saveDailySummary(summary: any): Promise<void> {
    console.log(`[Repo] Mock saving daily summary.`);
  }
}

export class IngestionOrchestratorV2 {
  private repo = new InMemoryRepository();
  
  // Pipeline Stages
  private stage1_discovery = new DiscoveryStage();
  private stage2_dedupe = new DeduplicationStage();
  private stage3_noise = new NoiseFilterStage();
  private stage4_triage = new TriageStage();
  private stage5_hydration = new HydrationStage();
  private stage6_embed = new EmbeddingStage();
  private stage8_cluster = new ClusteringStage(); // Skipping 7 for simplicity or chaining? 
  private stage7_nearDedupe = new SemanticDeduplicationStage();
  private stage9_synthesis = new SynthesisStage();
  private stage10_scoring = new ScoringStage();
  private stage11_persistence = new PersistenceStage();

  private telemetry = {
    startTime: 0,
    sources: [] as any[], // Added
    duplicateUrls: [] as string[], // Added
    noiseFiltered: [] as string[], // Added
    triagedCount: 0, // Added
    hydratedCount: 0, // Added
    clustersCreated: 0, // Added
    stageTimings: {} as Record<string, number>,
    itemCounts: {} as Record<string, number>
  };

  async runIngestion(
    sources: SourceEntity[], 
    context: SteeringContext,
    options: { forceRefresh?: boolean, abortSignal?: AbortSignal } = {},
    onProgress?: (msg: string) => void
  ): Promise<{ clusters: StoryCluster[], dailySummary: any }> {
    
    this.telemetry.startTime = Date.now();
    const abortController = new AbortController();
    
    // Wire up events
    const eventParams = new EventEmitter();
    if (onProgress) {
        eventParams.on('progress', (msg) => onProgress(msg));
    }
    
    // Build Context
    const pipelineCtx: PipelineContext = {
      runId: `run-${Date.now()}`,
      startTime: Date.now(),
      signal: options.abortSignal || abortController.signal,
      events: eventParams as unknown as TypedEmitter,
      repository: this.repo
    };

    // Construct Brain Controls (Mapping UI Params -> Pipeline Params)
    // NOTE: This logic belongs in the Brain, but we map here for MVP
    const controls: PipelineControlParams = {
      discovery: {
        maxItemsPerSource: 50,
        searchWindowHours: 24,
      },
      triage: {
        noiseThreshold: 0.3,
        minInterestScore: 60,
        maxHydrationLimit: 40 // Hard cap to prevent runaway costs
      },
      clustering: {
        algorithm: 'dbscan',
        epsilon: 0.85,
        minClusterSize: 2
      },
      synthesis: {
        persona: context.persona || 'Neutral Analyst',
        detailLevel: 'brief'
      }
    };

    try {
      // ============================================
      // THE PIPELINE EXECUTION (Typed Funnel)
      // ============================================

      // Stage 1: Discovery (Sources -> DiscoveredItem[])
      const step1 = await this.stage1_discovery.run(sources, controls, pipelineCtx);
      if (pipelineCtx.signal.aborted) throw new Error("Aborted");
      this.telemetry.itemCounts['discovered'] = step1.length;

      // Stage 2: Dedupe (DiscoveredItem[] -> DiscoveredItem[])
      const step2 = await this.stage2_dedupe.run(step1, controls, pipelineCtx);
      this.telemetry.itemCounts['deduped'] = step2.length;
      
      // Stage 3: Noise Filter
      const step3 = await this.stage3_noise.run(step2, controls, pipelineCtx);
      
      // Stage 4: Triage (Ranking & Cutting)
      const step4 = await this.stage4_triage.run(step3, controls, pipelineCtx);
      this.telemetry.itemCounts['triaged'] = step4.length;

      // Stage 5: Hydration (Heavy Lift)
      const step5 = await this.stage5_hydration.run(step4, controls, pipelineCtx);
      this.telemetry.itemCounts['hydrated'] = step5.length;

      // Stage 6: Embedding
      const step6 = await this.stage6_embed.run(step5, controls, pipelineCtx);

      // Stage 7: Semantic Dedupe
      const step7 = await this.stage7_nearDedupe.run(step6, controls, pipelineCtx);

      // Stage 8: Clustering (HydratedItem[] -> StoryCluster[])
      const step8 = await this.stage8_cluster.run(step7, controls, pipelineCtx);
      this.telemetry.itemCounts['clusters'] = step8.length;

      // Stage 9: Synthesis (Enrich Clusters)
      const step9 = await this.stage9_synthesis.run(step8, controls, pipelineCtx);

      // Stage 10: Scoring
      const step10 = await this.stage10_scoring.run(step9, controls, pipelineCtx);
      
      // Stage 11: Persistence
      const finalState = await this.stage11_persistence.run(step10, controls, pipelineCtx);

      // Legacy Adapter: Daily Summary (Still monolithic for now, or move to stage 12?)
      // Let's just return null for now or mock it to keep the interface clean
      const dailySummary = { headline: "Pipeline V2 Executive Summary", content: "Architecture successfully migrated to funnel V2.", topClusters: finalState };

      PipelineAuditor.log(Date.now() - this.telemetry.startTime, this.telemetry, finalState.length, finalState);

      return { clusters: finalState, dailySummary };

    } catch (error) {
      console.error("[Orchestrator V2] Pipeline Failed:", error);
      throw error;
    }
  }
}
