'use server';

import { getBrainProvider } from '../brain/factory';
import { UserIntelligence } from '../brain/user-intelligence';
import { AI_SEED_SOURCES } from '../pipeline/seed';
import { SourceEntity } from '@/types';

/**
 * Server Action to handle the Brain Discovery Chat.
 */
export async function discoveryChatAction(message: string, currentSources: SourceEntity[], weights?: Record<string, number>) {
  const brain = getBrainProvider();
  const intel = new UserIntelligence();
  
  const profile = await intel.getProfile();
  const library = await intel.getLibrarySummary(currentSources);
  const formattedWeights = weights ? Object.entries(weights).map(([k, v]) => `${k}:${v}%`).join(', ') : 'Default';
  
  const { response, tools } = await brain.chat(message, { profile: `${profile}\nCurrent Interests: ${formattedWeights}`, library });
  
  // Handle automatic tool execution for Profile Updates
  if (tools) {
    for (const tool of tools) {
      if (tool.action === 'UPDATE_PROFILE') {
        await intel.registerInsight(tool.insight);
      }
    }
  }
  
  return { response, tools };
}
