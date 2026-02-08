# Tech Spec: NSO Intelligent Router

## 1. Scope
Implement an Intelligent Router skill that serves as the entry point for all development tasks. The router provides intent detection, workflow routing, memory integration, and Router Contracts, while deferring advanced features (parallel execution, circuit breaker, SKILL_HINTS) to Phase 2.

## 2. Architecture Overview

### 2.1 Router Components
```
.opencode/skills/router/
  ├── SKILL.md                    # Main skill entry point
  ├── references/
  │   ├── keywords.md             # Trigger keywords for each workflow
  │   └── contracts.md           # Router Contract format and validation
  └── scripts/
      └── router_logic.py         # Intent detection and routing logic
```

### 2.2 Router Command
```json
{
  "command": {
    "router": {
      "description": "Activate the Intelligent Router for intent detection and workflow routing",
      "template": "Activate router skill with the following request: {{args}}",
      "agent": "Oracle"
    }
  }
}
```

### 2.3 Workflow Decision Tree
```
User Request
    ↓
Intent Detection (keyword matching)
    ↓
┌───────────────────────────────┐
│ BUILD (default)               │ ← No explicit keywords found
│ DEBUG                        │ ← debug, fix, error, bug, broken, troubleshoot, issue, problem, doesn't work, failure
│ REVIEW                       │ ← review, audit, check, analyze, assess, "what do you think", "is this good", evaluate
│ PLAN                         │ ← plan, design, architect, roadmap, strategy, spec, "before we build", "how should we"
└───────────────────────────────┘
    ↓
Memory LOAD (optional context)
    ↓
Task Hierarchy Creation
    ↓
Router Output (Workflow + Tasks + Contract Template)
```

## 3. Component Specification

### 3.1 Skill Entry Point: SKILL.md

**File:** `.opencode/skills/router/SKILL.md`

```yaml
---
name: router
description: Intelligent intent detection and workflow routing for NSO.
---

# Role
Orchestrator

# Trigger
- User invokes `/router` command or requests a development task.
- Any request that sounds like: build, fix, debug, review, plan, design, architect.

# Inputs
- User's natural language request.
- Existing memory files (if loaded by the agent).

# Outputs
- Detected workflow (BUILD/DEBUG/REVIEW/PLAN).
- Task hierarchy (list of scoped tasks).
- Router Contract template (YAML).
- Routing decision log.

# Steps
## 1. Parse User Request
Extract the user's intent from the request text.

## 2. Detect Intent (Keyword Matching)
Match keywords against BUILD, DEBUG, REVIEW, PLAN patterns.

## 3. Select Workflow
Based on intent detection, select the appropriate workflow.
Default to BUILD if no explicit keywords found.

## 4. LOAD Memory (Optional)
If memory files are available, read them for context.
Use memory to inform routing decisions (e.g., check for in-progress work).

## 5. Create Task Hierarchy
Generate a human-readable task breakdown for the selected workflow.
Scope each task to 2-5 minutes.

## 6. Output Router Contract
Generate a YAML contract template for the workflow agent.

## 7. Log Routing Decision
Record the routing decision for traceability.
```

### 3.2 Keywords Reference

**File:** `.opencode/skills/router/references/keywords.md`

```markdown
# Router Trigger Keywords

## BUILD Workflow (Default)
**Keywords:** build, implement, create, make, write, add, develop, code, feature, component, app, application

**Default:** If no other keywords match, default to BUILD.

## DEBUG Workflow
**Keywords:** debug, fix, error, bug, broken, troubleshoot, issue, problem, doesn't work, failure

## REVIEW Workflow
**Keywords:** review, audit, check, analyze, assess, "what do you think", "is this good", evaluate

## PLAN Workflow
**Keywords:** plan, design, architect, roadmap, strategy, spec, "before we build", "how should we"

## Priority
DEBUG > REVIEW > PLAN > BUILD (most specific to least specific)
```

### 3.3 Router Contract Reference

**File:** `.opencode/skills/router/references/contracts.md`

```markdown
# Router Contract Format

## Contract Structure (YAML)
```yaml
router_contract:
  status: IN_PROGRESS
  workflow: BUILD | DEBUG | REVIEW | PLAN
  intent: str                           # Original user intent
  tasks:
    - id: int
      description: str
      status: PENDING | IN_PROGRESS | COMPLETE | BLOCKED
      dependencies: list[int]           # Task IDs this task depends on
  memory_notes: str                     # Notes to add to memory (if any)
  next_action: str                      # What the agent should do next
