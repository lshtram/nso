import { StoryCluster, SourceEntity, ContentItem, SteeringContext } from '@/types';
import { getBrainProvider } from '../brain/factory';
import { getConnector } from '../connectors';
import { Deduplicator } from './deduplicator';
import { Clusterer } from './clusterer';
import { Scorer } from './scorer';
import { Synthesizer } from './synthesizer';
import { RawItem } from '../connectors/types';
import * as fs from 'fs';
import * as path from 'path';
import { PipelineAuditor } from './auditor';
import { PipelineProfiler } from './profiler';
import { pLimit } from './utils';

export class IngestionOrchestrator {
  private brain = getBrainProvider();
  private deduplicator = new Deduplicator(this.brain);
  private clusterer = new Clusterer();
  private scorer = new Scorer();
  private synthesizer = new Synthesizer(this.brain);
  private profiler = new PipelineProfiler();

  private static cachedItems: ContentItem[] | null = null;
  private static lastIngestTime = 0;
  private static readonly INGEST_TTL = 1000 * 60 * 60; // 60 mins
  private static readonly MAX_HIGH_FIDELITY_ITEMS = 40;
  // Persistent URL cache to avoid re-processing same items across refreshes
  private static globalSeenUrls = new Set<string>();

  private telemetry = {
    startTime: 0,
    sources: [] as any[],
    allRawItems: [] as any[],
    duplicateUrls: [] as string[],
    noiseFiltered: [] as string[],
    triagedCount: 0,
    hydratedCount: 0,
    clustersCreated: 0,
    stageTimings: {} as Record<string, number>
  };

  async runIngestion(
    sources: SourceEntity[], 
    context: SteeringContext,
    forceRefresh = false,
    onProgress?: (message: string) => void
  ): Promise<{ clusters: StoryCluster[], dailySummary: any }> {
    const now = Date.now();
    let itemsToProcess: ContentItem[] = [];
    
    // ... (wrappedProgress and saveSnapshot remain same) ...

    const wrappedProgress = (stage: number, msg: string) => {
      const fullMsg = `STAGE:${stage}:${msg}`;
      console.log(`[Pipeline] ${fullMsg}`);
      if (onProgress) onProgress(fullMsg);
    };

    const saveSnapshot = (name: string, data: any) => {
      const snapPath = path.join(process.cwd(), `tmp/snapshot_${name}.json`);
      if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) fs.mkdirSync(path.join(process.cwd(), 'tmp'));
      fs.writeFileSync(snapPath, JSON.stringify(data, null, 2));
    };

    if (sources.length === 0) {
      wrappedProgress(0, "No active sources discovered.");
      return { clusters: [], dailySummary: null };
    };

    wrappedProgress(1, "Initializing intelligence grid...");

