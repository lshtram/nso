# Requirements: NSO Core Materialization

| Field | Value |
|-------|-------|
| **Feature** | NSO Automation Core |
| **Status** | Discovery (Approved) |
| **Version** | 1.0.0 |
| **Owner** | Oracle |

## 1. Background
NSO has detailed Tech Specs for an Intelligent Router, Workflow System, and Memory Architecture. However, these are currently "specs on paper" and not yet fully materialized as functional code and skills in the global NSO configuration (`~/.config/opencode/nso/`). This session aims to bridge this gap.

## 2. Goals
1.  **Materialize Intelligent Router**: Implement `router_logic.py` and the `router` skill in the global NSO directory.
2.  **Materialize Workflow Agents**: Implement `bug-investigator` and `code-reviewer` skills.
3.  **Implement Command Hooks**: Create the `/router` command in the global `opencode.json` (if applicable) or as a discoverable skill.
4.  **Global Accessibility**: Ensure all implemented components are placed in the global tier so they are available to all NSO-enabled projects.

## 3. Functional Requirements
### FR-1: Global Router Implementation
- Create `.opencode/skills/router/` in the global NSO directory.
- Implement `SKILL.md` with routing logic.
- Implement `scripts/router_logic.py` for keyword detection.
- Define `references/keywords.md` and `references/contracts.md`.

### FR-2: Debug Workflow Materialization
- Create `.opencode/skills/bug-investigator/` in the global NSO directory.
- Implement `SKILL.md` enforcing the "Log First" and "Regression Test" protocol.
- Integrate with the Router Contract system.

### FR-3: Review Workflow Materialization
- Create `.opencode/skills/code-reviewer/` in the global NSO directory.
- Implement `SKILL.md` enforcing the "Confidence Scoring (≥80)" and "Two-Stage Review" protocol.
- Integrate with the Router Contract system.

### FR-4: Memory Protocol Hooks
- Ensure all materialized skills follow the "LOAD at Start / UPDATE at End" iron law.
- Utilize existing memory scripts (`memory_validator.py`, etc.) for enforcement.

## 4. Non-Functional Requirements
- **Simplicity**: No complex ML; stick to deterministic keyword matching.
- **Portability**: All code must be self-contained in the global NSO folder.
- **Standardization**: Follow the Hexagon Squad roles (Oracle, Builder, Janitor, Librarian, Scout).

## 5. Acceptance Criteria
1.  `/router` command (or skill invocation) correctly detects intent for BUILD, DEBUG, REVIEW, and PLAN.
2.  `bug-investigator` skill is available globally and follows the documented DEBUG workflow phases.
3.  `code-reviewer` skill is available globally and follows the documented REVIEW workflow phases.
4.  All skills output valid YAML Router Contracts.
5.  Verification tests in `~/.config/opencode/nso/tests/` pass.

## 6. Audit & Validation
- **rm-validate-intent**: Confirmed alignment with user's request to "fill in the missing gaps" globally.
- **rm-multi-perspective-audit**: 
    - Security: No `eval()` or shell injection in routing logic.
    - UX: Clear task breakdowns for users.
    - SRE: Graceful fallback to BUILD if routing fails.
