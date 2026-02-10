#!/usr/bin/env node

/**
 * Multi-Agent Orchestrator
 *
 * Decides per task:
 * - useWorktree: true  → spawn in isolated git worktree
 * - useWorktree: false → spawn directly (fast, no overhead)
 */

import { task } from './task.js';
import {
  createWorktree,
  spawnInWorktree,
  collectFromWorktrees,
  updateStatus,
  readResult,
  removeWorktree
} from './worktree-manager.js';

// Default decision logic - can be overridden per task
const DEFAULT_NEEDS_WORKTREE = {
  // Tasks that modify files or need isolation
  'code-review': false,      // Just reads, no modification
  'code-modify': true,       // Will modify files
  'refactor': true,          // Will change code
  'write-file': true,        // Creates new files
  'security-audit': false,   // Read-only analysis
  'test-run': false,         // Just runs tests
  'build': false,            // Build output (safe)
  'debug': false,            // Investigation only
};

// Override default decision
const needsWorktree = (agentType, customFlag) => {
  if (customFlag !== undefined) return customFlag;
  return DEFAULT_NEEDS_WORKTREE[agentType] || false;
};

export async function orchestrate(taskConfig) {
  const {
    agentType,
    prompt,
    useWorktree,      // Optional override
    collectResults = true,
    timeout = 300000
  } = taskConfig;

  const agentId = `${agentType}-${Date.now()}`;
  const shouldUseWorktree = needsWorktree(agentType, useWorktree);

  console.log(`[Orchestrator] ${agentType} → worktree: ${shouldUseWorktree}`);

  if (shouldUseWorktree) {
    // SPAWN IN WORKTREE (isolated, version-controlled)
    try {
      const result = await spawnInWorktree(agentId, prompt, {
        timeout,
        onStatusChange: (status) => {
          console.log(`[${agentId}] ${status?.status}`);
        }
      });

      if (collectResults) {
        const fullResult = readResult(agentId);
        return { agentId, worktree: true, ...fullResult };
      }

      return { agentId, worktree: true, status: 'completed' };
    } catch (error) {
      return { agentId, worktree: true, status: 'failed', error: error.message };
    }
  } else {
    // SPAWN DIRECT (fast, no worktree)
    try {
      const result = await task({
        subagent_type: 'general',
        prompt,
        description: agentType
      });

      if (collectResults) {
        return { agentId, worktree: false, result: result };
      }

      return { agentId, worktree: false, status: 'launched' };
    } catch (error) {
      return { agentId, worktree: false, status: 'failed', error: error.message };
    }
  }
}

export async function orchestrateParallel(tasks) {
  // Launch all tasks in parallel
  const promises = tasks.map(taskConfig => orchestrate(taskConfig));
  return Promise.all(promises);
}

export async function collectAfterLaunch(launchResults) {
  // Collect results only from worktree-based tasks
  const worktreeTasks = launchResults
    .filter(r => r.worktree === true && r.status === 'launched')
    .map(r => r.agentId);

  if (worktreeTasks.length === 0) return [];

  return collectFromWorktrees(worktreeTasks);
}

export async function cleanup(agentId) {
  if (agentId) {
    await removeWorktree(agentId).catch(() => {});
  }
}

// CLI Usage
const args = process.argv.slice(2);
if (args[0] === 'spawn') {
  orchestrate({
    agentType: args[1],
    prompt: args.slice(2).join(' '),
    collectResults: true
  }).then(r => console.log(JSON.stringify(r, null, 2)));
} else if (args[0] === 'parallel') {
  // Usage: node orchestrator.js parallel '[{"agentType":"code-review","prompt":"..."}]'
  const tasks = JSON.parse(args[1]);
  orchestrateParallel(tasks).then(r => console.log(JSON.stringify(r, null, 2)));
} else if (args[0] === 'cleanup') {
  cleanup(args[1]).then(() => console.log('cleaned'));
} else {
  console.log(`
Multi-Agent Orchestrator

Decides per task:
  - useWorktree: true  → isolated worktree (safe, version-controlled)
  - useWorktree: false → direct spawn (fast)

Usage:
  node orchestrator.js spawn <agent-type> <prompt>
  node orchestrator.js parallel '[{"agentType":"code-review","prompt":"..."}]'
  node orchestrator.js cleanup <agent-id>

API:
  import { orchestrate, orchestrateParallel } from './orchestrator.js'

  // Single task
  await orchestrate({
    agentType: 'code-review',
    prompt: 'Review this code',
    useWorktree: false  // optional override
  })

  // Parallel tasks
  await orchestrateParallel([
    { agentType: 'code-review', prompt: 'Review A' },
    { agentType: 'security-audit', prompt: 'Audit B', useWorktree: true }
  ])
`);
}