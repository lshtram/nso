
import { describe, it, expect, beforeEach } from 'vitest';
import { DeduplicationStage } from './02_deduplication';
import { PipelineContext, PipelineControlParams, DiscoveredItem, IngestionRepository } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

// Mock Scalable Repository
class MockScalableRepo implements IngestionRepository {
  private history = new Set<string>();

  async filterNewUrls(urls: string[], windowMs: number): Promise<string[]> {
    return urls.filter(u => !this.history.has(u));
  }

  async persistRawItems(items: DiscoveredItem[]): Promise<void> {
    items.forEach(i => this.history.add(i.url));
  }

  async saveClusters(clusters: any[]): Promise<void> {}
  async saveDailySummary(summary: any): Promise<void> {}
  
  // Test helper
  clearHistory() { this.history.clear(); }
}

describe('Stage 2: Precision Deduplication (Integration)', () => {
  let stage: DeduplicationStage;
  let repo: MockScalableRepo;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    stage = new DeduplicationStage();
    repo = new MockScalableRepo();
    context = {
      runId: 'integ-test-stage2',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: repo
    };
    controls = {
      ingestion: { lookbackHours: 24, maxItems: 100 },
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      ingestion: { lookbackHours: 24, maxItems: 100 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 40 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    } as any;
  });

  it('should handle real data with manual duplicates and history checks', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage1_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 1 output not found. Run Stage 1 test first.");
    }
    
    const realItems: DiscoveredItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[Test] Loaded ${realItems.length} real items from Stage 1.`);

    // 1. Create artificial duplicates (In-batch duplicates)
    const itemsWithDupes = [
        ...realItems,
        ...realItems.slice(0, 10) // Repeat first 10 items
    ];
    
    expect(itemsWithDupes.length).toBe(realItems.length + 10);

    console.log(`[Test] Running Deduplication on ${itemsWithDupes.length} items (10 intentional duplicates)...`);
    
    const startTime = performance.now();
    const result1 = await stage.run(itemsWithDupes, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Pass 1: ${durationMs.toFixed(2)}ms for ${itemsWithDupes.length} items.`);
    console.log(`[Stats] Rate: ${((durationMs / itemsWithDupes.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Check: Should have filtered exactly the 10 in-batch duplicates
    expect(result1.length).toBe(realItems.length);

    // 2. Persist to "History"
    await repo.persistRawItems(result1);

    // 3. Second Pass: Same data again
    console.log(`[Test] Running Second Pass (History check)...`);
    const startTime2 = performance.now();
    const result2 = await stage.run(realItems, controls, context);
    const durationMs2 = performance.now() - startTime2;

    console.log(`[Stats] Pass 2: ${durationMs2.toFixed(2)}ms. Should be 0 results.`);
    expect(result2.length).toBe(0); // All items are now "known" in history
  });
});
