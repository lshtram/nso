
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriageStage } from './04_triage';
import { PipelineContext, PipelineControlParams, DiscoveredItem, IngestionRepository } from '../types';
import { getBrainProvider } from '../../brain/factory';
import { EventEmitter } from 'events';


// Remove module mock since we use DI now
// vi.mock('../../brain/factory', ...);

describe('Stage 4: Intelligent Triage', () => {
  let stage: TriageStage;
  let mockContext: PipelineContext;
  let mockControls: PipelineControlParams;
  let mockBrain: any;

  beforeEach(() => {
    const mockBrainProvider = {
      rank: vi.fn(),
    };
    stage = new TriageStage(mockBrainProvider as any);
    mockBrain = mockBrainProvider;
    
    mockContext = {
      runId: 'test-run',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as IngestionRepository
    };

    mockControls = {
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 2 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Test', detailLevel: 'brief' }
    };
  });

  it('should filter items and respect maxHydrationLimit', async () => {
    // Setup 5 items
    const inputItems: DiscoveredItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `id${i}`,
      url: `http://test${i}.com`,
      title: `Item ${i}`,
      rawContent: `Content ${i}`,
      publishedAt: new Date().toISOString(),
      priorityScore: 50
    }));

    // Mock Brain: Rank items 0,1,2 high, 3,4 low
    mockBrain.rank = vi.fn().mockResolvedValue([90, 85, 80, 20, 10]);

    const result = await stage.run(inputItems, mockControls, mockContext);

    // Should return top 2 (maxHydrationLimit)
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Item 0'); // 90
    expect(result[1].title).toBe('Item 1'); // 85
    expect(mockBrain.rank).toHaveBeenCalledTimes(1);
  });

  it('should handle empty input gracefully', async () => {
    const result = await stage.run([], mockControls, mockContext);
    expect(result).toEqual([]);
    expect(mockBrain.rank).not.toHaveBeenCalled();
  });
});
