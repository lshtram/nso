import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngestionOrchestrator } from './orchestrator';
import * as connectors from '../connectors';

// Mock dependencies
vi.mock('../brain/factory', () => ({
  getBrainProvider: () => ({
    rank: vi.fn().mockResolvedValue([100]), // Return standard rank
    embed: vi.fn().mockResolvedValue([]),
    synthesize: vi.fn(),
    synthesizeGlobal: vi.fn()
  })
}));

// We need to properly mock the module to spy on getConnector
vi.mock('../connectors', () => ({
  getConnector: vi.fn()
}));

describe('IngestionOrchestrator Smart Refresh', () => {
    let orchestrator: IngestionOrchestrator;
    let getConnectorMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        orchestrator = new IngestionOrchestrator();
        
        // Reset static cache for testing
        (IngestionOrchestrator as any).cachedItems = null;
        (IngestionOrchestrator as any).lastIngestTime = 0;
        (IngestionOrchestrator as any).globalSeenUrls = new Set();
        
        getConnectorMock = connectors.getConnector;
    });

    it('should skip processing known URLs', async () => {
        // Setup: One URL is already known
        (IngestionOrchestrator as any).globalSeenUrls.add('http://test.com/known');
        
        // Mock Connector behavior
        const mockConnector = {
            discover: vi.fn().mockResolvedValue([
                { url: 'http://test.com/known', title: 'Known Item' },
                { url: 'http://test.com/new', title: 'New Item' }
            ]),
            hydrate: vi.fn().mockResolvedValue('Some content'),
            normalize: vi.fn().mockReturnValue({ 
                title: 'New Item', 
                url: 'http://test.com/new',
                summary: 'Start',
                topics: [],
                entities: [] 
            })
        };
        getConnectorMock.mockReturnValue(mockConnector);

        // Run Ingestion
        // We pass a dummy source
        const sources: any[] = [{ id: 'test', name: 'Test Source', isActive: true, type: 'rss', url: 'http://source.com' }];
        const context: any = { parameters: { interests: {} } };

        await orchestrator.runIngestion(sources, context, true);

        // Verification:
        // 1. globalSeenUrls should now contain the new URL
        const seen = (IngestionOrchestrator as any).globalSeenUrls;
        expect(seen.has('http://test.com/new')).toBe(true);
        expect(seen.has('http://test.com/known')).toBe(true);

        // 2. The pipeline should have processed 1 item (the new one)
        // We can check this by seeing if orchestrator.telemetry.allRawItems has both, 
        // but duplicateUrls should have the known one?
        // Wait, telemetry logic: 
        //   - discovery loop adds to allRawItems (so both will be there)
        //   - dedupe loop checks globalSeenUrls.
        //   - if cached, it SKIPS bulkPool.
        
        // So we can assume if it worked, normalizedItems internally would be 1. 
        // We can check telemetry.
        // Assuming dedupe logic works, we can't easily spy on private variables without 'any' casting or looking at side effects.
        // Side effect: 'duplicateUrls' array in telemetry? No, logic says "knownItemsCount++", but doesn't push to duplicateUrls (that's for same-batch duplicates).
        
        // We can verify by checking if hydrate was called ONLY once (for the new item).
        // Since we filtered the known item out of the bulkPool, it should NEVER reach hydration.
        expect(mockConnector.hydrate).toHaveBeenCalledTimes(1); 
        // It wraps multiple calls in Promise.all, but we expect only 1 item in the pool.
    });
});
