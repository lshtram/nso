# NSO Agents: Complete Reference

**Single Source of Truth for Agent Configuration**
**Version:** 1.0.0
**Date:** 2026-02-07
**Related Files:** `opencode.json`, `.opencode/config/mcp-agents.json`

---

## Overview

This document defines all NSO agents, their roles, responsibilities, skills, tools, and MCP access. This is the authoritative reference for agent configuration.

---

## Agent Summary

| Agent | Role | Primary Function |
|-------|------|------------------|
| **Oracle** | System Architect | Requirements and architecture |
| **Builder** | Software Engineer | Code implementation |
| **Designer** | Frontend/UX Specialist | UI/UX implementation |
| **Librarian** | Knowledge Manager | Memory and documentation |
| **Janitor** | QA and Health Monitor | Quality assurance |
| **Scout** | Researcher | External research |

---

## 1. The Oracle

**Role:** System Architect - Defines requirements and architecture.

### Responsibilities
- Receives user requests and interprets intent
- Invokes Router skill to detect workflow type
- Manages BUILD workflow phases (Discovery, Architecture)
- Enforces architectural integrity
- Resolves conflicts between other agents
- Makes strategic decisions about feature scope

### Skills
| Skill | Purpose | When Used |
|-------|---------|-----------|
| `rm-intent-clarifier` | Clarify ambiguous intent | At start of any request |
| `rm-validate-intent` | Verify requirements match intent | Before finalizing REQ-*.md |
| `rm-multi-perspective-audit` | Security/SRE/UX review | Before finalizing requirements |
| `architectural-review` | Simplicity, modularity checks | Before finalizing TECHSPEC-*.md |
| `brainstorming-bias-check` | Detect cognitive bias | During planning |
| `rm-conflict-resolver` | Detect conflicts with existing code | During architecture |

### Native Tools
- `read` - Read files
- `write` - Write new files
- `task` - Delegate to other agents
- `web_search` - Web search

### MCP Tools
| MCP | Tools | Purpose |
|-----|-------|---------|
| **Memory** | `save_memory`, `search_memory` | Persistent context |
| **Parallel Search** | `search` | Technical research |
| **Context7** | `resolve_library_id`, `query_docs` | Library documentation |

### Workflow Assignments
| Workflow | Phase | Responsibility |
|----------|-------|----------------|
| BUILD | Discovery | Requirements gathering, user clarification |
| BUILD | Architecture | Technical design, tech spec creation |
| Any | Routing | Invokes Router skill to determine workflow |

### Context Access
- Full Read/Write to `.opencode/context/01_memory/`

---

## 2. The Builder

**Role:** Software Engineer - Implements code and tests.

### Responsibilities
- Writes production code following specifications
- Implements features using TDD cycle (RED → GREEN → REFACTOR)
- Fixes bugs identified during DEBUG workflow
- Ensures code passes validation harness
- Writes and maintains tests

### Skills
| Skill | Purpose | When Used |
|-------|---------|-----------|
| `tdflow-unit-test` | Test-driven development cycle | During implementation |
| `minimal-diff-generator` | Small, focused code changes | During implementation |

### Native Tools
- `read` - Read files
- `write` - Write new files
- `edit` - Edit existing files
- `bash` - Run commands, tests, git operations

### MCP Tools
| MCP | Tools | Purpose |
|-----|-------|---------|
| **Memory** | `save_memory`, `search_memory` | Persistent context |
| **Tree-sitter** | `search`, `parse_file`, `find_callers` | Semantic code navigation |
| **Parallel Search** | `search` | Technical research |
| **Context7** | `resolve_library_id`, `query_docs` | Library documentation |

### Workflow Assignments
| Workflow | Phase | Responsibility |
|----------|-------|----------------|
| BUILD | Implementation | Feature development, TDD, code |
| DEBUG | Fix | Bug fixes, regression tests |

### Context Access
- Read-Only to `.opencode/context/00_meta/`
- Read access to active feature context

---

## 3. The Designer

**Role:** Frontend/UX Specialist - Owns visual experience.

### Responsibilities
- Implements UI components
- Ensures accessibility compliance
- Manages design tokens and assets
- Creates visual prototypes and mockups

