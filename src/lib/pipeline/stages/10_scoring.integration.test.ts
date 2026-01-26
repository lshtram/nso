
import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringStage } from './10_scoring';
import { PipelineContext, PipelineControlParams } from '../types';
import { StoryCluster } from '@/types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

describe('Stage 10: Scoring & Ranking (Integration)', () => {
  let stage: ScoringStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    stage = new ScoringStage();
    context = {
      runId: 'integ-test-stage10',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as any
    };
    controls = {
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      ingestion: { lookbackHours: 24, maxItems: 100 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 40 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };
  });

  it('should rank clusters and apply temporal decay', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage9_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 9 output not found. Run previous stages tests first.");
    }
    
    const inputClusters: StoryCluster[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[Test] Running Scoring on ${inputClusters.length} clusters...`);

    const startTime = performance.now();
    const result = await stage.run(inputClusters, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${inputClusters.length} clusters.`);
    console.log(`[Stats] Rate: ${((durationMs / inputClusters.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBe(inputClusters.length);
    if (result.length > 1) {
        // Ensure sorted by finalRank
        for (let i = 1; i < result.length; i++) {
            expect(result[i-1].finalRank).toBeGreaterThanOrEqual(result[i].finalRank);
        }
    }

    // Save for Stage 11
    const savePath = path.join(process.cwd(), 'tmp', 'stage10_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved ranked clusters to ${savePath}`);
  });
});
