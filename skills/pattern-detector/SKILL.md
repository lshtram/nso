# Pattern Detector Skill

**Agent:** Janitor  
**Phase:** Self-Improvement Workflow  
**Input:** `.opencode/logs/session.json` (copied messages)  
**Output:** `.opencode/logs/pattern_candidates.json` (identified patterns)  

---

## Purpose

Analyze OpenCode session messages to identify patterns that suggest areas for improvement, such as:
- Repeated failures (same errors, same file fixes)
- Agent bypass patterns (skipping phases)
- Time-based patterns (long investigations, quick closures)
- Communication gaps (unclear requirements, incomplete context)

---

## When Used

1. **Automatic:** At the end of a workflow (Discovery, Architecture, Build, Debug, Review)
2. **Manual:** User triggers `/self-improve` command

---

## Input Format

```json
{
  "messages": [
    {
      "id": "msg_...",
      "role": "user" | "assistant",
      "agent": "build" | "debug" | "review",
      "model": "claude-sonnet-4.5",
      "path": {"cwd": "/Users/..."},
      "time": {"created": 1234567890, "completed": 1234567900},
      "finish": "tool-calls" | "complete"
    }
  ]
}
```

---

## Output Format

```json
{
  "patterns": [
    {
      "type": "repeated_failure" | "bypass" | "time_anomaly" | "communication_gap",
      "severity": "high" | "medium" | "low",
      "description": "Human-readable description",
      "evidence": [
        {"message_id": "...", "timestamp": 1234567890, "details": "..."}
      ],
      "suggestion": "Recommended fix"
    }
  ],
  "summary": {
    "total_messages": 1488,
    "agents_used": ["build", "debug", "review"],
    "duration_hours": 240.5,
    "patterns_found": 5
  }
}
```

---

## Pattern Detection Rules

### 1. Repeated Failures
**Rule:** Same file modified 3+ times with similar changes  
**Severity:** Medium  
**Evidence:** Messages with same file path in `path.cwd`  
**Suggestion:** "This file was modified multiple times. Consider adding tests or refactoring."

### 2. Agent Bypass Pattern
**Rule:** Jumped from Discovery to Implementation without Architecture  
**Severity:** High  
**Evidence:** Agent sequence like "build → build" without "oracle" in between  
**Suggestion:** "Skipped Oracle phase. Use /new-feature for proper workflow."

### 3. Long Investigation
**Rule:** Debug session > 30 minutes without resolution  
**Severity:** Medium  
**Evidence:** Debug agent messages with gaps > 30 minutes  
**Suggestion:** "Long debug session. Consider /scout for research or /status for help."

### 4. Quick Closure
**Rule:** Workflow closed in < 2 minutes (suspicious)  
**Severity:** Low  
**Evidence:** Oracle → Closure in < 2 minutes  
**Suggestion:** "Quick closure. Did we skip quality gates?"

### 5. Multiple Models
**Rule:** Changed models mid-workflow  
**Severity:** Low  
**Evidence:** Different `modelID` values in same session  
**Suggestion:** "Model switching detected. Document why."

### 6. No User Approval
**Rule:** Architecture or Requirements approved without user input  
**Severity:** High  
**Evidence:** Oracle phases with no "user" role messages  
**Suggestion:** "Phases completed without user approval. Gate required."

---

## Implementation

