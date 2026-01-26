import { SourceEntity, ContentItem, StoryCluster } from '@/types';
import { RawItem } from '../connectors/types';

// ==========================================
// 1. Brain Control Plane (The "Knobs")
// ==========================================

export interface PipelineControlParams {
  discovery: {
    maxItemsPerSource: number;
    searchWindowHours: number;
    allowedDomains?: string[];
  };
  ingestion: {
    lookbackHours: number;
    maxItems: number;
  };
  triage: {
    noiseThreshold: number;       // 0-1, discard below
    minInterestScore: number;     // 0-100, hydrate above
    maxHydrationLimit: number;    // Hard cap on heavy scraping (e.g. 40 items)
  };
  clustering: {
    algorithm: 'dbscan' | 'hierarchical' | 'llm-guided';
    epsilon: number;              // Density threshold
    minClusterSize: number;
  };
  synthesis: {
    persona: string;              // e.g. "Tech Skeptic"
    detailLevel: 'brief' | 'detailed';
  }
}

// ==========================================
// 2. Data Shapes (The "Protocol")
// ==========================================

// Stage 1 Output: Lightweight pointer
export interface DiscoveredItem extends RawItem {
  priorityScore: number; 
  discoveryNotes?: string;
}

// Stage 2/3 Output: Enriched but not fully clustered
export interface HydratedItem extends ContentItem {
  embedding: number[];
  scrutiny?: {
    integrityScore: number;
    flags: string[];
    conflictPoints?: string[]; // Added
  }
}

// ==========================================
// 3. Stage Interface (Strictly Typed)
// ==========================================

export interface PipelineContext {
  runId: string;
  startTime: number;
  
  // 1. Cancellation Safety
  signal: AbortSignal;
  
  // 2. Progressive Disclosure (Real-time UI)
  events: TypedEmitter;
  
  // 3. Side-Effect Repository
  repository: IngestionRepository;
}

export interface TypedEmitter {
  emit(event: 'purgatory_item', data: DiscoveredItem): void;
  emit(event: 'hydrated_item', data: HydratedItem): void;
  emit(event: 'progress', message: string): void;
}

export interface PipelineStage<Input, Output> {
  name: string;
  description: string;
  summary: string; // 2-3 sentences (Markdown allowed)
  fullText?: string;
  imageUrl?: string;
  
  run(
    input: Input, 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<Output>;
}

// ==========================================
// 4. The Database Abstraction
// ==========================================

export interface IngestionRepository {
  // Phase 1: Filtering (SCALABLE: Batch check, not full load)
  filterNewUrls(urls: string[], windowMs: number): Promise<string[]>; // Returns only the NEW urls
  
  // Phase 2: Persistence (Upsert Semantics)
  persistRawItems(items: DiscoveredItem[]): Promise<void>;
  
  // Phase 3: Final State
  saveClusters(clusters: StoryCluster[]): Promise<void>;
  saveDailySummary(summary: any): Promise<void>;
}
