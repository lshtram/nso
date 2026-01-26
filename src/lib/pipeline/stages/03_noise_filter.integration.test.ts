
import { describe, it, expect, beforeEach } from 'vitest';
import { NoiseFilterStage } from './03_noise_filter';
import { PipelineContext, PipelineControlParams, DiscoveredItem } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

describe('Stage 3: Noise Filtering (Integration)', () => {
  let stage: NoiseFilterStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    stage = new NoiseFilterStage();
    context = {
      runId: 'integ-test-stage3',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as any
    };
    controls = {
      ingestion: { lookbackHours: 24, maxItems: 100 },
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 40 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };
  });

  it('should filter real data and correctly identify injected noise', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage1_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 1 output not found. Run Stage 1 test first.");
    }
    
    const realItems: DiscoveredItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    
    // Inject noise
    const noiseItems: DiscoveredItem[] = [
        { id: 'n1', url: 'http://spam.com/1', title: 'SPONSORED: Buy cheap pills', rawContent: '', publishedAt: '', priorityScore: 10 },
        { id: 'n2', url: 'http://spam.com/2', title: 'Daily Briefing: Everything you missed', rawContent: '', publishedAt: '', priorityScore: 10 },
        { id: 'n3', url: 'http://spam.com/3', title: 'Weekly Roundup of nothing', rawContent: '', publishedAt: '', priorityScore: 10 }
    ];

    const mixedItems = [...realItems, ...noiseItems];
    console.log(`[Test] Running Noise Filter on ${mixedItems.length} items (3 intentional noise items)...`);

    const startTime = performance.now();
    const result = await stage.run(mixedItems, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${mixedItems.length} items.`);
    console.log(`[Stats] Rate: ${((durationMs / mixedItems.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBeLessThan(mixedItems.length);
    const resultIds = new Set(result.map(i => i.id));
    expect(resultIds.has('n1')).toBe(false);
    expect(resultIds.has('n2')).toBe(false);
    expect(resultIds.has('n3')).toBe(false);
    
    // Save for Stage 4
    const savePath = path.join(process.cwd(), 'tmp', 'stage3_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved clean output to ${savePath}`);
  });
});