### Skills
| Skill | Purpose | When Used |
|-------|---------|-----------|
| `ui-component-gen` | Create UI components | During frontend work |
| `accessibility-audit` | WCAG compliance | During review |

### Native Tools
- `chrome-devtools` - Browser DevTools
- `edit` - Edit existing files
- `read` - Read files
- `write` - Write new files

### MCP Tools
| MCP | Tools | Purpose |
|-----|-------|---------|
| **Memory** | `save_memory`, `search_memory` | Persistent context |
| **Playwright** | `navigate`, `screenshot`, `click` | Browser automation, testing |
| **Chrome DevTools** | `performance_start_trace`, `performance_stop_trace` | Debugging, performance analysis |
| **Parallel Search** | `search` | Technical research |

### Workflow Assignments
| Workflow | Phase | Responsibility |
|----------|-------|----------------|
| BUILD | Implementation | Frontend components, UI/UX |
| REVIEW | Analysis | UX quality review |

### Context Access
- Read-Only to `.opencode/context/00_meta/`
- Read access to design files

---

## 4. The Librarian

**Role:** Knowledge Manager - Maintains documentation and memory.

### Responsibilities
- Maintains memory files (active_context.md, patterns.md, progress.md)
- Performs workflow closure (memory update, git commit)
- Indexes codebase and documentation
- Retrieves relevant context for other agents
- Ensures documentation matches code reality

### Skills
| Skill | Purpose | When Used |
|-------|---------|-----------|
| `context-manager` | Memory file organization | During updates |
| `doc-updater` | Documentation consistency | After implementation |

### Native Tools
- `grep` - Search file contents
- `glob` - Find files by pattern
- `read` - Read files
- `write` - Write new files

### MCP Tools
| MCP | Tools | Purpose |
|-----|-------|---------|
| **Memory** | `save_memory`, `search_memory` | Persistent context |
| **Parallel Search** | `search` | Research |

### Workflow Assignments
| Workflow | Phase | Responsibility |
|----------|-------|----------------|
| BUILD | Closure | Memory update, git operations |
| DEBUG | Closure | Memory update, pattern documentation |
| REVIEW | Closure | Memory update, pattern documentation |

### Context Access
- Full Read/Write to `.opencode/context/01_memory/`
- Read access to all docs

---

## 5. The Janitor

**Role:** QA and Health Monitor - Maintains code quality.

### Responsibilities
- Investigates bugs using LOG FIRST approach
- Conducts code reviews with confidence scoring
- Runs validation harness and ensures quality gates pass
- Identifies patterns in recurring failures
- Updates patterns.md with discovered issues

### Skills
| Skill | Purpose | When Used |
|-------|---------|-----------|
| `linter-fixer` | Fix linting issues | During code review |
| `silent-failure-hunter` | Detect empty catches, log-only handlers | During code review |
| `traceability-linker` | Ensure requirements map to implementation | During validation |

### Native Tools
- `read` - Read files
- `write` - Write new files
- `edit` - Edit existing files
- `bash` - Run commands, tests

### MCP Tools
| MCP | Tools | Purpose |
|-----|-------|---------|
| **Memory** | `save_memory`, `search_memory` | Persistent context |
| **Tree-sitter** | `search`, `parse_file` | Code analysis |
| **Chrome DevTools** | `performance_start_trace`, `performance_stop_trace`, `heap_snapshot` | Debugging, performance |
| **Parallel Search** | `search` | Technical research |

### Workflow Assignments
| Workflow | Phase | Responsibility |
|----------|-------|----------------|
| DEBUG | Investigation | Evidence gathering, root cause analysis |
| REVIEW | Scope | Define review boundaries and focus areas |
| REVIEW | Analysis | Code analysis, issue identification |
| REVIEW | Report | Generate review report with confidence scores |
| BUILD | Validation | Runs validation harness |

### Context Access
- Read-Only to `.opencode/context/00_meta/`
- Read access to all code files

---

## 6. The Scout

**Role:** Researcher - External knowledge acquisition.

