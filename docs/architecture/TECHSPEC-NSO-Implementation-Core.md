# Tech Spec: NSO Automation Core (Consolidated)

| Field | Value |
|-------|-------|
| **Feature** | NSO Automation Core |
| **Status** | Architecture (In-Review) |
| **Version** | 1.0.0 |
| **Owner** | Oracle |

## 1. Scope
This specification details the materialization of the NSO Intelligent Router, Workflow System, and Memory Persistence layer into the global NSO configuration directory (`~/.config/opencode/nso/`).

## 2. Architecture Overview

### 2.1 Directory Structure
The following skills and scripts will be created or updated in the global tier:
```
~/.config/opencode/nso/
  ├── skills/
  │   ├── router/                 # New: Intelligent Routing
  │   │   ├── SKILL.md
  │   │   ├── scripts/
  │   │   │   └── router_logic.py
  │   │   └── references/
  │   │       ├── keywords.md
  │   │       └── contracts.md
  │   ├── bug-investigator/       # New: Debug Workflow Agent
  │   │   └── SKILL.md
  │   ├── code-reviewer/          # New: Review Workflow Agent
  │   │   └── SKILL.md
  │   └── session-memory/         # New: Explicit Memory Protocol
  │       └── SKILL.md
  ├── scripts/
  │   ├── gate_check.py           # Updated: Support Workflow Contracts
  │   └── validate.py             # Updated: Integrated validation
  └── config/
      └── opencode.json           # Updated: Global command definitions
```

## 3. Component Details

### 3.1 Intelligent Router
- **Logic**: Python-based keyword detection (BUILD, DEBUG, REVIEW, PLAN).
- **Handoff**: Generates a YAML `router_contract` for the next agent.
- **Task Creation**: Automatically breaks down requests into 2-5 minute tasks.

### 3.2 Workflow Agents
- **Bug-Investigator**: Implements "Log First" and "Regression Test" mandatory steps.
- **Code-Reviewer**: Implements "Confidence Scoring (≥80)" and "Two-Stage Review".
- **Librarian**: (Existing) Enhanced to verify memory updates against progress.

### 3.3 Memory Persistence
- **Files**: `.opencode/context/01_memory/{active_context,patterns,progress}.md`.
- **Protocol**: LOAD at workflow start, UPDATE at workflow end.
- **Automation**: Scripts will validate anchor integrity and prevent data loss during context compaction.

## 4. Implementation Plan

### Step 1: Memory Foundation
- Implement `skills/session-memory/SKILL.md` in global tier.
- Formalize LOAD/UPDATE scripts in `scripts/`.

### Step 2: Router Core
- Implement `skills/router/scripts/router_logic.py`.
- Define keyword matrices for intent detection.
- Create `skills/router/SKILL.md`.

### Step 3: Workflow Agents
- Implement `skills/bug-investigator/SKILL.md`.
- Implement `skills/code-reviewer/SKILL.md`.
- Update roles in `AGENTS.md` to reference these new skills.

### Step 4: System Integration
- Update `scripts/gate_check.py` to validate YAML contracts.
- Integrate into global command structure.

## 5. Acceptance & Verification
- Unit tests for routing logic (`tests/test_router_logic.py`).
- Integration tests for full workflows (BUILD, DEBUG, REVIEW).
- Validation harness check: `validate.py --full`.

## 6. Architecture Review Log
- **Simplicity**: Deterministic keyword matching over complex AI routing.
- **Modularity**: Skills are independent and composable.
- **Abstraction**: Handoffs are contract-based.
- **YAGNI**: No parallel execution or circuit breaker in this phase.
