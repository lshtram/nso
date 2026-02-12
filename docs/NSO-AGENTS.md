# NSO Agents: Complete Reference

**Single Source of Truth for Agent Configuration**
**Version:** 2.0.0
**Date:** 2026-02-12
**Related Files:** `~/.config/opencode/opencode.json`

---

## Overview

This document defines all 8 NSO agents, their roles, responsibilities, skills, tools, and workflow assignments. This is the authoritative reference for agent configuration.

---

## Agent Summary

| Agent | Role | Primary Function |
|-------|------|------------------|
| **Oracle** | System Architect | Architecture, orchestration, delegation |
| **Analyst** | Mastermind | Requirements discovery (BUILD), Investigation (DEBUG) |
| **Builder** | Software Engineer | Code implementation (TDD) |
| **Designer** | Frontend/UX Specialist | UI/UX implementation |
| **Janitor** | QA & Health Monitor | Spec compliance + automated validation |
| **CodeReviewer** | Quality Auditor | Independent code quality review |
| **Librarian** | Knowledge Manager | Memory, documentation, self-improvement |
| **Scout** | Researcher | External research, technology evaluation |

---

## 1. The Oracle

**Role:** System Architect & Orchestrator
**Subagent Type:** `Oracle`
**Prompt:** `~/.config/opencode/nso/prompts/Oracle.md`

### Responsibilities
- Orchestrates all workflows (BUILD, DEBUG, REVIEW)
- Drafts architecture (TECHSPEC) — does NOT write implementation code
- Delegates to other agents via `task()` with formal contracts
- Enforces worktree isolation for BUILD workflow
- Manages accountability gates and user approval checkpoints

### Skills
| Skill | Purpose |
|-------|---------|
| `architectural-review` | Self-critique of architecture decisions |
| `router` | Detect workflow type from user intent |
| `skill-creator` | Create new skills for NSO system |

### Role Boundary
- MAY edit: `docs/*`, `.opencode/context/*`, NSO config files
- MUST NOT edit: `src/*`, runtime code, tests, app configs
- Implementation → always delegate to Builder

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| BUILD | Phase 0 (Worktree) | Setup branch isolation |
| BUILD | Phase 2 (Architecture) | Draft TECHSPEC |
| BUILD | Phase 4B→5 (Accountability) | Present results, get approval |
| DEBUG | Phase 2 (Triage) | Assess scope, determine strategy |
| REVIEW | Orchestration | Delegate to CodeReviewer |

---

## 2. The Analyst

**Role:** Mastermind — Analytical Agent
**Subagent Type:** `Analyst`
**Prompt:** `~/.config/opencode/nso/prompts/Analyst.md`

### Responsibilities
- **MODE A (BUILD):** Requirements discovery via structured user interaction
- **MODE B (DEBUG):** Bug investigation via LOG FIRST methodology

### Skills
| Skill | Purpose |
|-------|---------|
| `rm-intent-clarifier` | Clarify ambiguous user intent |
| `rm-validate-intent` | Verify requirements match intent |
| `rm-multi-perspective-audit` | Security/SRE/UX review of requirements |
| `bug-investigator` | LOG FIRST debugging, evidence collection |

### Interaction Protocol
- One question at a time (200-300 word sections)
- YAGNI check on each requirement
- Confidence scoring for root cause analysis (≥80 threshold)
- Human signal detection for implied context

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| BUILD | Phase 1 (Discovery) | Requirements gathering |
| DEBUG | Phase 1 (Investigation) | Evidence gathering, root cause |

---

## 3. The Builder

**Role:** Software Engineer — Implementer
**Subagent Type:** `Builder`
**Prompt:** `~/.config/opencode/nso/prompts/Builder.md`

### Responsibilities
- Writes production code following TECHSPEC
- Implements features using strict TDD (RED → GREEN → REFACTOR)
- Fixes bugs with regression tests (must fail before fix)
- Applies verification gate before claiming completion

