'use server';

import { IngestionOrchestratorV2 } from '../pipeline/orchestrator_v2';
import { AI_SEED_SOURCES } from '../pipeline/seed';
import { getActiveBrainName } from '../brain/factory';
import { updatePipelineStatus } from './status';
import { StoryCluster, SourceEntity, SteeringContext } from '@/types';

/**
 * Server Action to trigger the news ingestion pipeline.
 */
export async function getAggregatedNews(
  weights: Record<string, number>, 
  forceRefresh = false, 
  persona?: string, 
  sources?: SourceEntity[]
): Promise<{ clusters: StoryCluster[], dailySummary: any, activeBrain: string }> {
  await updatePipelineStatus("STAGE:1:Pipeline Initiated (V2)...", false);
  const orchestrator = new IngestionOrchestratorV2();
  const activeBrain = getActiveBrainName();
  const targetSources = sources || AI_SEED_SOURCES;

  const context: SteeringContext = {
    globalStrategy: 'Editorial Focus',
    persona,
    parameters: { interests: weights }
  };

  let lastStage = "1";
  try {
    const { clusters, dailySummary } = await orchestrator.runIngestion(
      targetSources, 
      context, 
      { forceRefresh: forceRefresh },
      (msg) => {
        const stageMatch = msg.match(/STAGE:(\d+):/);
        if (stageMatch) {
          lastStage = stageMatch[1];
          updatePipelineStatus(msg, false);
        } else {
          updatePipelineStatus(`STAGE:${lastStage}:${msg}`, false);
        }
      }
    );
    
    const optimizedResults = clusters.map(cluster => {
      const truncatedItems = cluster.items.slice(0, 3).map(item => ({
        ...item,
        embedding: undefined 
      }));

      return {
        ...cluster,
        items: truncatedItems,
        topItems: truncatedItems
      };
    });

    return { 
      clusters: JSON.parse(JSON.stringify(optimizedResults)),
      dailySummary: JSON.parse(JSON.stringify(dailySummary)),
      activeBrain
    };
  } catch (error) {
    console.error('[Action] Pipeline Error:', error);
    throw new Error('Failed to fetch news from the pipeline.');
  }
}
