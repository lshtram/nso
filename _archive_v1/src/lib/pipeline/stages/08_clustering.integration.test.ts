
import { describe, it, expect, beforeEach } from 'vitest';
import { ClusteringStage } from './08_clustering';
import { PipelineContext, PipelineControlParams, HydratedItem } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

describe('Stage 8: Semantic Clustering (Integration)', () => {
  let stage: ClusteringStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    stage = new ClusteringStage();
    context = {
      runId: 'integ-test-stage8',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as any
    };
    controls = {
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      ingestion: { lookbackHours: 24, maxItems: 100 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 40 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 1 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };
  });

  it('should group real embedded items into clusters', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage7_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 7 output not found. Run previous stages tests first.");
    }
    
    const inputItems: HydratedItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[Test] Running Clustering on ${inputItems.length} embedded items...`);

    const startTime = performance.now();
    const result = await stage.run(inputItems, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${inputItems.length} items.`);
    console.log(`[Stats] Rate: ${((durationMs / inputItems.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(inputItems.length);
    
    // Check if clusters have items
    expect(result[0].items.length).toBeGreaterThan(0);

    // Save for Stage 9
    const savePath = path.join(process.cwd(), 'tmp', 'stage8_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved clusters to ${savePath}`);
  });
});
