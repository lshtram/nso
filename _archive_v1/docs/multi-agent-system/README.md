# Multi-Agent Orchestration System

A lightweight framework for spawning isolated OpenCode subagents with optional git worktree isolation and async result collection.

## Quick Start

```bash
# 1. Copy this entire directory to your new project
cp -r /path/to/multi-agent-system /your-new-project/

# 2. Create the agents directory
mkdir -p /your-new-project/.agents

# 3. Copy core files
cp multi-agent-system/orchestrator.js /your-new-project/.agents/
cp multi-agent-system/spawn.js /your-new-project/.agents/
cp multi-agent-system/worktree-manager.js /your-new-project/.agents/

# 4. Create your first agent
mkdir -p /your-new-project/.agents/code-review
# (copy agent.json and prompt.txt from multi-agent-system/examples/code-review/)

# 5. Run
cd /your-new-project
node .agents/orchestrator.js spawn code-review "Review this code"
```

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Creating Subagents](#creating-subagents)
5. [Spawning Agents](#spawning-agents)
6. [Worktree Isolation](#worktree-isolation)
7. [Async Patterns](#async-patterns)
8. [Reference](#reference)

---

## Overview

This system allows you to:

- Spawn OpenCode subagents from within an agent
- Run agents in parallel
- Decide per-task whether to use git worktree isolation
- Collect results asynchronously
- Keep all work version-controlled (optional)

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| Quick code review | Direct spawn (no worktree) |
| Security audit | Direct spawn |
| Code modifications | Worktree spawn |
| Refactoring | Worktree spawn |
| Parallel analysis | Mix of both |

---

## Architecture

```
Your Project/
├── .agents/                    # Agent configurations
│   ├── orchestrator.js         # Main orchestration logic
│   ├── spawn.js                # Task config generator
│   ├── worktree-manager.js     # Optional worktree isolation
│   └── <agent-name>/           # Individual agent configs
│       ├── agent.json          # MCPs, skills, description
│       └── prompt.txt          # System prompt
└── .worktrees/                 # Created automatically when needed
    ├── <agent-id>/             # Isolated worktree
    │   ├── status.json
    │   └── result.json
    └── ...
```

### Two Spawn Modes

**1. Direct Spawn (Fast)**
```
Task → Orchestrator → opencode task → Result
```
- No worktree overhead
- No version control
- Process isolation only

**2. Worktree Spawn (Safe)**
```
Task → Orchestrator → Create Worktree → opencode task → Commit Result
```
- Filesystem isolation
- Version controlled
- Slower (~500ms setup)

---

## Core Components

### 1. orchestrator.js

Decides spawn mode and manages execution.

**API:**

```javascript
import { orchestrate, orchestrateParallel } from './orchestrator.js'

// Single task
const result = await orchestrate({
  agentType: 'code-review',
  prompt: 'Review this code',
  useWorktree: false,        // Optional override
  collectResults: true,
  timeout: 300000
})

// Parallel tasks
const results = await orchestrateParallel([
  { agentType: 'code-review', prompt: 'Review A' },
  { agentType: 'security-audit', prompt: 'Audit B', useWorktree: true },
  { agentType: 'test-run', prompt: 'Run tests C' }
])
```

**Default Decision Table:**

| Agent Type | Worktree? | Reason |
|------------|-----------|--------|
| `code-review` | ❌ No | Read-only |
| `security-audit` | ❌ No | Read-only |
| `test-run` | ❌ No | No mods |
| `build` | ❌ No | Safe |
| `debug` | ❌ No | Investigation |
| `code-modify` | ✅ Yes | Modifies files |
| `refactor` | ✅ Yes | Changes code |
| `write-file` | ✅ Yes | Creates files |

### 2. spawn.js

Generates task configuration for direct spawning.

**CLI:**
```bash
node .agents/spawn.js code-review "Review this code"
# Outputs task config JSON
```

**API:**
```javascript
import { spawn } from './spawn.js'

const config = spawn('code-review', 'Review this code')
// Returns: { subagent_type, prompt, description, load_skills }
```

### 3. worktree-manager.js

Optional - only used when `useWorktree: true`.

**API:**
```javascript
import {
  createWorktree,      // Create isolated worktree
  spawnInWorktree,     // Spawn in worktree
  writeResult,         // Write + commit result
  readResult,          // Read committed result
  collectFromWorktrees, // Collect multiple
  removeWorktree       // Cleanup
} from './worktree-manager.js'

// Create worktree
await createWorktree('review-1')  // → .worktrees/review-1/

// Spawn in worktree
await spawnInWorktree('review-1', 'Review this', {
  timeout: 300000,
  onStatusChange: (s) => console.log(s.status)
})

// Read result
const result = readResult('review-1')

// Collect multiple
const all = collectFromWorktrees(['review-1', 'review-2'])
```

---

## Creating Subagents

### Directory Structure

```
.agents/
└── <agent-name>/
    ├── agent.json       # Configuration (required)
    ├── prompt.txt       # System prompt (required)
    └── SKILL.md         # Documentation (optional)
```

### 1. agent.json

```json
{
  "name": "code-review",
  "description": "Security-focused code review assistant",
  "mcp": ["filesystem"],
  "skills": ["security-audit", "pattern-enforcement"],
  "useWorktree": false
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Agent identifier |
| `description` | string | Yes | One-line description |
| `mcp` | array | No | List of MCPs (documented in prompt) |
| `skills` | array | No | Skills to load |
| `useWorktree` | boolean | No | Override default spawn mode |

### 2. prompt.txt

```markdown
You are a CODE-REVIEW subagent.

## YOUR IDENTITY
You are a security-focused code reviewer.

## YOUR MCP ACCESS
You have access to:
- filesystem MCP (read files, write files)

## YOUR SKILLS
You must use:
- security-audit skill (for vulnerability analysis)
- pattern-enforcement skill (for code style)

## YOUR TASK
Review code for:
1. Security vulnerabilities
2. Code style violations
3. Performance problems

## RESPONSE
Greeting: "Hello! I'm the code-review subagent."
Code review: Structured analysis with line numbers.
```

### 3. Example: code-review agent

```
.agents/code-review/
├── agent.json:
```json
{
  "name": "code-review",
  "description": "Security-focused code review",
  "mcp": ["filesystem"],
  "skills": ["security-audit", "pattern-enforcement"]
}
```

└── prompt.txt:
```markdown
You are a CODE-REVIEW subagent.

## YOUR IDENTITY
You are a security-focused code reviewer.

## YOUR MCP ACCESS
You have access to:
- filesystem MCP (read files, write files)

## YOUR SKILLS
You must use:
- security-audit skill (for vulnerability analysis)
- pattern-enforcement skill (for code style)

## YOUR TASK
Review code for:
1. Security vulnerabilities (injection, auth issues, secrets)
2. Code style violations
3. Performance problems
4. Bug detection

## OUTPUT FORMAT
- Issue description
- Line number
- Severity (high/medium/low)
- Suggested fix

## RESPONSE
When asked just to say hello, respond: "Hello! I'm the code-review subagent."
When reviewing code, provide structured analysis.
```

---

## Spawning Agents

### 1. Single Agent

```javascript
import { orchestrate } from './orchestrator.js'

const result = await orchestrate({
  agentType: 'code-review',
  prompt: 'Review src/app/page.tsx'
})

console.log(result.result)
```

### 2. Parallel Agents

```javascript
import { orchestrateParallel } from './orchestrator.js'

const results = await orchestrateParallel([
  { agentType: 'code-review', prompt: 'Review file A' },
  { agentType: 'security-audit', prompt: 'Audit file B' },
  { agentType: 'code-review', prompt: 'Review file C' }
])

for (const r of results) {
  console.log(r.agentId, r.status)
}
```

### 3. With Worktree Override

```javascript
// Force worktree for a read-only task (e.g., for version control)
const result = await orchestrate({
  agentType: 'code-review',
  prompt: 'Review and save report',
  useWorktree: true  // Force worktree
})
```

### 4. Direct spawn() Usage

```javascript
import { spawn } from './spawn.js'

// Generate config, then use task() manually
const config = spawn('code-review', 'Hello!')
task(config.subagent_type, config.prompt, config.description)
  .then(r => console.log(r))
```

### 5. CLI Usage

```bash
# Direct spawn
node .agents/spawn.js code-review "Review src/app/page.tsx"

# Orchestrator with worktree
node .agents/orchestrator.js spawn code-review "Review this"

# Orchestrator parallel
node .agents/orchestrator.js parallel '[{"agentType":"code-review","prompt":"A"}]'

# Worktree management
node .agents/worktree-manager.js create review-1
node .agents/worktree-manager.js status review-1
node .agents/worktree-manager.js collect review-1 review-2
node .agents/worktree-manager.js remove review-1
```

---

## Worktree Isolation

### Why Use Worktrees?

| Benefit | Description |
|---------|-------------|
| **Isolation** | Agent can't touch main files |
| **Version control** | All work auto-committed |
| **Safe rollback** | Revert via git |
| **Parallel commits** | No branch conflicts |
| **Offline work** | Worktrees are independent |

### When to Use

- **Code modifications** - Changes are tracked
- **Refactoring** - Easy to undo
- **Experiments** - Safe to try things
- **Multi-file changes** - Atomic commits

### When NOT to Use

- **Quick reviews** - Overhead not worth it
- **Read-only analysis** - Direct spawn is faster
- **Debug/investigation** - No file changes

### Worktree Lifecycle

```javascript
import {
  createWorktree,
  spawnInWorktree,
  readResult,
  removeWorktree
} from './worktree-manager.js'

// 1. Create
await createWorktree('experiment-1')
// → Creates .worktrees/experiment-1/

// 2. Spawn
await spawnInWorktree('experiment-1', 'Refactor this function')

// 3. Result is auto-committed
const result = readResult('experiment-1')
// → { summary, issues, suggestions, ... }

// 4. Main can pull/merge
// git pull .worktrees/experiment-1

// 5. Cleanup (optional - worktrees persist)
await removeWorktree('experiment-1')
```

### Handoff Pattern

```javascript
// In main agent - pull results from worktrees
import { collectFromWorktrees, pullFromWorktrees } from './worktree-manager.js'

// Pull latest commits
await pullFromWorktrees(['experiment-1'])

// Collect results
const results = collectFromWorktrees(['experiment-1'])

// Merge into main (if needed)
await runGit('merge', '.worktrees/experiment-1')
```

---

## Async Patterns

### Pattern 1: Non-Blocking Spawn

```javascript
function spawnAsync(agentType, prompt, outputFile) {
  // Spawn detached - returns immediately
  const proc = spawn('node', [
    'orchestrator.js', 'spawn', agentType, prompt
  ], { detached: true, stdio: 'ignore' });

  proc.unref();  // Detach from parent
  return outputFile;  // Caller polls this file
}

// Usage
const files = [
  spawnAsync('code-review', taskA, '/tmp/result-a.json'),
  spawnAsync('code-review', taskB, '/tmp/result-b.json')
];

// Continue immediately
user.sendMessage("Started 2 reviewers...");
```

### Pattern 2: Promise-Based (Recommended)

```javascript
import { orchestrate } from './orchestrator.js'

// Promise resolves when done
const result = await orchestrate({
  agentType: 'code-review',
  prompt: 'Review this'
});

// Can do other work while waiting
user.sendMessage("Reviewing...");
doOtherThing();
const review = await result;  // Wait when needed
```

### Pattern 3: Parallel with Mixed Modes

```javascript
import { orchestrateParallel } from './orchestrator.js'

const results = await orchestrateParallel([
  // Direct spawn (fast)
  { agentType: 'code-review', prompt: 'Review A' },
  { agentType: 'security-audit', prompt: 'Audit B' },
  // Worktree (safe)
  { agentType: 'refactor', prompt: 'Refactor C', useWorktree: true },
  { agentType: 'code-modify', prompt: 'Fix D', useWorktree: true }
])

// All complete here
processResults(results)
```

### Pattern 4: Polling for Progress

```javascript
import { collectFromWorktrees } from './worktree-manager.js'

async function waitForCompletion(agentIds, interval = 1000) {
  while (true) {
    const statuses = collectFromWorktrees(agentIds);
    const allDone = Object.values(statuses)
      .every(s => s.status?.status === 'completed' ||
                  s.status?.status === 'failed');

    if (allDone) break;
    await sleep(interval);
  }
  return collectFromWorktrees(agentIds);
}

// Usage
const results = await waitForCompletion(['review-1', 'refactor-1']);
```

---

## Reference

### orchestrator.js Options

```javascript
await orchestrate({
  agentType: string,      // Agent name (required)
  prompt: string,         // Task prompt (required)
  useWorktree: boolean,   // Override default (optional)
  collectResults: boolean,// Collect result (default: true)
  timeout: number         // ms (default: 300000)
})
```

### spawn.js Returns

```javascript
{
  subagent_type: "general",
  prompt: "...",          // Full prompt with config
  description: "code-review",
  load_skills: ["security-audit", "pattern-enforcement"]
}
```

### Result Structure

```javascript
{
  agentId: "code-review-1704067200000",
  worktree: false,        // true if worktree mode
  status: "completed",    // or "failed"
  result: "...",          // Agent's response
  duration: 15000,        // ms
  completedAt: 1704067215000
}
```

### Worktree Result Structure

```javascript
{
  agentId: "code-modify-1704067200000",
  worktree: true,
  status: "completed",
  result: {
    summary: "Fixed 3 bugs",
    changes: [...],
    filesModified: ["src/a.ts", "src/b.ts"]
  },
  duration: 45000,
  completedAt: 1704067245000
}
```

### Error Handling

```javascript
try {
  const result = await orchestrate({ ... });
  if (result.status === 'failed') {
    console.error('Agent failed:', result.error);
  } else {
    console.log('Success:', result.result);
  }
} catch (error) {
  console.error('Orchestrator error:', error.message);
}
```

---

## File Inventory

All files needed for this system:

```
multi-agent-system/
├── README.md                          # This file
├── orchestrator.js                    # Main orchestration
├── spawn.js                           # Task config generator
├── worktree-manager.js                # Optional worktree support
├── examples/
│   └── code-review/
│       ├── agent.json
│       └── prompt.txt
└── templates/
    ├── agent-json.template.json
    └── prompt.template.txt
```

### Copy to New Project

```bash
cp -r multi-agent-system/* /your-project/.agents/
cp multi-agent-system/orchestrator.js /your-project/.agents/
cp multi-agent-system/spawn.js /your-project/.agents/
cp multi-agent-system/worktree-manager.js /your-project/.agents/

# Create agent
mkdir -p /your-project/.agents/code-review
cp multi-agent-system/examples/code-review/* /your-project/.agents/code-review/

# Run
cd /your-project
node .agents/orchestrator.js spawn code-review "Hello"
```

---

## Comparison with Other Frameworks

| Feature | Our System | Gastown | AutoGen | CrewAI |
|---------|-----------|---------|---------|--------|
| OpenCode-native | ✅ | ✅ | ❌ | ❌ |
| Optional isolation | ✅ | ❌ | ❌ | ❌ |
| True filesystem isolation | ✅ | ✅ | ❌ | ❌ |
| Async spawn | ✅ | ✅ | ✅ | ✅ |
| Version control | Optional | Built-in | ❌ | ❌ |
| Dependencies | None | Go, git | Python | Python |
| Setup complexity | Low | High | Medium | Medium |

---

## Troubleshooting

### "Agent not found"

Ensure `agent.json` exists in `.agents/<agent-type>/`

### "Worktree already exists"

Worktrees persist. Remove with:
```bash
node .agents/worktree-manager.js remove <agent-id>
```

### "git worktree not supported"

Upgrade git to 2.25+ or use direct spawn mode.

### "timeout" errors

Increase timeout or check if agent is stuck.

---

## License

MIT - Use freely in any project.