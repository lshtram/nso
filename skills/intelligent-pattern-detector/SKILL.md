# Intelligent Pattern Detector Skill

**Agent:** Janitor  
**Phase:** Self-Improvement / Closure  
**Input:** `.opencode/logs/session.json` (raw session messages)  
**Output:** Pattern analysis in `.opencode/logs/pattern_candidates.json`  

---

## Purpose

Analyze OpenCode session messages to identify **meaningful patterns** that indicate areas for system improvement. Unlike simple rule-based detection (e.g., "consecutive build calls"), this skill uses LLM understanding to:

1. **Classify patterns** - What's a real issue vs. normal development?
2. **Infer intent** - Why did the agent do this?
3. **Suggest improvements** - What should change?
4. **Provide evidence** - Show the actual messages

---

## Pattern Categories

### Real Issues (Require Attention)
- **Repeated failures** - Same error 3+ times
- **Tool errors** - Consistent tool failures
- **Context loss** - Forgetting requirements mid-workflow
- **Validation gaps** - Missing tests or checks
- **Workflow violations** - Skipping required gates

### Development Patterns (Normal, Don't Flag)
- **Rapid iterations** - Consecutive build calls during feature development
- **Exploration** - Trying different approaches
- **Refactoring** - Multiple changes to same file
- **Learning** - Initial implementation attempts

### System Health Indicators
- **Model performance** - Response times, error rates
- **Agent effectiveness** - Which agents succeed/fail most
- **Session duration** - Long vs. short sessions
- **Time patterns** - Work boundaries, gaps

---

## Examples for LLM Learning

### Example 1: Real Issue - Context Loss
```json
{
  "messages": [
    {"agent": "Oracle", "action": "Defined requirements for REQ-Feature.md"},
    {"agent": "Builder", "action": "Started implementation"},
    {"agent": "Builder", "action": "Implemented feature WITHOUT reading requirements"},
    {"agent": "Janitor", "action": "Found missing requirements in final validation"}
  ],
  "pattern": "context_loss",
  "severity": "high",
  "description": "Builder forgot requirements mid-workflow",
  "evidence": "No references to REQ-Feature.md during implementation phase",
  "suggestion": "Add gate: 'Verify requirements read before implementation'"
}
```

### Example 2: Development Pattern - Rapid Iterations
```json
{
  "messages": [
    {"agent": "build", "action": "Implement feature"},
    {"agent": "build", "action": "Fix test failure"},
    {"agent": "build", "action": "Refactor for clarity"},
    {"agent": "build", "action": "Add edge case"},
    {"agent": "build", "action": "Final polish"}
  ],
  "pattern": "rapid_iteration",
  "severity": "info",
  "description": "Normal iterative development during feature implementation",
  "evidence": "5 consecutive build calls, each improving the feature",
  "suggestion": "This is healthy development - no action needed"
}
```

### Example 3: Real Issue - Missing Validation
```json
{
  "messages": [
    {"agent": "Builder", "action": "Implemented feature"},
    {"agent": "Builder", "action": "Moved to Closure WITHOUT running tests"}
  ],
  "pattern": "validation_gap",
  "severity": "high", 
  "description": "Skipped validation phase before Closure",
  "evidence": "No test execution or validation output found",
  "suggestion": "Add gate: 'Validation must pass before Closure'"
}
```

### Example 4: System Health - Model Performance
```json
{
  "messages": [
    {"agent": "Oracle", "model": "claude-sonnet-4.5", "duration_minutes": 0.5},
    {"agent": "Builder", "model": "claude-sonnet-4.5", "duration_minutes": 8.5},
    {"agent": "Oracle", "model": "claude-sonnet-4.5", "duration_minutes": 0.3}
  ],
  "pattern": "model_performance",
  "severity": "info",
  "description": "Builder takes 8.5 min vs Oracle 0.5 min - expected for implementation work",
  "evidence": "Builder consistently takes 10-20x longer than Oracle",
  "suggestion": "This is expected - implementation requires more reasoning"
}
```

---

## Implementation Strategy

### Phase 1: Simple LLM Extraction
1. Pass session.json to Janitor with examples
2. Janitor outputs structured pattern analysis
3. Librarian implements approved patterns

### Phase 2: Interactive Refinement
1. Janitor presents patterns to user
2. User confirms/rejects each pattern
3. Only confirmed patterns go to patterns.md

### Phase 3: Learning Loop
1. Track pattern effectiveness over time
2. Adjust pattern detection based on user feedback
3. Improve examples based on successful detections

---

## Output Format

```json
{
  "patterns": [
    {
      "type": "repeated_failure" | "context_loss" | "validation_gap" | "rapid_iteration" | "model_performance" | "tool_error" | "other",
      "severity": "high" | "medium" | "low" | "info",
      "description": "Human-readable description of the pattern",
      "evidence": {
        "message_count": 5,
        "examples": ["message_id_1", "message_id_2"],
        "timestamps": ["2026-02-07T10:00:00", "2026-02-07T10:05:00"],
        "summary": "What the pattern shows"
      },
      "root_cause": "Why this pattern emerged (inferred)",
      "suggestion": "What should change to prevent this",
      "confidence": 0.85
    }
  ],
  "summary": {
    "total_messages": 100,
    "messages_analyzed": 50,
    "patterns_found": 3,
    "real_issues": 1,
    "development_patterns": 2,
    "system_indicators": 0
  }
}
```

---

## Integration

### Trigger
- **Manual:** `/self-improve` command
- **Automatic:** At Closure phase of BUILD/DEBUG/REVIEW workflows
- **Periodic:** Daily check for new patterns

### Flow
```
Copy Session → Janitor Analysis → User Approval → Librarian Implementation → Memory Update
```

### Files Read
- `.opencode/logs/session.json` - Raw session data
- `.opencode/context/01_memory/patterns.md` - Existing patterns (avoid duplicates)

### Files Written
- `.opencode/logs/pattern_candidates.json` - Pattern analysis
- `.opencode/context/01_memory/patterns.md` - New patterns (approved)

---

## Example Analysis Output

```json
{
  "patterns": [
    {
      "type": "context_loss",
      "severity": "high",
      "description": "Builder repeatedly forgot to read requirements before implementation",
      "evidence": {
        "message_count": 3,
        "examples": ["msg_abc123", "msg_def456"],
        "timestamps": ["2026-02-07T10:00:00"],
        "summary": "Requirements document created in Discovery but never referenced in Implementation"
      },
      "root_cause": "No automated gate checking requirements reading",
      "suggestion": "Add 'requirements_read' flag to Builder agent prompt",
      "confidence": 0.92
    },
    {
      "type": "rapid_iteration",
      "severity": "info",
      "description": "Healthy iterative development during Self-Improvement feature build",
      "evidence": {
        "message_count": 50,
        "examples": ["msg_xyz789"],
        "timestamps": ["2026-02-07T12:00:00"],
        "summary": "50 consecutive build calls, each improving the feature incrementally"
      },
      "root_cause": "Normal development workflow",
      "suggestion": "No action needed - this is expected behavior",
      "confidence": 0.99
    }
  ],
  "summary": {
    "total_messages": 1559,
    "messages_analyzed": 100,
    "patterns_found": 2,
    "real_issues": 1,
    "development_patterns": 1,
    "system_indicators": 0
  }
}
```
