# Converting Claude Code Sub-Agents to Skills

This document provides detailed guidance on converting existing Claude Code sub-agent configurations to the Skills format.

## Essential Reading

- **Sub-Agents Overview**: [docs.claude.com/.../sub-agents.md](https://docs.claude.com/en/docs/claude-code/sub-agents.md)
- **Agent Skills Overview**: [docs.claude.com/.../overview.md](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview.md)

## Understanding the Differences

### Sub-Agent Configuration (Legacy)

- Invoked explicitly via `Task` tool.
- Operates in separate context.
- Description explains WHAT it does.

### Skill Configuration (Modern)

- Invoked automatically by context matching.
- Description determines WHEN to invoke (Triggers).
- No model/tools restrictions (inherits all CLI capabilities).
- Supports multi-file organization.

## Key Transformation Steps

### 1. Description Transformation (CRITICAL)

- **Sub-Agent**: "Reviews code quality."
- **Skill**: "Use this skill when reviewing code for quality issues, security vulnerabilities... Invoke when users mention PRs, audits, or code validation."

### 2. Name Transformation

- Use gerund form: `debugging-applications` instead of `debugger`.

### 3. Content Transformation

- **Preserve**: Expertise, methodology, examples.
- **Enhance**: Validation steps, CLI tooling, progressive disclosure.
- **Remove**: `model:` and `tools:` fields.

## Conversion Example: Code Reviewer

[Detailed example transformation here...]

- Name: `code-reviewer` -> `reviewing-code`
- Description: Focus on triggers (PRs, security audits, etc.).
- Structure: Add specific CLI commands (`gh pr diff`).

## Conversion Checklist

- [ ] Choose gerund-form name.
- [ ] Write "Use this skill when..." description.
- [ ] Remove legacy YAML fields.
- [ ] Emphasize CLI and Node.js (not Python).
- [ ] Move details to supporting files.