```python
def analyze_session(session_path: str) -> dict:
    """
    Main analysis function.
    
    Args:
        session_path: Path to .opencode/logs/session.json
        
    Returns:
        Pattern analysis result with patterns found
    """
    with open(session_path) as f:
        messages = json.load(f)
    
    patterns = []
    
    # 1. Analyze agent transitions
    agent_patterns = analyze_agent_transitions(messages)
    patterns.extend(agent_patterns)
    
    # 2. Analyze timing patterns
    time_patterns = analyze_timing(messages)
    patterns.extend(time_patterns)
    
    # 3. Analyze file changes
    file_patterns = analyze_file_changes(messages)
    patterns.extend(file_patterns)
    
    # 4. Analyze model usage
    model_patterns = analyze_models(messages)
    patterns.extend(model_patterns)
    
    return {
        "patterns": patterns,
        "summary": {
            "total_messages": len(messages),
            "agents_used": list(set(m.get("agent") for m in messages)),
            "duration_hours": calculate_duration(messages) / 3600,
            "patterns_found": len(patterns)
        }
    }


def analyze_agent_transitions(messages: list) -> list:
    """Detect agent bypass patterns."""
    patterns = []
    agent_sequence = [m.get("agent") for m in messages if m.get("agent")]
    
    # Detect: build → build (no oracle in between)
    for i in range(len(agent_sequence) - 1):
        if agent_sequence[i] == "build" and agent_sequence[i+1] == "build":
            patterns.append({
                "type": "bypass",
                "severity": "high",
                "description": "Consecutive build agent calls suggest skipped Oracle phase",
                "evidence": [{"message_id": messages[i].get("id")}],
                "suggestion": "Use /new-feature for proper workflow initiation"
            })
    
    return patterns


def analyze_timing(messages: list) -> list:
    """Detect time-based patterns."""
    patterns = []
    
    for msg in messages:
        created = msg.get("time", {}).get("created", 0)
        completed = msg.get("time", {}).get("completed", 0)
        duration_minutes = (completed - created) / 60000 if completed else 0
        
        # Quick closure detection
        if duration_minutes < 2 and msg.get("agent") == "oracle":
            patterns.append({
                "type": "quick_closure",
                "severity": "low",
                "description": "Oracle phase completed in < 2 minutes",
                "evidence": [{"message_id": msg.get("id"), "duration": duration_minutes}],
                "suggestion": "Verify quality gates were not skipped"
            })
    
    return patterns


def analyze_file_changes(messages: list) -> list:
    """Detect repeated file modifications."""
    patterns = []
    file_counts = {}
    
    for msg in messages:
        cwd = msg.get("path", {}).get("cwd", "")
        if cwd:
            file_counts[cwd] = file_counts.get(cwd, 0) + 1
    
    # Files modified 3+ times
    for file_path, count in file_counts.items():
        if count >= 3:
            patterns.append({
                "type": "repeated_failure",
                "severity": "medium",
                "description": f"File '{file_path}' modified {count} times",
                "evidence": [],
                "suggestion": "Consider adding tests or refactoring to reduce churn"
            })
    
    return patterns


def analyze_models(messages: list) -> list:
    """Detect model switching patterns."""
    patterns = []
    models_used = set()
    
    for msg in messages:
        model = msg.get("modelID") or msg.get("model", {}).get("modelID")
        if model:
            models_used.add(model)
    
    if len(models_used) > 1:
        patterns.append({
            "type": "model_switch",
            "severity": "low",
            "description": f"Multiple models used: {', '.join(models_used)}",
            "evidence": [],
            "suggestion": "Document reasons for model switching"
        })
    
    return patterns
```

---

## Usage

```bash
# Copy session first
python3 .opencode/scripts/copy_session.py

# Then analyze patterns
python3 .opencode/skills/pattern-detector/analyze.py
```

---

## Integration

1. **Triggered by:** `/self-improve` slash command
2. **Reads:** `.opencode/logs/session.json`
3. **Writes:** `.opencode/logs/pattern_candidates.json`
4. **Next Step:** Pattern Implementer skill reads pattern candidates and applies fixes

---

## Example Output

```json
{
  "patterns": [
    {
      "type": "bypass",
      "severity": "high",
      "description": "Consecutive build agent calls suggest skipped Oracle phase",
      "evidence": [{"message_id": "msg_abc123"}],
      "suggestion": "Use /new-feature for proper workflow initiation"
    },
    {
      "type": "repeated_failure",
      "severity": "medium",
      "description": "File '/path/to/file.py' modified 5 times",
      "evidence": [],
      "suggestion": "Consider adding tests or refactoring to reduce churn"
    }
  ],
  "summary": {
    "total_messages": 1488,
    "agents_used": ["build", "debug", "review"],
    "duration_hours": 240.5,
    "patterns_found": 5
  }
}
```
