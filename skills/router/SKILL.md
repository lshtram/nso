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
Priority: DEBUG > REVIEW > PLAN > BUILD.

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

# Usage
```bash
# Via command line
python3 ~/.config/opencode/nso/scripts/router_logic.py "build a new feature"

# Via OpenCode
/router "debug the login issue"
```

# Examples
- `/router "implement a REST API for user authentication"` → BUILD workflow
- `/router "fix the memory leak in production"` → DEBUG workflow
- `/router "review the security implementation"` → REVIEW workflow
- `/router "plan the microservices architecture"` → PLAN workflow

# Files
- `scripts/router_logic.py`: Core routing logic
- `references/keywords.md`: Trigger keyword definitions
- `references/contracts.md`: Router Contract format and validation
- `scripts/test_router_logic.py`: Unit tests
