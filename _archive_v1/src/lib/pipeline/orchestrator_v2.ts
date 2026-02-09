
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
import fs from 'fs';
import path from 'path';

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

import { PipelineProfiler } from './profiler';

export class IngestionOrchestratorV2 {
  private repo = new InMemoryRepository();
  
  // Pipeline Stages
  private stage1_discovery = new DiscoveryStage();
  private stage2_dedupe = new DeduplicationStage();
  private stage3_noise = new NoiseFilterStage();
  private stage4_triage = new TriageStage();
  private stage5_hydration = new HydrationStage();
  private stage6_embed = new EmbeddingStage();
  private stage8_cluster = new ClusteringStage(); 
  private stage7_nearDedupe = new SemanticDeduplicationStage();
  private stage9_synthesis = new SynthesisStage();
  private stage10_scoring = new ScoringStage();
  private stage11_persistence = new PersistenceStage();

  async runIngestion(
    sources: SourceEntity[], 
    context: SteeringContext,
    options: { forceRefresh?: boolean, abortSignal?: AbortSignal, debugDir?: string } = {},
    onProgress?: (msg: string) => void
  ): Promise<{ clusters: StoryCluster[], dailySummary: any }> {

    // MVP: If forcing refresh, clear the seen cache so we re-process everything
    if (options.forceRefresh) {
      this.repo = new InMemoryRepository();
    }
    
    const profiler = PipelineProfiler.getInstance();
    profiler.startRun();
    
    // Wire up events
    const abortController = new AbortController();
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

    // Construct Brain Controls
    const controls: PipelineControlParams = {
      discovery: {
        maxItemsPerSource: 50,
        searchWindowHours: 24,
      },
      ingestion: {
        lookbackHours: 24,
        maxItems: 100
      },
      triage: {
        noiseThreshold: 0.3,
        minInterestScore: 60,
        maxHydrationLimit: 40
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
      // Helper for stage execution with profiling
      const runStage = async <TIn, TOut>(
        stageName: string,
        stage: { run: (input: TIn, controls: PipelineControlParams, context: PipelineContext) => Promise<TOut> },
        input: TIn
      ): Promise<TOut> => {
        const start = performance.now();
        const inputCount = Array.isArray(input) ? input.length : 1;
        
        const output = await stage.run(input, controls, pipelineCtx);
        
        const duration = performance.now() - start;
        
        // Centralized Profiling & Analytics
        const outputArray = Array.isArray(output) ? output : [output];
        profiler.recordStage(stageName, duration, inputCount, outputArray);

        if (onProgress) onProgress(`[${stageName}] Completed in ${duration.toFixed(2)}ms.`);
        return output;
      };

      // ============================================
      // THE PIPELINE EXECUTION (Typed Funnel)
      // ============================================

      const step1 = await runStage('Stage 1: Discovery', this.stage1_discovery, sources);
      if (pipelineCtx.signal.aborted) throw new Error("Aborted");

      const step2 = await runStage('Stage 2: URL Dedupe', this.stage2_dedupe, step1);
      const step3 = await runStage('Stage 3: Noise Filter', this.stage3_noise, step2);
      const step4 = await runStage('Stage 4: Intelligent Triage', this.stage4_triage, step3);
      const step5 = await runStage('Stage 5: High-Fidelity Hydration', this.stage5_hydration, step4);
      const step6 = await runStage('Stage 6: Semantic Embedding', this.stage6_embed, step5);
      const step7 = await runStage('Stage 7: Near-Dedupe', this.stage7_nearDedupe, step6);
      const step8 = await runStage('Stage 8: Semantic Clustering', this.stage8_cluster, step7);
      const step9 = await runStage('Stage 9: Narrative Synthesis', this.stage9_synthesis, step8);
      const step10 = await runStage('Stage 10: Scoring', this.stage10_scoring, step9);
      const finalState = await runStage('Stage 11: Persistence', this.stage11_persistence, step10);

      const dailySummary = { 
        headline: "Pipeline V2 Executive Summary", 
        content: "Architecture successfully migrated to funnel V2.", 
        topClusters: finalState 
      };

      // Legacy audit log (optional)
      // PipelineAuditor.log(...) 

      return { clusters: finalState, dailySummary };

    } catch (error) {
      console.error("[Orchestrator V2] Pipeline Failed:", error);
      throw error;
    }
  }
}
