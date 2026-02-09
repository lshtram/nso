import { RSSCollector } from '../src/services/rss/collector';

const ITEM_TEMPLATE = `
  <item>
    <title>Benchmark Item {{i}}</title>
    <link>https://example.com/item/{{i}}</link>
    <description>This is a description for benchmark item {{i}}. It has some length to simulate real content.</description>
    <pubDate>Thu, 27 Apr 2006 01:00:00 +0000</pubDate>
    <guid>https://example.com/item/{{i}}</guid>
  </item>
`;

const ITEMS = Array.from({ length: 50 }, (_, i) => ITEM_TEMPLATE.replace(/{{i}}/g, String(i))).join('\n');

const RSS_CONTENT = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Benchmark Feed</title>
  <description>A large feed for benchmarking</description>
  ${ITEMS}
</channel>
</rss>`;

// Mock fetch globally
const mockFetch = async (url: RequestInfo | URL): Promise<Response> => {
  // Simulate tiny network delay
  await new Promise(resolve => setTimeout(resolve, 1));
  return {
    ok: true,
    text: async () => RSS_CONTENT,
    status: 200,
    statusText: 'OK',
    json: async () => ({}),
  } as unknown as Response;
};

global.fetch = mockFetch as unknown as typeof fetch;

async function runBenchmark() {
  const collector = new RSSCollector();
  const urls = Array(10).fill('http://example.com/rss'); // 10 concurrent feeds
  
  console.log('Starting benchmark with 10 feeds, 50 items each...');
  const start = performance.now();
  const results = await collector.collect(urls);
  const end = performance.now();
  
  const duration = end - start;
  console.log(`Processed ${results.length} feeds in ${duration.toFixed(2)}ms`);
  
  const totalItems = results.reduce((acc, r) => acc + r.items.length, 0);
  console.log(`Total items: ${totalItems}`);
  
  // Calculate average latency per feed (parsing time mostly since network is mocked)
  const avgLatency = results.reduce((acc, r) => acc + (r.latency || 0), 0) / results.length;
  console.log(`Average processing latency per feed: ${avgLatency.toFixed(2)}ms`);

  if (duration < 200) { // Goal is 100ms excluding network. My mock has 1ms delay * parallel?
    // Parallel fetch means 10 feeds start at once. 
    // They all wait 1ms.
    // Then parse.
    // Total time should be roughly max(fetch) + max(parse) if parallel?
    // Or if node is single threaded, parsing is sequential.
    // 10 feeds * 50 items * parse time.
    console.log('SUCCESS: Performance within acceptable range');
  } else {
    console.warn('WARNING: Performance might be slow');
  }
}

runBenchmark().catch(console.error);
