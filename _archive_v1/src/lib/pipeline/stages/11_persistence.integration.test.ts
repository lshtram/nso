
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceStage } from './11_persistence';
import { PipelineContext, PipelineControlParams, IngestionRepository } from '../types';
import { StoryCluster } from '@/types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

describe('Stage 11: Persistence (Integration)', () => {
  let stage: PersistenceStage;
  let context: PipelineContext;
  let controls: PipelineControlParams;
  let mockRepo: IngestionRepository;

  beforeEach(() => {
    stage = new PersistenceStage();
    mockRepo = {
        saveClusters: vi.fn().mockResolvedValue(undefined),
        persistRawItems: vi.fn().mockResolvedValue(undefined),
        filterNewUrls: vi.fn().mockResolvedValue([]),
        saveDailySummary: vi.fn().mockResolvedValue(undefined)
    };
    context = {
      runId: 'integ-test-stage11',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: mockRepo
    };
    controls = {
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      ingestion: { lookbackHours: 24, maxItems: 100 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 40 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };
  });

  it('should persist final ranked clusters to the repository', async () => {
    const inputPath = path.join(process.cwd(), 'tmp', 'stage10_output.json');
    if (!fs.existsSync(inputPath)) {
        throw new Error("Stage 10 output not found. Run previous stages tests first.");
    }
    
    const inputClusters: StoryCluster[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    console.log(`[Test] Running Persistence on ${inputClusters.length} clusters...`);

    const startTime = performance.now();
    const result = await stage.run(inputClusters, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${inputClusters.length} clusters.`);
    console.log(`[Stats] Rate: ${((durationMs / inputClusters.length) * 1000).toFixed(2)}ms per 1,000 units.`);

    // Verification
    expect(result.length).toBe(inputClusters.length);
    expect(mockRepo.saveClusters).toHaveBeenCalledWith(inputClusters);
  });
});