### Responsibilities
- Searches for new libraries, patterns, and tools
- Evaluates "Buy vs Build" decisions
- Updates research findings with industry best practices
- Monitors updates to allowed dependencies
- Performs external research for planning

### Skills
| Skill | Purpose | When Used |
|-------|---------|-----------|
| `tech-radar-scan` | Evaluate emerging technologies | Before planning |
| `rfc-generator` | Document new patterns | When proposing changes |

### Native Tools
- `web_search` - Web search
- `read` - Read files
- `write` - Write new files

### MCP Tools
| MCP | Tools | Purpose |
|-----|-------|---------|
| **Memory** | `save_memory`, `search_memory` | Persistent context |
| **Playwright** | `navigate` | Browser automation |
| **Parallel Search** | `search` | Deep technical research |
| **Context7** | `resolve_library_id`, `query_docs` | Library documentation |

### Workflow Assignments
| Workflow | Phase | Responsibility |
|----------|-------|----------------|
| PLAN | Research | External technology research |
| Any | Discovery | Technology evaluation for requirements |

### Context Access
- Read-Only to `.opencode/context/00_meta/`
- Write to `.opencode/context/03_proposals/` (RFCs)

---

## MCP Servers Reference

### Local MCPs

| MCP | Package | Purpose |
|-----|---------|---------|
| **Memory** | `@modelcontextprotocol/server-memory` | Persistent memory |
| **Playwright** | `@playwright/mcp` | Browser automation |
| **Chrome DevTools** | `chrome-devtools-mcp@latest` | Debugging, performance |
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | File access |

### Remote MCPs

| MCP | URL | Purpose |
|-----|-----|---------|
| **Parallel Search** | `https://search-mcp.parallel.ai/mcp` | Technical search |
| **Tavily** | `https://mcp.tavily.com/mcp` | Web search |
| **Context7** | `https://mcp.context7.com/mcp` | Library documentation |

---

## MCP Access by Agent

| Agent | Local MCPs | Remote MCPs |
|-------|------------|-------------|
| **Oracle** | Memory | Parallel, Context7 |
| **Builder** | Memory, Tree-sitter | Parallel, Context7 |
| **Designer** | Memory, Playwright, Chrome DevTools | Parallel |
| **Librarian** | Memory | Parallel |
| **Janitor** | Memory, Tree-sitter, Chrome DevTools | Parallel |
| **Scout** | Memory, Playwright | Parallel, Context7 |

---

## Native Tools by Agent

| Agent | Tools |
|-------|-------|
| **Oracle** | read, write, task, web_search |
| **Builder** | read, write, edit, bash |
| **Designer** | chrome-devtools, edit, read, write |
| **Librarian** | grep, glob, read, write |
| **Janitor** | read, write, edit, bash |
| **Scout** | web_search, read, write |

---

## Skills by Agent

| Agent | Skills |
|-------|--------|
| **Oracle** | rm-intent-clarifier, rm-validate-intent, rm-multi-perspective-audit, architectural-review, brainstorming-bias-check, rm-conflict-resolver |
| **Builder** | tdflow-unit-test, minimal-diff-generator |
| **Designer** | ui-component-gen, accessibility-audit |
| **Librarian** | context-manager, doc-updater |
| **Janitor** | linter-fixer, silent-failure-hunter, traceability-linker |
| **Scout** | tech-radar-scan, rfc-generator |

---

## Files

| File | Purpose |
|------|---------|
| `opencode.json` | Runtime configuration (authoritative) |
| `.opencode/config/mcp-agents.json` | Per-agent MCP mapping |
| `.opencode/docs/NSO-AGENTS.md` | This document (SSOT) |
| `.opencode/AGENTS.md` | Agent roles and responsibilities |

---

## Updating This Document

When adding or modifying agents:

1. Update `opencode.json` with new configuration
2. Update `.opencode/config/mcp-agents.json` with MCP mapping
3. Update this document (NSO-AGENTS.md) with changes
4. Update `.opencode/AGENTS.md` if roles change
5. Run `.opencode/scripts/test_mcps.py` to verify configuration

---

**Document Status:** ✅ Complete  
**Last Updated:** 2026-02-07  
**Next Review:** When agent configuration changes