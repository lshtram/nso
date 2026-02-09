import { IngestionOrchestrator } from './src/lib/pipeline/orchestrator';
import { SourceEntity, SteeringContext } from './src/types';

// Mock global fetch to avoid network errors and make the test realistic
const originalFetch = global.fetch;
(global as any).fetch = async (url: string) => {
  if (url.includes('mock.local')) {
    return {
      ok: true,
      text: async () => `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Mock Feed</title>
        <item><title>AI Breakthrough v1.0</title><link>https://example.com/1</link><description>Content</description></item>
        <item><title>Real Science Story</title><link>https://example.com/2</link><description>Content</description></item>
        <item><title>autogen python-v0.6.1</title><link>https://example.com/3</link><description>Noise</description></item>
      </channel></rss>`
    } as any;
  }
  return originalFetch(url);
};

async function runPerformanceTest() {
  const orchestrator = new IngestionOrchestrator();

  const thousandsOfSources: SourceEntity[] = [];
  for (let i = 0; i < 1000; i++) {
    thousandsOfSources.push({
      id: `source-${i}`,
      name: `Source Node ${i}`,
      type: 'rss',
      url: `https://mock.local/feed/${i}`,
      isActive: true,
      healthStatus: 'active',
      signalScore: 80
    });
  }

  const context: SteeringContext = {
    globalStrategy: 'Efficiency First',
    parameters: {
      interests: { TECH: 100, SCIENCE: 80 }
    }
  };

  console.log(`--- [Perf Test] Multi-Stage Pipeline Funnel ---`);
  console.log(`Feeding 1,000 sources (3,000 raw items total)`);
  
  const startTime = Date.now();
  const clusters = await orchestrator.runIngestion(thousandsOfSources, context);
  const duration = (Date.now() - startTime) / 1000;

  console.log(`\n--- [Perf Test] Results ---`);
  console.log(`Feeds processed: ${thousandsOfSources.length}`);
  console.log(`Time taken: ${duration.toFixed(2)}s`);
  console.log(`Clusters found: ${clusters.clusters.length}`);
  console.log(`Processing speed: ${(thousandsOfSources.length / duration).toFixed(2)} feeds/sec`);
  
  if (clusters.clusters.length > 0) {
    console.log('✅ Pipeline functionality verified (Clusters generated)');
  } else {
    console.log('⚠️ No clusters generated (Check MockBrain logic)');
  }
}

runPerformanceTest().catch(console.error).finally(() => {
  global.fetch = originalFetch;
});
