
import { describe, it } from 'vitest';
import { IngestionOrchestratorV2 } from './orchestrator_v2';
import { SourceEntity } from '@/types';
import path from 'path';
import fs from 'fs';

const TEST_SOURCES: SourceEntity[] = [
  // Politics/News
  { id: 'bbc', name: 'BBC World', type: 'rss', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', isActive: true, healthStatus: 'active', signalScore: 90 },
  { id: 'guardian', name: 'The Guardian', type: 'rss', url: 'https://www.theguardian.com/world/rss', isActive: true, healthStatus: 'active', signalScore: 85 },
  { id: 'reuters', name: 'Reuters', type: 'rss', url: 'https://www.reuters.com', isActive: true, healthStatus: 'active', signalScore: 95 },
  { id: 'nyt', name: 'NYT World', type: 'rss', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', isActive: true, healthStatus: 'active', signalScore: 90 },

  // Tech
  { id: 'tc', name: 'TechCrunch', type: 'rss', url: 'https://techcrunch.com/feed', isActive: true, healthStatus: 'active', signalScore: 80 },
  { id: 'verge', name: 'The Verge', type: 'rss', url: 'https://www.theverge.com/rss/index.xml', isActive: true, healthStatus: 'active', signalScore: 80 },
  { id: 'wired', name: 'Wired', type: 'rss', url: 'https://www.wired.com/feed/rss', isActive: true, healthStatus: 'active', signalScore: 85 },
  { id: 'ars', name: 'Ars Technica', type: 'rss', url: 'https://feeds.arstechnica.com/arstechnica/index', isActive: true, healthStatus: 'active', signalScore: 85 },

  // AI
  { id: 'vbai', name: 'VentureBeat AI', type: 'rss', url: 'https://venturebeat.com/category/ai/feed/', isActive: true, healthStatus: 'active', signalScore: 75 },
  { id: 'mlm', name: 'ML Mastery', type: 'rss', url: 'https://machinelearningmastery.com/feed/', isActive: true, healthStatus: 'active', signalScore: 70 },
  { id: 'ai_news', name: 'AI News', type: 'rss', url: 'https://www.artificialintelligence-news.com/feed/', isActive: true, healthStatus: 'active', signalScore: 70 },
  { id: 'openai', name: 'OpenAI', type: 'rss', url: 'https://openai.com/news', isActive: true, healthStatus: 'active', signalScore: 95 },

  // Art
  { id: 'colossal', name: 'Colossal', type: 'rss', url: 'https://www.thisiscolossal.com/feed/', isActive: true, healthStatus: 'active', signalScore: 80 },
  { id: 'artnet', name: 'Artnet News', type: 'rss', url: 'https://news.artnet.com/feed', isActive: true, healthStatus: 'active', signalScore: 80 },
  { id: 'juxtapoz', name: 'Juxtapoz', type: 'rss', url: 'https://www.juxtapoz.com', isActive: true, healthStatus: 'active', signalScore: 75 },
  { id: 'hifructose', name: 'Hi-Fructose', type: 'rss', url: 'https://hifructose.com', isActive: true, healthStatus: 'active', signalScore: 75 },

  // Food
  { id: 'eater', name: 'Eater', type: 'rss', url: 'https://www.eater.com/rss/index.xml', isActive: true, healthStatus: 'active', signalScore: 75 },
  { id: 'seriouseats', name: 'Serious Eats', type: 'rss', url: 'https://www.seriouseats.com/rss', isActive: true, healthStatus: 'active', signalScore: 80 },
  { id: 'food52', name: 'Food52', type: 'rss', url: 'https://food52.com', isActive: true, healthStatus: 'active', signalScore: 75 },
  { id: 'bonappetit', name: 'Bon Appétit', type: 'rss', url: 'https://www.bonappetit.com/feed/rss', isActive: true, healthStatus: 'active', signalScore: 80 }
];

describe('Pipeline Robustness & Performance Benchmark', () => {
  it('should run full 11-stage pipeline on 15+ diverse sources and save intermediate outputs', async () => {
    const orchestrator = new IngestionOrchestratorV2();
    const debugDir = path.join(process.cwd(), 'tmp', 'robustness');
    
    if (fs.existsSync(debugDir)) {
        fs.rmSync(debugDir, { recursive: true });
    }
    fs.mkdirSync(debugDir, { recursive: true });

    console.log(`[Robustness] Testing with ${TEST_SOURCES.length} sources...`);
    
    const startTime = performance.now();
    const result = await orchestrator.runIngestion(TEST_SOURCES, {
      persona: 'Strategic Analyst',
      globalStrategy: 'Maximize signal and diversity across 20 sources.',
      parameters: {}
    }, {
      debugDir: debugDir
    }, (msg) => console.log(msg));

    const totalDuration = performance.now() - startTime;
    console.log(`\n[Benchmark] Pipeline finished in ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`[Benchmark] Final clusters: ${result.clusters.length}`);

    // Log the throughput for the user
    const stats = fs.readdirSync(debugDir)
      .filter(f => f.startsWith('stage_'))
      .map(f => {
        const content = JSON.parse(fs.readFileSync(path.join(debugDir, f), 'utf-8'));
        return {
          stage: content.stage,
          items: content.count,
          time: content.durationMs.toFixed(2) + 'ms',
          ratePer1k: ((content.durationMs / content.count) * 1000).toFixed(2) + 'ms'
        };
      });

    console.table(stats);
  }, 120000); // 120s timeout for real network calls
});
