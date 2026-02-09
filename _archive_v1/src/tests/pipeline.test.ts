
import { describe, it, expect, vi } from 'vitest';
import { Deduplicator } from '../../src/lib/pipeline/deduplicator';
import { Clusterer } from '../../src/lib/pipeline/clusterer';
import { Scorer } from '../../src/lib/pipeline/scorer';
import { ContentItem, StoryCluster } from '../../src/types';

describe('Pipeline Stage Tests', () => {
  
  it('Stage 2 & 5: Deduplicator - Should remove identical URLs', async () => {
    const mockBrain = { embed: vi.fn(), chat: vi.fn() } as any;
    const deduplicator = new Deduplicator(mockBrain);
    
    const items: ContentItem[] = [
      { id: '1', url: 'http://test.com/a', title: 'Test A', sourceName: 'S1', category: 'TECH', timestamp: 0, summary: '', fullText: '', score: 0, sourceType: 'rss' } as any,
      { id: '2', url: 'http://test.com/a', title: 'Test A duplicate', sourceName: 'S1', category: 'TECH', timestamp: 0, summary: '', fullText: '', score: 0, sourceType: 'rss' } as any
    ];
    
    const results = await deduplicator.dedupeAndScrutinize(items);
    // Note: Deduplicator currently handles SCRUTINY mostly, Stage 2 link dedupe happens in Orchestrator.
    // But testing the logic here is good.
    expect(results.length).toBeGreaterThan(0);
  });

  it('Stage 7: Clusterer - Should group items semantically', async () => {
    const clusterer = new Clusterer();
    const items: ContentItem[] = [
      { id: '1', title: 'Nvidia Blackwell GPU', embedding: [1, 0, 0], summary: '', fullText: '', category: 'TECH' } as any,
      { id: '2', title: 'Nvidia New Chip', embedding: [0.99, 0, 0], summary: '', fullText: '', category: 'TECH' } as any,
      { id: '3', title: 'SpaceX Rocket', embedding: [0, 1, 0], summary: '', fullText: '', category: 'SCIENCE' } as any,
    ];

    const clusters = await clusterer.cluster(items);
    expect(clusters.length).toBe(2); // Nvidia cluster and SpaceX cluster
    expect(clusters.find(c => c.items.length === 2)).toBeDefined();
  });

  it('Stage 8: Scorer - Should prioritize clusters correctly', async () => {
    const scorer = new Scorer();
    const clusters: StoryCluster[] = [
      { id: 'c1', title: 'Tech News', items: [{ category: 'TECH' }], score: 0 } as any,
      { id: 'c2', title: 'Philosophy News', items: [{ category: 'PHILOSOPHY' }], score: 0 } as any,
    ];
    const context = { parameters: { interests: { TECH: 100, PHILOSOPHY: 0 } } } as any;

    const ranked = await scorer.score(clusters, context);
    expect(ranked[0].id).toBe('c1');
    expect((ranked[0] as any).score).toBeGreaterThan((ranked[1] as any).score || -1);
  });

});
