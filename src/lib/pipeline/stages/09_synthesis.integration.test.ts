
import { describe, it, expect, beforeEach } from 'vitest';
import { SynthesisStage } from './09_synthesis';
import { PipelineContext, PipelineControlParams } from '../types';
import { StoryCluster } from '@/types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { MockBrain } from '../../brain/mock';

describe('Stage 9: Narrative Synthesis (Integration)', () => {
  let stage: SynthesisStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    stage = new SynthesisStage(new MockBrain() as any);
    context = {
      runId: 'integ-test-stage9',
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

  it('should generate narratives for clusters using mock brain', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage8_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 8 output not found. Run previous stages tests first.");
    }
    
    const inputClusters: StoryCluster[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[Test] Running Synthesis on ${inputClusters.length} clusters...`);

    const startTime = performance.now();
    const result = await stage.run(inputClusters, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${inputClusters.length} clusters.`);
    console.log(`[Stats] Rate: ${((durationMs / inputClusters.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBe(inputClusters.length);
    if (result.length > 0) {
        expect(result[0].narrative).toBeDefined();
        expect(result[0].whyItMatters).toBeDefined();
    }

    // Save for Stage 10
    const savePath = path.join(process.cwd(), 'tmp', 'stage9_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved synthesized clusters to ${savePath}`);
  });
});