### Skills
| Skill | Purpose |
|-------|---------|
| `tdd` | Test-driven development enforcement |
| `minimal-diff-generator` | Small, focused code changes |
| `verification-gate` | Evidence-based completion claims |
| `systematic-debugging` | 4-phase debugging methodology |

### Question Gate
Before starting implementation, Builder MUST verify understanding:
- Can I restate the requirements in my own words?
- Are there ambiguous terms I need clarified?
- Do I know the test strategy?

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| BUILD | Phase 3 (Implementation) | TDD feature development |
| DEBUG | Phase 3 (Fix) | Regression test + minimal fix |

---

## 4. The Designer

**Role:** Frontend/UX Specialist
**Subagent Type:** `Designer`
**Prompt:** `~/.config/opencode/nso/prompts/Designer.md`

### Responsibilities
- Implements UI components
- Ensures accessibility compliance
- Creates visual prototypes and mockups
- Manages design tokens and assets

### Skills
| Skill | Purpose |
|-------|---------|
| `ui-component-gen` | Create UI components |
| `accessibility-audit` | WCAG compliance |

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| BUILD | Phase 1 (Discovery) | UI mockups when UI involved |
| BUILD | Phase 3 (Implementation) | Frontend components |

---

## 5. The Janitor

**Role:** QA & Health Monitor — Automated Validation
**Subagent Type:** `Janitor`
**Prompt:** `~/.config/opencode/nso/prompts/Janitor.md`

### Responsibilities
- **Stage A:** Spec compliance (binary PASS/FAIL against TECHSPEC)
- **Stage B:** Automated harness (typecheck, lint, tests)
- TDD compliance verification
- Silent failure detection
- Requirements traceability

### Skills
| Skill | Purpose |
|-------|---------|
| `silent-failure-hunter` | Detect empty catches, log-only handlers |
| `traceability-linker` | Requirements → implementation mapping |
| `integration-verifier` | E2E scenario verification |
| `verification-gate` | Evidence-based validation |

### Two-Stage Process
1. **Stage A (Spec Compliance):** Every TECHSPEC requirement → implemented code. FAIL = STOP immediately.
2. **Stage B (Harness):** Typecheck → Lint → Tests → Silent failure scan → Traceability check.

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| BUILD | Phase 4A (Validation) | Spec compliance + harness |
| DEBUG | Phase 4 (Validation) | Regression + full harness |

---

## 6. The CodeReviewer

**Role:** Quality Auditor — Independent Code Review
**Subagent Type:** `CodeReviewer`
**Prompt:** `~/.config/opencode/nso/prompts/CodeReviewer.md`

### Responsibilities
- Independent code quality review (READ-ONLY — does not fix code)
- Confidence scoring (≥80 threshold to report issues)
- Severity classification (CRITICAL / IMPORTANT / MINOR)
- Verdict determination (BLOCK / CHANGES_REQUESTED / APPROVE_WITH_NOTES / APPROVE)
- Mandatory positive findings

### Skills
| Skill | Purpose |
|-------|---------|
| `code-reviewer` | Confidence scoring, severity classification |

### Anti-Performative Agreement
- No rubber-stamping
- Every finding must have confidence score
- Technical acknowledgment only — no gratitude expressions

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| BUILD | Phase 4B (Code Review) | Independent quality review |
| REVIEW | Primary Agent | Full review workflow (Scope → Analysis → Report) |

---

## 7. The Librarian

**Role:** Knowledge Manager — Memory & Self-Improvement
**Subagent Type:** `Librarian`
**Prompt:** `~/.config/opencode/nso/prompts/Librarian.md`

### Responsibilities
- Maintains memory files (`active_context.md`, `patterns.md`, `progress.md`)
- Runs post-mortem analysis at workflow closure
- Proposes and implements approved NSO improvements
- Archives sessions
- Ensures documentation hygiene

### Skills
| Skill | Purpose |
|-------|---------|
| `memory-update` | Refresh memory files |
| `archive-conversation` | Session archival |
| `post-mortem` | Session analysis, pattern detection, improvement proposals |

