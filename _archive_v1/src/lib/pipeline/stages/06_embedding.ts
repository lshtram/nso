
import { PipelineContext, PipelineControlParams, PipelineStage, HydratedItem } from '../types';
import { getBrainProvider } from '../../brain/factory';

export class EmbeddingStage implements PipelineStage<HydratedItem[], HydratedItem[]> {
  name = 'Stage 6: Semantic Embedding';
  description = 'Generates vector embeddings for clustering.';

  summary = 'Vector embedding of hydrated content.';

  constructor(private brain = getBrainProvider()) {}

  async run(
    input: HydratedItem[], 
    controls: PipelineControlParams, 
    context: PipelineContext
  ): Promise<HydratedItem[]> {
    const embedded: HydratedItem[] = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < input.length; i += BATCH_SIZE) {
        if (context.signal.aborted) break;
        const batch = input.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (item) => {
            try {
                // Combine Title + Summary for efficient embedding
                // Full text might be too long for some models
                const textToEmbed = `${item.title} ${item.summary || ''}`;
                item.embedding = await this.brain.embed(textToEmbed);
                embedded.push(item);
            } catch (e) {
                console.error(`[Embedding] Failed for ${item.title}`, e);
            }
        }));
        
        context.events.emit('progress', `[Embedding] Processed ${embedded.length}/${input.length}`);
    }
    
    return embedded;
  }
}