```

## Agent Output Contract (After Completion)
```yaml
router_contract:
  status: COMPLETE | BLOCKED | NEEDS_REVIEW
  workflow: BUILD | DEBUG | REVIEW | PLAN
  tasks_completed: int
  tasks_total: int
  evidence:
    - type: test | review | verification
      result: PASS | FAIL
      details: str
  next_action: str                      # What to do next (or "none" if done)
```

## Validation Rules
- `status` must be one of: IN_PROGRESS, COMPLETE, BLOCKED, NEEDS_REVIEW
- `workflow` must match the selected workflow
- `tasks` must be a list of task objects
- `evidence` must contain at least one item if status is COMPLETE
```

### 3.4 Router Logic Script

**File:** `.opencode/skills/router/scripts/router_logic.py`

```python
"""
NSO Router Logic - Intent detection and workflow routing.

@implements: FR-1, FR-2, FR-3, FR-5
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional


class Workflow(Enum):
    BUILD = "BUILD"
    DEBUG = "DEBUG"
    REVIEW = "REVIEW"
    PLAN = "PLAN"


@dataclass
class RoutingDecision:
    workflow: Workflow
    confidence: float  # 0.0 to 1.0
    matched_keywords: list[str]
    task_breakdown: list[str]
    contract_template: str


# Keyword patterns (compiled for efficiency)
KEYWORDS: dict[Workflow, list[str]] = {
    Workflow.BUILD: [
        r"\bbuild\b", r"\bimplement\b", r"\bcreate\b", r"\bmake\b",
        r"\bwrite\b", r"\badd\b", r"\bdevelop\b", r"\bcode\b",
        r"\bfeature\b", r"\bcomponent\b", r"\bapp\b", r"\bapplication\b",
    ],
    Workflow.DEBUG: [
        r"\bdebug\b", r"\bfix\b", r"\berror\b", r"\bbug\b",
        r"\bbroken\b", r"\btroubleshoot\b", r"\bissue\b", r"\bproblem\b",
        r"\bdoesn't work\b", r"\bfailure\b",
    ],
    Workflow.REVIEW: [
        r"\breview\b", r"\baudit\b", r"\bcheck\b", r"\banalyze\b",
        r"\bassess\b", r"\bwhat do you think\b", r"\bis this good\b",
        r"\bevaluate\b",
    ],
    Workflow.PLAN: [
        r"\bplan\b", r"\bdesign\b", r"\barchitect\b", r"\broadmap\b",
        r"\bstrategy\b", r"\bspec\b", r"\bbefore we build\b",
        r"\bhow should we\b",
    ],
}


def detect_intent(request: str) -> tuple[Workflow, list[str], float]:
    """
    Detect user intent from natural language request.
    
    Returns:
        Tuple of (detected_workflow, matched_keywords, confidence)
    """
    scores: dict[Workflow, list[str]] = {w: [] for w in Workflow}
    
    for workflow, patterns in KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, request, re.IGNORECASE):
                scores[workflow].append(pattern)
    
    # Find the workflow with the most matches
    best_workflow = Workflow.BUILD  # Default
    best_matches: list[str] = []
    max_count = 0
    
    for workflow, matches in scores.items():
        if len(matches) > max_count:
            max_count = len(matches)
            best_workflow = workflow
            best_matches = matches
    
    # Confidence is based on match count (simple heuristic)
    confidence = min(max_count / 3.0, 1.0)  # Cap at 1.0
    
    return best_workflow, best_matches, confidence


def create_task_breakdown(workflow: Workflow, request: str) -> list[str]:
    """
    Create a human-readable task breakdown for the selected workflow.
    """
    base_tasks = {
        Workflow.BUILD: [
            f"Clarify requirements for: {request[:50]}...",
            "Create task hierarchy",
            "Implement feature using TDD",
            "Run tests and verify",
            "Update memory",
        ],
        Workflow.DEBUG: [
            f"Investigate issue: {request[:50]}...",
            "Gather evidence (logs, error messages)",
            "Identify root cause",
            "Implement fix",
            "Verify fix with tests",
            "Update memory with findings",
        ],
        Workflow.REVIEW: [
            f"Review scope: {request[:50]}...",
            "Check spec compliance",
            "Review code quality",
            "Report findings",
            "Update memory with patterns",
        ],
        Workflow.PLAN: [
            f"Plan for: {request[:50]}...",
            "Gather requirements",
            "Design architecture",
            "Create implementation plan",
            "Document plan",
        ],
    }
    
    return base_tasks.get(workflow, ["Unknown workflow task"])


def generate_contract_template(
    workflow: Workflow,
    request: str,
    tasks: list[str],
) -> str:
    """
    Generate a YAML contract template for the workflow agent.
    """
    task_list = "\n".join(
        f"  - id: {i+1}\n    description: {task}\n    status: PENDING\n    dependencies: []"
        for i, task in enumerate(tasks)
    )
    
    return f"""router_contract:
  status: IN_PROGRESS
  workflow: {workflow.value}
  intent: "{request}"
  tasks:
{task_list}
  memory_notes: ""
  next_action: "Start with Task 1"
"""


def route_request(request: str) -> RoutingDecision:
    """
    Main router function: detect intent and create routing decision.
    """
    workflow, matched_keywords, confidence = detect_intent(request)
    tasks = create_task_breakdown(workflow, request)
    contract = generate_contract_template(workflow, request, tasks)
    
    return RoutingDecision(
        workflow=workflow,
        confidence=confidence,
        matched_keywords=matched_keywords,
        task_breakdown=tasks,
        contract_template=contract,
    )


# CLI for testing
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        request = " ".join(sys.argv[1:])
        decision = route_request(request)
        print(f"Workflow: {decision.workflow.value}")
        print(f"Confidence: {decision.confidence:.2f}")
        print(f"Matched: {decision.matched_keywords}")
        print(f"\nTasks:")
        for i, task in enumerate(decision.task_breakdown, 1):
            print(f"  {i}. {task}")
    else:
        print("Usage: python router_logic.py '<request>'")
```

