import { BrainProvider } from './types';
import { MockBrain } from './mock';
import { GeminiProvider } from './gemini';

export function getActiveBrainName(): string {
  const apiKey = process.env.GOOGLE_AI_KEY;
  return (apiKey && apiKey !== 'YOUR_KEY_HERE') ? 'Gemini 1.5 Flash-8B (Tiered Economy)' : 'Mock Brain (Local)';
}

export function getBrainProvider(): BrainProvider {
  const apiKey = process.env.GOOGLE_AI_KEY;
  
  if (apiKey && apiKey !== 'YOUR_KEY_HERE') {
    console.log('[Brain] Initializing Production Gemini Provider (Tiered: Pro + Flash)');
    return new GeminiProvider(apiKey);
  }
  
  console.log('[Brain] No API Key found, falling back to local MockBrain');
  return new MockBrain();
}
