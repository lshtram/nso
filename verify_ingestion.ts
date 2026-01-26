import { IngestionOrchestrator } from './src/lib/pipeline/orchestrator';
import { SourceEntity } from './src/types';

async function verifyRealData() {
  const orchestrator = new IngestionOrchestrator();
  
  const sources: SourceEntity[] = [
    {
      id: 'nextjs-releases',
      name: 'Next.js Releases',
      type: 'github',
      url: 'https://github.com/vercel/next.js',
      isActive: true,
      healthStatus: 'active'
    },
    {
      id: 'the-verge',
      name: 'The Verge',
      type: 'rss',
      url: 'https://www.theverge.com/rss/index.xml',
      isActive: true,
      healthStatus: 'active'
    },
    {
      id: 'the-verge-2',
      name: 'The Verge Duplicate',
      type: 'rss',
      url: 'https://www.theverge.com/rss/index.xml',
      isActive: true,
      healthStatus: 'active'
    }
  ];

  console.log('--- START REAL DATA VERIFICATION ---');
  const clusters = await orchestrator.runIngestion(sources, {
    globalStrategy: 'Intelligence First',
    parameters: {
      interests: { TECH: 90, PHILOSOPHY: 80, GENERAL: 30 }
    }
  });
  
  console.log(`\nVerified ${clusters.length} clusters generated.`);
  
  if (clusters.length > 0) {
    console.log('\n--- SAMPLE CLUSTER (Stage 6) ---');
    const sample = clusters[0];
    console.log(`Cluster: ${sample.title}`);
    console.log(`Members: ${sample.items.length}`);
    console.log(`Common Topics: ${sample.items[0].topics?.join(', ')}`);
    console.log(`Member Title: ${sample.items[0].title}`);
  }
}

// Check if running in Node environment to execute
if (require.main === module) {
  verifyRealData().catch(console.error);
}
