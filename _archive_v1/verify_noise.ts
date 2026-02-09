import { IngestionOrchestrator } from './src/lib/pipeline/orchestrator';
import { SourceEntity, SteeringContext } from './src/types';

async function verifyNoiseSuppression() {
  const orchestrator = new IngestionOrchestrator();

  const mockEntity: SourceEntity = {
    id: 'noisy-source',
    name: 'Sample Source',
    type: 'rss',
    url: 'https://example.com/rss',
    isActive: true,
    healthStatus: 'active'
  };

  // Simulated raw items from a discovery phase
  const sampleItems = [
    { title: 'New AI Breakthrough in Logic', rawContent: 'Real story about AI.' },
    { title: 'autogen python-v0.6.1', rawContent: 'Version bump noise.' },
    { title: 'langchain langchain==1.2.7', rawContent: 'Release noise.' },
    { title: 'Philosophy of Mind in 2024', rawContent: 'Deep essay.' },
    { title: '[pre-release] model-v2', rawContent: 'Unstable noise.' }
  ];

  console.log('--- Testing Noise Suppression ---');
  console.log('Original items:', sampleItems.map(i => i.title));
  
  // We need to bypass the real discover/hydrate to test the filter
  // Since we can't easily override private methods in this script, we'll
  // manually test the private method via any-casting for verification purposes
  const filtered = sampleItems.filter(item => !(orchestrator as any).isNoisySignal(item.title));
  
  console.log('\nFiltered items:', filtered.map(i => i.title));
  
  const removed = sampleItems.length - filtered.length;
  console.log(`\nResult: Successfully removed ${removed} noisy items.`);
  
  if (removed >= 3) {
    console.log('PASSED: Noise filter detected and removed version bumps.');
  } else {
    console.log('FAILED: Noise filter missed some items.');
  }
}

verifyNoiseSuppression().catch(console.error);
