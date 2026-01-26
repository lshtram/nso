
import { describe, it, expect, beforeEach } from 'vitest';
import { HydrationStage } from './05_hydration';
import { PipelineContext, PipelineControlParams, DiscoveredItem } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

describe('Stage 5: High-Fidelity Hydration (Integration)', () => {
  let stage: HydrationStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    stage = new HydrationStage();
    context = {
      runId: 'integ-test-stage5',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as any
    };
    controls = {
      ingestion: { lookbackHours: 24, maxItems: 100 },
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 5 }, // Just scrape 5 for speed
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };
  });

  it('should scrape full content from real discovered URLs', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage4_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 4 output not found. Run Stage 1-4 tests first.");
    }
    
    // Take exactly 5 items to test hydration
    const inputItems: DiscoveredItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8')).slice(0, 5);
    console.log(`[Test] Running Hydration on ${inputItems.length} top items...`);

    const startTime = performance.now();
    const result = await stage.run(inputItems, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${inputItems.length} items.`);
    console.log(`[Stats] Rate: ${((durationMs / inputItems.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].fullText).toBeDefined();
    expect(result[0].fullText?.length).toBeGreaterThan(100); // Should have real content
    
    // Save for Stage 6
    const savePath = path.join(process.cwd(), 'tmp', 'stage5_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved hydrated items to ${savePath}`);
  }, 60000); // 60s timeout for scraping
});