## 4. Memory Integration

### 4.1 LOAD Protocol
The router optionally reads memory files if available:

```python
def load_memory() -> dict[str, str]:
    """Load existing memory files for context."""
    memory_dir = Path(".opencode/context/01_memory")
    memory = {}
    
    for filename in ["active_context.md", "patterns.md", "progress.md"]:
        filepath = memory_dir / filename
        if filepath.exists():
            memory[filename] = filepath.read_text()
    
    return memory
```

### 4.2 Memory-Aware Routing
If memory indicates similar work is in-progress, the router can:
- Suggest continuing the existing work
- Alert the user to potential duplication
- Reference previous decisions from memory

## 5. Command Integration

### 5.1 `/router` Command
Add to `opencode.json`:

```json
{
  "command": {
    "router": {
      "description": "Activate the Intelligent Router for intent detection and workflow routing",
      "template": "Activate router skill with the following request: {{args}}",
      "agent": "Oracle"
    }
  }
}
```

## 6. Output Format

### 6.1 Router Output Example
```
🛣️  NSO Router Decision

**Detected Workflow:** BUILD
**Confidence:** 0.75
**Matched Keywords:** ["build", "implement"]

### Task Breakdown
1. Clarify requirements for: build a new feature to track...
2. Create task hierarchy
3. Implement feature using TDD
4. Run tests and verify
5. Update memory

### Router Contract
```yaml
router_contract:
  status: IN_PROGRESS
  workflow: BUILD
  intent: "build a new feature to track..."
  tasks:
  - id: 1
    description: Clarify requirements for: build a new feature to track...
    status: PENDING
    dependencies: []
  ...
  next_action: "Start with Task 1"
```
```

## 7. Testing Strategy

### 7.1 Unit Tests
| Test | Coverage Target |
|------|----------------|
| Intent detection (all keyword patterns) | 100% |
| Workflow selection logic | 100% |
| Contract template generation | 100% |
| Task breakdown creation | 100% |

### 7.2 Integration Tests
| Test | Coverage Target |
|------|----------------|
| `/router` command invocation | Full path |
| Memory LOAD (if available) | Mocked |
| Contract validation | Full format |

## 8. Validation & Acceptance
1) Router correctly detects intent for all keyword patterns.
2) Workflow selection follows priority: DEBUG > REVIEW > PLAN > BUILD.
3) Task breakdown is human-readable and scoped.
4) Router Contract template is valid YAML.
5) `/router` command works from CLI.
6) Validation harness passes (lint, type, pytest).

## 9. Risks & Mitigations
- **Ambiguous intent:** Default to BUILD; user can override with explicit workflow flag (future).
- **Keyword overlap:** DEBUG/REVIEW/PLAN take priority over BUILD.
- **Memory overhead:** Optional LOAD; no performance impact if memory unavailable.

## 10. Architecture Review Log (Checklist)
**Simplicity:** Keyword-based routing is simple and deterministic. No ML/AI. ✔️

**Modularity:** Router logic is isolated in `router_logic.py`; easy to extend. ✔️

**Abstraction Boundaries:** Router outputs contract; downstream agents handle execution. ✔️

**YAGNI:** No parallel execution, circuit breaker, or SKILL_HINTS in Phase 1. ✔️
