import 'dotenv/config';
import { IngestionOrchestratorV2 } from './src/lib/pipeline/orchestrator_v2';
import { SourceEntity } from './src/types';

async function timeVerification() {
  const orchestrator = new IngestionOrchestratorV2();
  const sources: SourceEntity[] = [
    {
      id: 'google-ai',
      name: 'Google AI',
      type: 'rss',
      url: 'https://blog.google/technology/ai/rss/',
      isActive: true,
      healthStatus: 'active'
    }
  ];

  console.log('--- STARTING TIMED RUN ---');
  const start = Date.now();
  await orchestrator.runIngestion(sources, {
    globalStrategy: 'Intelligence First',
    parameters: { interests: { TECH: 90 } }
  });
  const duration = (Date.now() - start) / 1000;
  console.log(`--- RUN COMPLETED IN ${duration.toFixed(2)} SECONDS ---`);
}

timeVerification().catch(console.error);
