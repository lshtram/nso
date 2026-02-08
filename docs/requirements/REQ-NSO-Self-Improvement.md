# Requirements: NSO Self-Improvement Automation

**Feature ID:** REQ-NSO-Self-Improvement
**Status:** DRAFT (Discovery - Simplified)
**Version:** 0.4.0
**Date:** 2026-02-07

## 1. Background

NSO already has a complete session log that captures everything:
- Every tool call + result
- Every MCP call + result
- Every agent message (decisions)
- Every validation output
- Every gate check

**Problem:** We have all the data, but nobody analyzes it for patterns.

**Solution:** Janitor analyzes the session log at key points to identify patterns, Librarian implements at Closure.

## 2. Core Principle

**"Don't log everything twice. Analyze what we already have."**

```
❌ Old: Create new loggers for every event type
✅ New: Use existing session log, add pattern analysis layer
```

## 3. What Gets Analyzed (Already Logged)

| Log Content | Example | Pattern Detection |
|------------|---------|-------------------|
| Tool calls | `write file.py - success` | Repeated failures |
| MCP calls | `mcp_github.create_issue - failure` | MCP issues |
| Agent messages | "I'll use DEBUG workflow" | Decision patterns |
| Validation | `lint - failure [F401]` | Validation patterns |
| Gate checks | `DISCOVERY_APPROVAL - fail` | Gate failure patterns |

## 4. Architecture

### 4.1 Complete Session Log (Existing)
- **File:** `.opencode/logs/session.log` (or equivalent)
- **Content:** Everything - tool calls, MCP calls, agent messages, validation, gates
- **Format:** Text or JSON - readable by Janitor

### 4.2 Janitor Pattern Analysis (New)
- **Trigger:** Periodic (every N actions) OR Event-based (3+ failures, bypass, gate fail)
- **Input:** Complete session log
- **Output:** `pending_patterns.json` with pattern candidates

```json
{
  "timestamp": "2026-02-07T10:00:00Z",
  "analysis_trigger": "3 identical failures",
  "patterns": [
    {
      "type": "repeated_failure",
      "description": "Tool 'npm install' failed 3 times in /frontend",
      "evidence": ["log entries 1-3"],
      "severity": "medium",
      "recommendation": "Add to patterns.md - Run npm install from project root"
    },
    {
      "type": "bypass",
      "description": "Agent bypassed MCP 3 times, used manual curl",
      "evidence": ["log entries 4-6"],
      "severity": "critical",
      "recommendation": "Flag for user - MCP not working, investigate?"
    }
  ]
}
```

### 4.3 Librarian Implementation (Closure Phase)
- **Input:** `pending_patterns.json`
- **Process:**
  1. Review each pattern
  2. Categorize: Agent-specific | General | Dangerous bypass
  3. Implement:
     - Agent-specific → Update agent prompt/skill
     - General → Update patterns.md Gotchas
     - Dangerous → Flag for user review
  4. Notify user of new patterns
  5. Archive processed patterns

## 5. Pattern Types to Detect

### 5.1 Repeated Failures
```
Detection: Same tool failed 3+ times
Example: npm install failing in /frontend
Action: patterns.md - "Run npm install from project root"
```

### 5.2 MCP Bypasses (Dangerous!)
```
Detection: Agent skips MCP, uses manual alternative
Example: "MCP failed, using curl instead"
Action: Flag for user - "MCP consistently failing, investigate?"
```

### 5.3 Validation Patterns
```
Detection: Same validation error recurring
Example: F401 (unused import) occurring frequently
Action: patterns.md - "Always remove unused imports before committing"
```

### 5.4 Gate Failure Patterns
```
Detection: Same gate failing repeatedly
Example: DISCOVERY_APPROVAL failing (missing requirements)
Action: patterns.md - "Always get user sign-off before Architecture"
```

### 5.5 Agent Decision Patterns
```
Detection: Agent making unusual workflow choices
Example: Always choosing DEBUG for feature work
Action: May indicate agent prompt needs adjustment
```

## 6. Non-Goals

- No new logging infrastructure (use existing session log)
- No real-time pattern detection (analyze at triggers)
- No automatic code fixes
- No cross-repository pattern sharing
- No LLM tokens for logging (passive analysis only)

## 7. Acceptance Criteria

1. [ ] Janitor can parse complete session log
2. [ ] Pattern detection triggers on: 3+ failures, bypass, gate fail
3. [ ] pending_patterns.json generated in specified format
4. [ ] Librarian reviews at Closure phase
5. [ ] Agent-specific patterns → Agent prompts (not patterns.md)
6. [ ] General patterns → patterns.md Gotchas section
7. [ ] Dangerous bypasses → Flagged for user review
8. [ ] User notified of new patterns

## 8. Implementation Plan

### Phase 1: Pattern Detection
- Write Janitor skill: `session_log_analyzer.py`
- Parse existing session log
- Detect: repeated failures, bypasses, gate failures
- Output: pending_patterns.json

### Phase 2: Librarian Integration
- Update Closure phase to include pattern review
- Implement pattern categorization
- Add pattern implementation workflow

### Phase 3: Triggers
- Trigger on: 3+ identical failures
- Trigger on: Any bypass detected
- Trigger on: Gate failure
- Trigger on: Periodic (every 50 actions)

## 9. Open Questions

- [ ] Where is the complete session log currently stored?
- [ ] What format is the session log? (JSON? Text?)
- [ ] Should pattern analysis run at every Closure or periodically?
- [ ] Should user be notified immediately of dangerous bypasses?

## 10. Related Work

- REQ-NSO-Memory-Architecture.md (memory system)
- AGENTS.md (agent prompts for agent-specific patterns)
- patterns.md (existing pattern storage)
- Session log infrastructure (existing, need to identify)

---

## Appendix: Simplified Data Flow

```
Complete Session Log (EXISTING)
      ↓
Janitor: Parse & Detect Patterns (NEW)
      ↓
pending_patterns.json (NEW)
      ↓
Librarian: Review & Implement (EXISTING Closure Phase)
      ↓
patterns.md (UPDATED) OR Agent Prompts (UPDATED) OR User Flagged
```

---

**Key Insight from User:**
>"Just keep the complete session log. The Janitor analyzes it for patterns. Librarian implements at Closure. No extra logging infrastructure needed."

**This dramatically simplifies the implementation:**
- No profiler.py enhancement
- No mcp_logger.py
- No decision_logger.py
- No bypass_detector.py
- Just: Session log + Janitor analysis + Librarian implementation
