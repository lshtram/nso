
import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticDeduplicationStage } from './07_semantic_deduplication';
import { PipelineContext, PipelineControlParams, HydratedItem } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { MockBrain } from '../../brain/mock';

describe('Stage 7: Near-Duplicate Resolution (Integration)', () => {
  let stage: SemanticDeduplicationStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    stage = new SemanticDeduplicationStage(new MockBrain() as any);
    context = {
      runId: 'integ-test-stage7',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as any
    };
    controls = {
      ingestion: { lookbackHours: 24, maxItems: 100 },
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      ingestion: { lookbackHours: 24, maxItems: 100 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 40 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };
  });

  it('should identify and resolve near-duplicates using semantic similarity', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage6_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 6 output not found. Run Stage 1-6 tests first.");
    }
    
    const realItems: HydratedItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    
    // Inject literal duplicates with slightly different metadata
    const itemToDupe = realItems[0];
    const nearDupes: HydratedItem[] = [
        { ...itemToDupe, id: 'dupe-1', sourceName: 'Other Source', title: itemToDupe.title + " (Update)" },
        { ...itemToDupe, id: 'dupe-2', sourceName: 'Third Source', title: "BREAKING: " + itemToDupe.title }
    ];

    const mixedItems = [...realItems, ...nearDupes];
    console.log(`[Test] Running Near-Dedupe on ${mixedItems.length} items (2 intentional semantic duplicates)...`);

    const startTime = performance.now();
    const result = await stage.run(mixedItems, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${mixedItems.length} items.`);
    console.log(`[Stats] Rate: ${((durationMs / mixedItems.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    console.log(`[Test] Result length: ${result.length}, Original length: ${realItems.length}`);
    expect(result.length).toBeLessThanOrEqual(realItems.length); // Should have merged the 2 dupes back into the original story
    
    // Save for Stage 8-11
    const savePath = path.join(process.cwd(), 'tmp', 'stage7_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved deduplicated items to ${savePath}`);
  });
});
