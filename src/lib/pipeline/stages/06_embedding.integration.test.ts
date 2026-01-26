
import { describe, it, expect, beforeEach } from 'vitest';
import { EmbeddingStage } from './06_embedding';
import { PipelineContext, PipelineControlParams, HydratedItem } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { MockBrain } from '../../brain/mock';
import { GeminiProvider } from '../../brain/gemini';

describe('Stage 6: Semantic Embedding (Integration)', () => {
  let stage: EmbeddingStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;

  beforeEach(() => {
    const useRealBrain = process.env.USE_REAL_BRAIN === 'true';
    const apiKey = process.env.GOOGLE_AI_KEY;
    
    let brain;
    if (useRealBrain && apiKey) {
        console.log("[Test] Using REAL Gemini Brain for Embedding...");
        brain = new GeminiProvider(apiKey);
    } else {
        console.log("[Test] Using Mock Brain for Embedding.");
        brain = new MockBrain();
    }

    stage = new EmbeddingStage(brain as any);
    
    context = {
      runId: 'integ-test-stage6',
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

  it('should generate embeddings for real hydrated items', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage5_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 5 output not found. Run Stage 1-5 tests first.");
    }
    
    const inputItems: HydratedItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[Test] Running Embedding on ${inputItems.length} items...`);

    const startTime = performance.now();
    const result = await stage.run(inputItems, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${inputItems.length} items.`);
    console.log(`[Stats] Rate: ${((durationMs / inputItems.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBe(inputItems.length);
    expect(result[0].embedding).toBeDefined();
    expect(result[0].embedding.length).toBeGreaterThan(0);
    
    // Save for Stage 7
    const savePath = path.join(process.cwd(), 'tmp', 'stage6_output.json');
    fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
    console.log(`[Test] Saved embedded items to ${savePath}`);
  });
});