### NSO-First Learning Protocol
- If a pattern is universal → propose NSO global improvement
- If project-specific → add to project `patterns.md`
- Always get user approval before implementing improvements

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| BUILD | Phase 5 (Closure) | Post-mortem, memory update, git |
| DEBUG | Phase 5 (Closure) | Gotcha documentation, memory update |
| REVIEW | Phase 4 (Closure) | Pattern documentation, memory update |

---

## 8. The Scout

**Role:** Researcher — External Knowledge Acquisition
**Subagent Type:** `Scout`
**Prompt:** `~/.config/opencode/nso/prompts/Scout.md`

### Responsibilities
- Research new libraries, patterns, and tools
- Evaluate "Buy vs Build" decisions
- Monitor dependency updates and security advisories
- Provide technology recommendations with trade-offs

### Skills
| Skill | Purpose |
|-------|---------|
| `tech-radar-scan` | Evaluate emerging technologies |

### Workflow Assignments
| Workflow | Phase | Role |
|----------|-------|------|
| Any | Research | Technology evaluation on demand |

---

## Skills by Agent (Canonical)

| Agent | Skills |
|-------|--------|
| **Oracle** | `architectural-review`, `router`, `skill-creator` |
| **Analyst** | `rm-intent-clarifier`, `rm-validate-intent`, `rm-multi-perspective-audit`, `bug-investigator` |
| **Builder** | `tdd`, `minimal-diff-generator`, `verification-gate`, `systematic-debugging` |
| **Designer** | `ui-component-gen`, `accessibility-audit` |
| **Janitor** | `silent-failure-hunter`, `traceability-linker`, `integration-verifier`, `verification-gate` |
| **CodeReviewer** | `code-reviewer` |
| **Librarian** | `memory-update`, `archive-conversation`, `post-mortem` |
| **Scout** | `tech-radar-scan` |

---

## Workflow Assignments (Canonical)

### BUILD Workflow
```
Analyst → Oracle → Builder → Janitor → CodeReviewer → Oracle → Librarian
```

### DEBUG Workflow
```
Analyst → Oracle → Builder → Janitor → Oracle → Librarian
```

### REVIEW Workflow
```
CodeReviewer → Oracle → Librarian
```

---

## MCP Servers Reference

### Local MCPs
| MCP | Package | Purpose |
|-----|---------|---------|
| **Memory** | `@modelcontextprotocol/server-memory` | Persistent memory (knowledge graph) |
| **Playwright** | `@playwright/mcp` | Browser automation |
| **Chrome DevTools** | `chrome-devtools-mcp@latest` | Debugging, performance |
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | File access |

### Remote MCPs
| MCP | URL | Purpose |
|-----|-----|---------|
| **gh_grep** | `https://mcp.grep.app` | GitHub code search |
| **Parallel Search** | `https://search-mcp.parallel.ai/mcp` | Technical search |
| **Tavily** | `https://mcp.tavily.com/mcp` | Web search + extraction |
| **Context7** | `https://mcp.context7.com/mcp` | Library documentation |

---

## Files

| File | Purpose |
|------|---------|
| `~/.config/opencode/opencode.json` | Runtime configuration (authoritative) |
| `~/.config/opencode/nso/docs/NSO-AGENTS.md` | This document (SSOT) |
| `~/.config/opencode/nso/prompts/*.md` | Agent prompts |
| `~/.config/opencode/nso/skills/*/SKILL.md` | Skill definitions |
| `~/.config/opencode/nso/instructions.md` | Universal instructions |

---

## Updating This Document

When adding or modifying agents:
1. Update `~/.config/opencode/opencode.json` with new agent config
2. Create/update prompt at `~/.config/opencode/nso/prompts/[Agent].md`
3. Update this document (NSO-AGENTS.md)
4. Update `~/.config/opencode/nso/instructions.md` if workflows change

---

**Document Status:** ✅ Complete
**Last Updated:** 2026-02-12
**Version:** 2.0.0 (Major overhaul: added Analyst, CodeReviewer, restructured skills)
