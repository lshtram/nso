
import { PipelineContext, PipelineControlParams, PipelineStage, DiscoveredItem } from '../types';
import { getBrainProvider } from '../../brain/factory';
import { pLimit } from '../utils';

export class TriageStage implements PipelineStage<DiscoveredItem[], DiscoveredItem[]> {
  name = 'Stage 4: Intelligent Triage';
  description = 'Uses LLM to rank items by interest before expensive scraping.';
  summary = 'Intelligent ranking of discovered items.';
  
  constructor(private brain = getBrainProvider()) {}

  async run(
    input: DiscoveredItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<DiscoveredItem[]> {
    if (input.length === 0) return [];
    
    // Batch processing to save API calls
    const BATCH_SIZE = 50; 
    const CONCURRENCY = 5;
    const prioritizedItems: DiscoveredItem[] = [];

    const batches = [];
    for (let i = 0; i < input.length; i += BATCH_SIZE) {
      batches.push(input.slice(i, i + BATCH_SIZE));
    }

    const runner = pLimit; // Use the custom runner directly
    let completedBatches = 0;

    context.events.emit('progress', `[Triage] Processing ${batches.length} batches with concurrency=${CONCURRENCY}...`);

    const tasks = batches.map((batch, idx) => async () => {
       if (context.signal.aborted) return [];

       try {
         const ranks = await this.brain.rank(
            batch.map(b => ({ title: b.title, snippet: b.rawContent || "" })),
            {} 
         );
         
         const batchResults: DiscoveredItem[] = [];
         batch.forEach((item, innerIdx) => {
            const interestScore = ranks[innerIdx] || 50;
            const totalScore = (interestScore * 0.7) + (item.priorityScore * 0.3);
            item.priorityScore = totalScore;
            batchResults.push(item);
         });

         completedBatches++;
         context.events.emit('progress', `[Triage] Ranked batch ${idx + 1}/${batches.length} (${completedBatches} done)`);
         return batchResults;
       } catch (e) {
         console.error(`[Triage] Batch ${idx} failed`, e);
         return [];
       }
    });

    const results = await runner(CONCURRENCY, tasks);
    results.flat().forEach(i => prioritizedItems.push(i));

    // Sort
    const sorted = prioritizedItems.sort((a,b) => b.priorityScore - a.priorityScore);
    
    // Filter by Score Threshold
    const aboveThreshold = sorted.filter(item => item.priorityScore >= controls.triage.minInterestScore);
    
    // Hard Cutoff (Budget Control)
    const topN = aboveThreshold.slice(0, controls.triage.maxHydrationLimit);
    
    context.events.emit('progress', `[Triage] ${aboveThreshold.length} items > ${controls.triage.minInterestScore} score. Keeping top ${topN.length}.`);
    return topN;
  }
}
