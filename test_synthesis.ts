
import { GeminiProvider } from './src/lib/brain/gemini';
import { StoryCluster } from './src/types';

async function test() {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    console.error("No GOOGLE_AI_KEY found in environment");
    return;
  }

  const brain = new GeminiProvider(apiKey);
  
  const mockCluster: StoryCluster = {
    id: 'test',
    title: 'Nvidia Blackwell Launch and AI Infrastructure',
    narrative: '',
    whyItMatters: '',
    items: [
      {
        id: '1',
        sourceName: 'Nvidia Blog',
        sourceType: 'rss',
        url: 'https://nvidia.com',
        title: 'Nvidia Announces Blackwell GPU Architecture',
        publishedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        summary: 'Nvidia has officially unveiled Blackwell, its next generation GPU architecture designed for trillion-parameter AI models. It promises 20x performance improvement over H100.'
      },
      {
        id: '2',
        sourceName: 'The Verge',
        sourceType: 'rss',
        url: 'https://theverge.com',
        title: 'Nvidia Blackwell: Everything you need to know',
        publishedAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        summary: 'Nvidia is not just selling chips anymore; Blackwell is a full infrastructure play. The new GB200 NVL72 connects 72 GPUs into a single monstrous unit.'
      }
    ],
    topItems: [],
    momentumScore: 100,
    relevanceScore: 100,
    finalRank: 1,
    category: 'TECH',
    trendIndicator: 'rising'
  };

  console.log("--- Starting Synthesis Test ---");
  try {
    const result = await brain.synthesize(mockCluster, 'Scientific Review');
    console.log("--- Result Success ---");
    console.log("Title:", result.title);
    console.log("Narrative:", result.narrative);
    console.log("Why It Matters:", result.whyItMatters);
    
    const parsedNarrative = JSON.parse(result.narrative!);
    console.log("--- Parsed Narrative ---");
    console.log("Brief:", parsedNarrative.brief);
    console.log("Takeaways:", parsedNarrative.takeaways);
  } catch (e) {
    console.error("Test Failed:", e);
  }
}

test();
