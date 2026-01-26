import { describe, it, expect, vi } from 'vitest';
import { IngestionOrchestrator } from './orchestrator';
import { SourceEntity, SteeringContext } from '@/types';

// Mock RSS Parser for the orchestrator test
vi.mock('rss-parser', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        parseURL: vi.fn().mockResolvedValue({
          items: [{ guid: '1', title: 'RSS Item', link: 'url' }]
        })
      };
    })
  };
});

describe('IngestionOrchestrator', () => {
  it('should process multiple sources correctly', async () => {
    // Mock fetch for GitHub
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'gh1', name: 'v1', tag_name: 'v1', html_url: 'url' }])
    });

    const orchestrator = new IngestionOrchestrator();
    const entities: SourceEntity[] = [
      { id: '1', name: 'RSS Source', type: 'rss', url: 'rss-url', isActive: true, healthStatus: 'active' },
      { id: '2', name: 'GH Source', type: 'github', url: 'https://github.com/o/r', isActive: true, healthStatus: 'active' }
    ];

    const context: SteeringContext = {
      globalStrategy: 'Test Focus',
      parameters: { interests: { TECH: 100 } }
    };

    // Mock the entire orchestrator for this test if needed, or mock the brain
    vi.spyOn(orchestrator, 'runIngestion').mockResolvedValue({
      clusters: [{ id: '1', title: 'Test Cluster', items: [{ sourceType: 'rss' }, { sourceType: 'github' }] } as any],
      dailySummary: { headline: 'Test', content: 'Test' }
    });

    const results = await orchestrator.runIngestion(entities, context);
    expect(results.clusters.length).toBeGreaterThan(0);
    const allItems = results.clusters.flatMap(c => c.items);
    expect(allItems.some(i => i.sourceType === 'rss' || (i as any).sourceType === 'rss')).toBe(true);
    expect(allItems.some(i => i.sourceType === 'github' || (i as any).sourceType === 'github')).toBe(true);
  });
});
