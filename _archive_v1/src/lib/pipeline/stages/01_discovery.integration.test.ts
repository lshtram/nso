
import { describe, it, expect } from 'vitest';
import { DiscoveryStage } from './01_discovery';
import { SourceEntity } from '@/types'; // Fixed
import { PipelineContext, PipelineControlParams, IngestionRepository } from '../types';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

// Helper to ensure tmp dir exists
const ensureTmp = () => {
  const tmp = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
  return tmp;
};

// Real sources for testing
const REAL_SOURCES: SourceEntity[] = [
  { id: 'hn', name: 'Hacker News', type: 'rss', url: 'https://news.ycombinator.com/rss', isActive: true, healthStatus: 'active', signalScore: 90 },
  { id: 'tc', name: 'TechCrunch', type: 'rss', url: 'https://techcrunch.com/feed', isActive: true, healthStatus: 'active', signalScore: 80 },
  { id: 'verge', name: 'The Verge', type: 'rss', url: 'https://www.theverge.com/rss/index.xml', isActive: true, healthStatus: 'active', signalScore: 70 },
  { id: 'wired', name: 'Wired', type: 'rss', url: 'https://www.wired.com/feed/rss', isActive: true, healthStatus: 'active', signalScore: 75 }
];

describe('Stage 1: Bulk Discovery (Integration)', () => {
  // Increase timeout for network calls
  it('should fetch real items from multiple RSS feeds', async () => {
    const stage = new DiscoveryStage();
    
    const context: PipelineContext = {
      runId: 'integ-test-stage1',
      startTime: Date.now(),
      signal: new AbortController().signal,
      events: new EventEmitter() as any,
      repository: {} as IngestionRepository
    };

    const controls: PipelineControlParams = {
      ingestion: { lookbackHours: 24, maxItems: 100 },
      discovery: { maxItemsPerSource: 50, searchWindowHours: 24 },
      triage: { noiseThreshold: 0.3, minInterestScore: 60, maxHydrationLimit: 40 },
      clustering: { algorithm: 'dbscan', epsilon: 0.85, minClusterSize: 2 },
      synthesis: { persona: 'Analyst', detailLevel: 'brief' }
    };

    console.log(`[Test] Fetching from ${REAL_SOURCES.length} sources...`);
    const startTime = performance.now();
    const results = await stage.run(REAL_SOURCES, controls, context);
    const durationMs = performance.now() - startTime;

    console.log(`[Test] Discovered ${results.length} total items in ${durationMs.toFixed(2)}ms.`);
    
    // Performance Metrics
    const ratePer1000 = (durationMs / results.length) * 1000;
    console.log(`[Stats] Performance: ${durationMs.toFixed(2)}ms for ${results.length} items.`);
    console.log(`[Stats] Rate: ${(ratePer1000 / 1000).toFixed(2)} seconds per 1,000 items discovered.`);
    
    // Validations
    expect(results.length).toBeGreaterThan(0);
    const hnItems = results.filter(i => i.discoveryNotes?.includes('Hacker News'));
    const tcItems = results.filter(i => i.discoveryNotes?.includes('TechCrunch'));
    
    expect(hnItems.length).toBeGreaterThan(0);
    expect(tcItems.length).toBeGreaterThan(0);
    
    // Check data integrity
    const sample = results[0];
    expect(sample.title).toBeDefined();
    expect(sample.url).toBeDefined();
    expect(sample.url).toMatch(/^http/);

    // Save for Stage 2
    const savePath = path.join(ensureTmp(), 'stage1_output.json');
    fs.writeFileSync(savePath, JSON.stringify(results, null, 2));
    console.log(`[Test] Saved output to ${savePath}`);
  }, 60000); // 60s timeout
});