    try {
      // Smart Cache Check: If recent and NOT force refresh, serve cache.
      if (!forceRefresh && IngestionOrchestrator.cachedItems && (now - IngestionOrchestrator.lastIngestTime < IngestionOrchestrator.INGEST_TTL)) {
        console.log(`[Pipeline] Serving from memory cache (${IngestionOrchestrator.cachedItems.length} items)`);
        itemsToProcess = IngestionOrchestrator.cachedItems;
      } else {
        this.profiler.startPipeline();
        console.log(`--- [Pipeline] Starting Scalable User Ingestion ---`);
        
        wrappedProgress(1, "Discovery from high-signal intelligence nodes...");
        this.profiler.startStage('Stage 1: Discovery');

        // 1. Discover ALL sources (fast IO)
        // If forceRefresh is TRUE, we act like standard RSS reader: fetch feed, check for new items.
        // We use globalSeenUrls to filter out items we've already fully processed this session.
        const discoveryResults = await Promise.all(
          sources.filter(e => e.isActive).map(async (entity) => {
            try {
              const connector = getConnector(entity.type);
              const raws = await connector.discover(entity);
              // Only take top 50 per source to prevent flooding
              const sliced = raws.slice(0, 50);
              this.telemetry.sources.push({ name: entity.name, url: entity.url, count: sliced.length });
              sliced.forEach(r => this.telemetry.allRawItems.push({ title: r.title, source: entity.name, url: r.url }));
              return { entity, raws: sliced };
            } catch (error) {
              console.error(`[Discovery] Failed for ${entity.name}:`, error);
              return { entity, raws: [] };
            }
          })
        );
        this.profiler.endStage('Stage 1: Discovery', { count: discoveryResults.length });
        saveSnapshot("1_Discovery", discoveryResults);

        // STAGE 2: Smart Link Deduplication & Incremental Filter
        wrappedProgress(2, "Data Validation & Link Deduplication...");
        this.profiler.startStage('Stage 2: Link Deduplication');
        const bulkPool: { entity: SourceEntity; raw: RawItem; priority: number }[] = [];
        const seenInThisBatch = new Set<string>();

        let newItemsCount = 0;
        let knownItemsCount = 0;

        discoveryResults.forEach(({ entity, raws }) => {
          raws.forEach(raw => {
            // Check 1: Duplicate in this batch?
            if (seenInThisBatch.has(raw.url)) {
               this.telemetry.duplicateUrls.push(raw.url);
               return;
            }
            seenInThisBatch.add(raw.url);

            // Check 2: Already processed in previous runs this session?
            if (IngestionOrchestrator.globalSeenUrls.has(raw.url)) {
              knownItemsCount++;
              // Skip adding to bulkPool -> effectively "Cached/Ignored"
              return; 
            }

            // New Item!
            IngestionOrchestrator.globalSeenUrls.add(raw.url); // Mark as seen
            newItemsCount++;
            bulkPool.push({ entity, raw, priority: 0 });
          });
        });
        
        console.log(`[Smart Refresh] Found ${newItemsCount} NEW items. Skipped ${knownItemsCount} KNOWN items.`);
        
        // If NO new items and we have a cache, maybe return old cache? 
        // But user might want to re-cluster? 
        // For now, if bulkPool is empty, we might fall back to cachedItems if available to show *something*,
        // or just show "No new items". 
        // Let's assume we proceed with whatever we have. If bulkPool is empty, pipeline finishes fast.
        // Wait! If we filter everything out, the user sees NOTHING. 
        // We should merge with IngestionOrchestrator.cachedItems if valid?
        
        let poolforTriage = bulkPool;
        if (poolforTriage.length === 0 && IngestionOrchestrator.cachedItems) {
           console.log("[Smart Refresh] No new items found. Re-synthesizing existing view.");
           // If no new items, we can just return the cached view OR re-run synthesis on cached items.
           // Let's re-use cached items to be safe and fast.
           itemsToProcess = IngestionOrchestrator.cachedItems;
        } else {
             this.profiler.endStage('Stage 2: Link Deduplication');
        }

        // CONTROL FLOW: New Items vs. Zero New Items
        let newProcessedItems: ContentItem[] = [];

        if (bulkPool.length > 0) {
          // --- STAGE 3: Fast Intelligent Triage (Processing NEW items) ---
          this.profiler.startStage('Stage 3: Noise Filtering');
          const initialPool = bulkPool.filter(item => {
            const isNoisy = this.isNoisySignal(item.raw.title);
            if (isNoisy) this.telemetry.noiseFiltered.push(item.raw.title);
            return !isNoisy;
          });
          this.profiler.endStage('Stage 3: Noise Filtering');
          
          if (initialPool.length > 0) {
            this.profiler.startStage('Stage 4: Triage');
            wrappedProgress(3, "Triage - Filtering and neural scoring...");
            const rankItems = initialPool.map(item => ({ title: item.raw.title, snippet: item.raw.rawContent }));
            
            const rankBatchSize = 50;
            const batches = [];
            for (let i = 0; i < rankItems.length; i += rankBatchSize) {
              batches.push(rankItems.slice(i, i + rankBatchSize));
            }
            
            const allRanks: number[] = [];
            const batchResults = await Promise.all(batches.map(async (batch, idx) => {
               const ranks = await this.brain.rank(batch, context.parameters.interests || {});
               wrappedProgress(3, `Triage batch ${idx + 1}/${batches.length} complete...`);
               return ranks;
            }));
            batchResults.forEach(r => allRanks.push(...r));
  
            const scoredPool = initialPool.map((item, i) => {
              const interestScore = allRanks[i] || 50;
              const sourceScore = (item.entity.signalScore || 50) / 10;
              const finalScore = interestScore + sourceScore;
              return { ...item, priority: finalScore, telemetry: { interestScore, sourceScore } };
            }).sort((a, b) => b.priority - a.priority);
  
            const triagedPool = scoredPool.slice(0, IngestionOrchestrator.MAX_HIGH_FIDELITY_ITEMS);
            this.profiler.endStage('Stage 4: Triage', { count: triagedPool.length });
            this.telemetry.triagedCount = triagedPool.length;
            
            // --- STAGE 5: Parallel High-Fidelity Hydration ---
            wrappedProgress(4, "Hydration - Content extraction and normalization...");
            this.profiler.startStage('Stage 5: Hydration');
            const normalizedItems: ContentItem[] = await this.processHighFidelity(triagedPool, (msg) => {
               wrappedProgress(4, `Hydration - ${msg.includes(': ') ? msg.split(': ')[1] : msg}`);
            });
            saveSnapshot("3_Hydrated_Items", normalizedItems);
            this.profiler.endStage('Stage 5: Hydration', { count: normalizedItems.length });
  
            // --- STAGE 6: Near-Dedupe ---
            wrappedProgress(5, "Performing semantic near-deduplication...");
            this.profiler.startStage('Stage 6: Near-Dedupe');
            newProcessedItems = await this.deduplicator.dedupeAndScrutinize(normalizedItems);
            saveSnapshot("4_Deduped_Items", newProcessedItems);
            this.profiler.endStage('Stage 6: Near-Dedupe');
  
            // --- STAGE 7: Embedding Generation ---
            wrappedProgress(6, "Embedding - Generating semantic vectors...");
            this.profiler.startStage('Stage 7: Embedding');
            await Promise.all(newProcessedItems.map(async (item) => {
              if (!item.embedding) {
                item.embedding = await this.brain.embed(item.title + " " + item.summary || "");
              }
            }));
            this.profiler.endStage('Stage 7: Embedding');
          }
        } else {
          // Zero new items fund. Fast-forward progress for UX.
          wrappedProgress(3, "Triage - No new signals to score.");
          wrappedProgress(4, "Hydration - Skipping (0 items).");
          wrappedProgress(5, "Deduplication - Skipping.");
          wrappedProgress(6, "Embedding - Skipping.");
        }

        // Merge logic: Combine NEW items with CACHED items (if any)
        // We act as a "rolling window" or just accumulation?
        // Let's accumulate for now, but limit total size if needed.
        const previousItems = IngestionOrchestrator.cachedItems || [];
        
        // CRITICAL FIX: Filter previous items to REMOVE those from inactive sources
        // The user turned them off, so they must disappear from the feed immediately.
        const activeSourceNames = new Set(sources.filter(s => s.isActive).map(s => s.name));
        const validPreviousItems = previousItems.filter(item => activeSourceNames.has(item.sourceName));

        // Prevent exact duplicates by ID just in case
        const mergedMap = new Map<string, ContentItem>();
        validPreviousItems.forEach(i => mergedMap.set(i.id, i));
        newProcessedItems.forEach(i => mergedMap.set(i.id, i));
        
        itemsToProcess = Array.from(mergedMap.values());
        
        // Update Static Cache
        IngestionOrchestrator.cachedItems = itemsToProcess;
        IngestionOrchestrator.lastIngestTime = Date.now();
      }

      // STAGE 8: Clustering
      wrappedProgress(5, "Synthesis - Semantic clustering and discovery...");
      this.profiler.startStage('Stage 8: Clustering');
      const rawClusters = await this.clusterer.cluster(itemsToProcess);
      this.profiler.endStage('Stage 8: Clustering', { count: rawClusters.length });
      
      // STAGE 9: Scoring
      this.profiler.startStage('Stage 9: Scoring');
      const rankedClusters = await this.scorer.score(rawClusters, context);
      this.profiler.endStage('Stage 9: Scoring');
      
      // STAGE 10: Cluster Synthesis
      this.profiler.startStage('Stage 10: Cluster Synthesis');
      const synthesizedClusters = await this.synthesizer.synthesize(rankedClusters, context.persona);
      this.profiler.endStage('Stage 10: Cluster Synthesis');

      // STAGE 11: Global Synthesis
      this.profiler.startStage('Stage 11: Global Synthesis');
      wrappedProgress(5, "Synthesis - Generating overarching daily state...");
      const dailySummary = await this.brain.synthesizeGlobal(synthesizedClusters, context.persona);
      this.profiler.endStage('Stage 11: Global Synthesis');

      // Audit Log
      PipelineAuditor.log(
        Date.now() - this.telemetry.startTime,
        this.telemetry,
        synthesizedClusters.length,
        synthesizedClusters
      );

      return { clusters: synthesizedClusters, dailySummary };

    } catch (error) {
      console.error("[Orchestrator] Fatal pipeline failure:", error);
      wrappedProgress(0, "Fatal Error: Pipeline shutdown.");
      throw error;
    }
  }

  private async processHighFidelity(items: any[], onProgress?: (msg: string) => void): Promise<ContentItem[]> {
    // Stage 5 Optimization: Use rolling window concurrency instead of strict batching.
    const CONCURRENCY_LIMIT = 10;
    
    const tasks = items.map((it, idx) => async () => {
      // Logic from previous implementation, wrapped in a task factory
      if (onProgress && idx % 5 === 0) onProgress(`Hydrating item ${idx + 1}/${items.length}...`);
      
      try {
        const connector = getConnector(it.entity.type);
        const fullContent = await connector.hydrate(it.raw);
        it.raw.rawContent = fullContent;
        
        if ((it.raw as any)._discoveredImage && !it.raw.imageUrl) {
          it.raw.imageUrl = (it.raw as any)._discoveredImage;
        }

        return connector.normalize(it.raw, it.entity);
      } catch (e) {
        console.error(`[Hydration] Failed for ${it.raw.title}:`, e);
        return null;
      }
    });

    // Execute with concurrency limit
    const results = await pLimit(CONCURRENCY_LIMIT, tasks);
    return results.filter((x): x is ContentItem => x !== null);
  }

  private isNoisySignal(title: string): boolean {
    const noise = ['Daily Briefing', 'Weekly Roundup', 'sponsored', 'advertisement', 'newsletter'];
    return noise.some(n => title.toLowerCase().includes(n));
  }
}
