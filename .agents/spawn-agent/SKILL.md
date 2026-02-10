---
name: spawn-agent
description: Spawns configured subagents with custom MCPs, skills, and prompts
---

# SPAWN-AGENT SKILL

Spawns subagents with specific MCPs, skills, and prompts configured in `.agents/<name>/agent.json`.

## Usage

```javascript
spawn_agent("code-review", "Code to review:\n\n" + myCode)
```

## Creating a New Subagent

1. Create `.agents/<name>/agent.json`:
```json
{
  "name": "<name>",
  "description": "One-line description",
  "mcp": ["mcp1", "mcp2"],
  "skills": ["skill1", "skill2"],
  "prompt": "Your system prompt here..."
}
```

2. Use it:
```javascript
spawn_agent("<name>", "Task description...")
```

## Available Subagents

| Name | Description | MCPs | Skills |
|------|-------------|------|--------|
| code-review | Security code review | filesystem | security-audit, pattern-enforcement |
