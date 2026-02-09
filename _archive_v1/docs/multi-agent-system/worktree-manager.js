#!/usr/bin/env node
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const WORKTREES_DIR = '.worktrees';
const MESSAGES_DIR = 'messages';
const RESULT_FILE = 'result.json';
const STATUS_FILE = 'status.json';

function getWorktreePath(agentId) {
  return join(WORKTREES_DIR, agentId);
}

function runGit(...args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd: process.cwd() });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`git ${args.join(' ')}: ${stderr}`));
    });
  });
}

export async function createWorktree(agentId) {
  const worktreePath = getWorktreePath(agentId);
  const branch = `wt-${agentId}`;

  if (existsSync(worktreePath)) {
    return worktreePath;
  }

  await runGit('checkout', '-b', branch).catch(() => {});
  await runGit('worktree', 'add', worktreePath, branch);
  mkdirSync(join(worktreePath, MESSAGES_DIR), { recursive: true });

  writeFileSync(
    join(worktreePath, STATUS_FILE),
    JSON.stringify({ status: 'created', agentId, timestamp: Date.now() }, null, 2)
  );

  return worktreePath;
}

export async function removeWorktree(agentId) {
  const worktreePath = getWorktreePath(agentId);
  if (existsSync(worktreePath)) {
    await runGit('worktree', 'remove', worktreePath, '--force');
  }
}

export function writeResult(agentId, result) {
  const resultPath = join(getWorktreePath(agentId), RESULT_FILE);
  writeFileSync(resultPath, JSON.stringify(result, null, 2));

  runGit('add', RESULT_FILE).catch(() => {});
  runGit('commit', `-m`, `Result: ${agentId}`, '--', RESULT_FILE).catch(() => {});

  return resultPath;
}

export function readResult(agentId) {
  const resultPath = join(getWorktreePath(agentId), RESULT_FILE);
  if (!existsSync(resultPath)) return null;
  return JSON.parse(readFileSync(resultPath, 'utf-8'));
}

export function updateStatus(agentId, status) {
  const statusPath = join(getWorktreePath(agentId), STATUS_FILE);
  const current = existsSync(statusPath) ? JSON.parse(readFileSync(statusPath, 'utf-8')) : {};
  const updated = { ...current, status, updatedAt: Date.now() };
  writeFileSync(statusPath, JSON.stringify(updated, null, 2));
  return updated;
}

export function getWorktreeStatus(agentId) {
  const statusPath = join(getWorktreePath(agentId), STATUS_FILE);
  if (!existsSync(statusPath)) return null;
  return JSON.parse(readFileSync(statusPath, 'utf-8'));
}

export async function spawnInWorktree(agentId, taskPrompt, options = {}) {
  const { timeout = 300000, onStatusChange } = options;

  await createWorktree(agentId);
  updateStatus(agentId, 'running');

  const worktreePath = getWorktreePath(agentId);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const proc = spawn('opencode', ['task', taskPrompt], {
      cwd: worktreePath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);

    const interval = setInterval(() => {
      const status = getWorktreeStatus(agentId);
      if (onStatusChange) onStatusChange(status);
    }, 1000);

    proc.on('close', async code => {
      clearInterval(interval);
      const result = { agentId, exitCode: code, stdout, stderr, duration: Date.now() - startTime };
      writeResult(agentId, result);
      updateStatus(agentId, code === 0 ? 'completed' : 'failed');
      code === 0 ? resolve(result) : reject(new Error(stderr));
    });

    setTimeout(() => {
      proc.kill();
      updateStatus(agentId, 'timeout');
      reject(new Error('timeout'));
    }, timeout);
  });
}

export function collectFromWorktrees(agentIds) {
  const results = {};
  for (const id of agentIds) {
    results[id] = { result: readResult(id), status: getWorktreeStatus(id) };
  }
  return results;
}

export async function pullFromWorktrees(agentIds) {
  for (const id of agentIds) {
    const path = getWorktreePath(id);
    if (existsSync(path)) {
      try {
        await runGit('pull', '.', { cwd: path }).catch(() => {});
      } catch {}
    }
  }
}

const args = process.argv.slice(2);
if (args[0] === 'create') {
  createWorktree(args[1]).then(p => console.log(p));
} else if (args[0] === 'spawn') {
  spawnInWorktree(args[1], args.slice(2).join(' '))
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => console.error(e.message));
} else if (args[0] === 'status') {
  console.log(JSON.stringify(getWorktreeStatus(args[1]), null, 2));
} else if (args[0] === 'collect') {
  console.log(JSON.stringify(collectFromWorktrees(args.slice(1)), null, 2));
} else if (args[0] === 'remove') {
  removeWorktree(args[1]);
} else {
  console.log(`
Worktree Manager - OPTIONAL isolation layer

Usage:
  node worktree-manager.js create <id>   Create worktree
  node worktree-manager.js spawn <id> <task>  Spawn in worktree
  node worktree-manager.js status <id>   Get status
  node worktree-manager.js collect <ids> Collect results
  node worktree-manager.js remove <id>   Remove worktree

API:
  import {
    createWorktree, spawnInWorktree, writeResult,
    readResult, collectFromWorktrees, pullFromWorktrees
  } from './worktree-manager.js'
`);
}