---
name: code-review
description: Security-focused code review - uses filesystem MCP, security-audit and pattern-enforcement skills
---

# CODE-REVIEW SUBAGENT

**Purpose:** Security-focused code review

**Configuration:**
- **MCPs:** filesystem
- **Skills:** security-audit, pattern-enforcement

**Prompt:** Security-focused reviewer with style enforcement

**Usage:**
```javascript
// Use the spawn-agent tool with config path
spawn_agent(".agents/code-review/agent.json", "Your code to review here")
```

**Available Subagents:**
| Name | Description | MCPs | Skills |
|------|-------------|------|--------|
| code-review | Security code review | filesystem | security-audit, pattern-enforcement |
