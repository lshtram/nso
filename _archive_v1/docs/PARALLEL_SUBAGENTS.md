# Parallel Subagent System for OpenCode

A system for spawning isolated subagents with controlled MCPs, skills, and minimal context.

## Design Goals

1. **Clean Context** - No inherited parent agent context
2. **Explicit MCPs** - Each subagent only gets configured MCPs
3. **Explicit Skills** - Each subagent only loads configured skills
4. **Minimal Prompt** - Only the subagent's own prompt

## The Problem with Native `task()`

OpenCode's `task()` tool spawns subagents that **inherit context** from the parent agent:

- Parent's conversation history
- Parent's loaded MCPs (all of them)
- Parent's global settings

This is not isolated.

## Solution: Isolated Process Spawning

We spawn **separate OpenCode processes** that start with a completely clean slate.

## Directory Structure

```
.agents/
└── <subagent-name>/
    ├── agent.json       # Configuration: name, MCPs, skills
    ├── prompt.txt       # System prompt (no parent context)
    └── SKILL.md         # Documentation

docs/
└── PARALLEL_SUBAGENTS.md  # This file
```

## Creating a Subagent

### 1. `agent.json`

```json
{
  "name": "code-review",
  "description": "Security-focused code review",
  "mcp": ["filesystem"],
  "skills": ["security-audit", "pattern-enforcement"]
}
```

### 2. `prompt.txt`

```markdown
You are a CODE-REVIEW subagent.

## YOUR IDENTITY
You are a security-focused code reviewer.

## YOUR MCP ACCESS
You have access to:
- filesystem MCP (read files, write files)

## YOUR SKILLS
You must use:
- security-audit (vulnerability analysis)
- pattern-enforcement (code style)

## YOUR TASK
Review code for:
1. Security vulnerabilities
2. Code style violations
3. Performance problems

## RESPONSE
Greeting: "Hello! I'm the code-review subagent."
Code review: Structured analysis with line numbers.
```

## Spawning Isolated Subagents

### Single Subagent

```javascript
// Via run-isolated.js helper
node .agents/run-isolated.js config code-review "Review this code..."
```

Output is a clean `task()` config with no inherited context.

### Parallel Subagents

```javascript
const agents = await Promise.all([
  task(...spawn("code-review", "Review file A:\n\n" + codeA)),
  task(...spawn("code-review", "Review file B:\n\n" + codeB)),
  task(...spawn("code-review", "Review file C:\n\n" + codeC))
]);
```

Where `spawn()` is:

```javascript
function spawn(agentName, taskPrompt) {
  const config = JSON.parse(readFileSync(`.agents/${agentName}/agent.json`));
  const prompt = readFileSync(`.agents/${agentName}/prompt.txt`, 'utf-8');

  return {
    subagent_type: "general",
    prompt: `${prompt}\n\n## YOUR TASK NOW:\n${taskPrompt}`,
    description: agentName,
    load_skills: config.skills
  };
}
```

### True Process Isolation (Heavyweight)

For complete isolation with no shared state:

```javascript
import { spawn } from 'child_process';

function runIsolatedProcess(agentName, taskPrompt) {
  const taskConfig = spawn(agentName, taskPrompt);
  
  return new Promise((resolve, reject) => {
    const proc = spawn('opencode', ['task', JSON.stringify(taskConfig)], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`Exit ${code}`));
    });
  });
}

const results = await Promise.all([
  runIsolatedProcess("code-review", reviewA),
  runIsolatedProcess("code-review", reviewB),
  runIsolatedProcess("code-review", reviewC)
]);
```

## Context Isolation Guarantee

| Aspect | `task()` (shared) | Isolated Process |
|--------|-------------------|------------------|
| Parent history | Inherited | None |
| Parent MCPs | All loaded | Only configured |
| Parent skills | Inherited | Only specified |
| Memory | Shared | Fresh |
| Session | Parent's session | New session |

## Best Practices

1. **Keep prompts minimal** - Only what's needed for the task
2. **List MCPs explicitly** - Document which MCPs each subagent uses
3. **Load only needed skills** - Use `load_skills` parameter
4. **Use isolated processes** when true context isolation is required

## Available Subagents

| Name | Description | MCPs | Skills |
|------|-------------|------|--------|
| code-review | Security code review | filesystem | security-audit, pattern-enforcement |

## Adding a New Subagent

1. Create `.agents/<name>/agent.json`
2. Create `.agents/<name>/prompt.txt`
3. Use via `spawn()` or `runIsolatedProcess()`

## Files

- `.agents/run-isolated.js` - Helper for spawning isolated subagents
- `.agents/spawn.js` - Generate task config from agent definition
- `docs/PARALLEL_SUBAGENTS.md` - This documentation
