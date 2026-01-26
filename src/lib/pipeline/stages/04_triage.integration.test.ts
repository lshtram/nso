
import { describe, it, expect, beforeEach } from 'vitest';
import { TriageStage } from './04_triage';
import { PipelineContext, PipelineControlParams, DiscoveredItem } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { MockBrain } from '../../brain/mock';
import { GeminiProvider } from '../../brain/gemini';

describe('Stage 4: Intelligent Triage (Integration)', () => {
  let stage: TriageStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    // Setup Brain based on ENV or default to Mock
    const useRealBrain = process.env.USE_REAL_BRAIN === 'true';
    const apiKey = process.env.GOOGLE_AI_KEY;
    
    let brain;
    if (useRealBrain && apiKey) {
        console.log("[Test] Using REAL Gemini Brain for Triage...");
        brain = new GeminiProvider(apiKey);
    } else {
        console.log("[Test] Using Mock Brain for Triage.");
        brain = new MockBrain();
    }

    stage = new TriageStage(brain as any);
    
    context = {
      runId: 'integ-test-stage4',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as any
    };
    controls = {
      ingestion: { lookbackHours: 24, maxItems: 100 },
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 10 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };
  });

  it('should rank items and enforce hydration limits on real data', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage3_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 3 output not found. Run Stage 1-3 tests first.");
    }
    
    const inputItems: DiscoveredItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[Test] Running Triage on ${inputItems.length} filtered items...`);

    const startTime = performance.now();
    const result = await stage.run(inputItems, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${inputItems.length} items.`);
    console.log(`[Stats] Rate: ${((durationMs / inputItems.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBeLessThanOrEqual(controls.triage.maxHydrationLimit);
    expect(result.length).toBeGreaterThan(0);
    
    // Ensure they are sorted by priority
    for (let i = 1; i < result.length; i++) {
        expect(result[i-1].priorityScore).toBeGreaterThanOrEqual(result[i].priorityScore);
    }

    // Save for Stage 5
    const savePath = path.join(process.cwd(), 'tmp', 'stage4_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved top items to ${savePath}`);
  });
});
