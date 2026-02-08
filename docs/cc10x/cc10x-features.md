# CC10x Comprehensive Feature Analysis

## Project Overview

**Repository URL:** https://github.com/romiluz13/cc10x

**Current Version:** 6.0.18 (as of 2026-02-04)

**Description:** CC10x is an intelligent orchestrator framework for Claude Code that provides automated workflow routing, specialized agents, composable skills, and memory persistence. It transforms Claude Code from a simple coding assistant into a sophisticated development orchestration system with built-in quality gates, TDD enforcement, systematic debugging, and multi-dimensional code review.

**Purpose:** To solve the problem of "bloated and over-engineered" Claude Code plugins by providing:
- One intelligent router that detects intent and orchestrates the right agents
- 6 specialized agents for different workflow types
- 12 composable skills for domain-specific patterns
- 4 workflows (BUILD, DEBUG, REVIEW, PLAN)
- 7-layer memory architecture for persistence across sessions
- Task-based orchestration with dependency chains
- Evidence-based verification with mandatory exit codes

**Key Philosophy:**
- Stop picking skills manually - let the system work for you
- TDD enforcement (RED → GREEN → REFACTOR)
- LOG FIRST debugging (evidence before fixes)
- Exit code 0 or it didn't happen
- Memory persistence across sessions
- Confidence scoring (≥80% only)

---

## File-by-File Analysis

### Root Level Files

#### 1. `README.md`
**Path:** `/README.md`
**Purpose:** Main documentation and user guide for CC10x
**Key Content:**
- Project overview and positioning (vs bloated plugins)
- 4 workflow descriptions with trigger words
- 6 agent definitions with purposes
- 12 skill inventory
- Installation instructions for Claude Code
- Architecture diagram showing orchestration flow
- Version history from v5.3.0 to v6.0.18
- Quick start examples for each workflow type
- Comparison table: without vs with CC10x

**Notable Features:**
- Visual ASCII diagrams showing agent chains
- Version highlights documenting evolution
- Expected behavior examples for each workflow
- Memory persistence structure explanation
- Plan → Build automation documentation

---

#### 2. `CLAUDE.md`
**Path:** `/CLAUDE.md`
**Purpose:** Global configuration template for CC10x router
**Key Content:**
- CC10x Orchestration directives (always on)
- Entry point definition: `cc10x:cc10x-router`
- Complementary skills table template for domain-specific skills
- Skill naming conventions (plugin vs personal/project skills)
- Installation instructions for Claude Code to set up CC10x

**Notable Features:**
- Directives requiring router invocation on ANY development task
- Skip conditions (explicit opt-out phrases only)
- Complementary Skills table structure for integrating domain-specific skills
- Skills Index format for plugin skills

---

#### 3. `CHANGELOG.md`
**Path:** `/CHANGELOG.md`
**Purpose:** Detailed version history with feature additions, fixes, and rationale
**Key Content:**
- 60+ versions documented (v4.8.0 to v6.0.18)
- Version 6.0.x series: Orchestration hardening, SKILL_HINTS implementation
- Version 5.x series: Task-based orchestration, memory persistence, parallel execution
- Version 4.8.x series: Refactoring and pattern consolidation
- Each version includes: Added features, Changed behavior, Fixed bugs, Rationale

**Notable Features:**
- Detailed technical rationale for each change
- Orchestration safety protocol documentation
- Risk level classification (ADJACENT, SAFE, CRITICAL)
- Cross-references between versions
- Legacy compatibility notes

---

#### 4. `claude-settings-template.json`
**Path:** `/claude-settings-template.json`
**Purpose:** Claude Code permissions template for CC10x operations
**Key Content:**
```json
{
  "permissions": {
    "allow": [
      "Bash(mkdir -p .claude/cc10x)",
      "Bash(mkdir -p docs/plans)",
      "Bash(mkdir -p docs/research)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git blame:*)",
      "Bash(git ls-files:*)"
    ]
  }
}
```

**Notable Features:**
- Permission-free directory creation for memory files
- Research and plan directory permissions
- Git operation permissions for code analysis
- Wildcard permissions for flexible git operations

---

### Configuration Files

#### 5. `.claude-plugin/marketplace.json`
**Path:** `/.claude-plugin/marketplace.json`
**Purpose:** Claude Code plugin marketplace listing
**Key Content:**
- Plugin metadata: name, version, description
- Author information: name, email, URL
- Repository and license information
- Keywords for search: workflow-routing, code-review, tdd, debugging, planning, memory-persistence, etc.
- Category: development-tools
- Source: `./plugins/cc10x`

**Notable Features:**
- Plugin registration with Claude Code marketplace
- Version synchronization with plugin.json
- Keyword-based discoverability

---

#### 6. `plugins/cc10x/.claude-plugin/plugin.json`
**Path:** `/plugins/cc10x/.claude-plugin/plugin.json`
**Purpose:** Plugin configuration and metadata
**Key Content:**
- Plugin name, version, description
- Author information
- Repository URL, homepage, license
- Keywords list for categorization

**Notable Features:**
- Plugin identification for Claude Code
- Version tracking
- Category classification

---

### Documentation Files

#### 7. `docs/cc10x-orchestration-bible.md`
**Path:** `/docs/cc10x-orchestration-bible.md`
**Purpose:** Canonical specification of orchestration rules (plugin-only source of truth)
**Key Content:**
- Glossary of plugin terms (Router, Workflow, Agents, Skills, Memory, Router Contract, Dev Journal)
- Skills vs Agents distinction with Claude Code platform concepts
- Orchestration invariants (8 non-negotiable rules)
- Decision tree for routing (ERROR → DEBUG, PLAN → PLAN, REVIEW → REVIEW, DEFAULT → BUILD)
- Task-based orchestration patterns
- Agent chain protocols
- Memory protocol (load, update, template validation)
- Research protocol
- Skill loading hierarchy
- Agent output requirements
- Router contract validation logic
- Critical gating checklist

**Notable Features:**
- "Bible" designation as canonical source of truth
- Sync status tracking (last synced 2026-02-05)
- Mermaid diagrams for workflows
- YAML contract specifications
- Task type prefixes and purposes
- Remediation re-review loop documentation

---

#### 8. `docs/cc10x-orchestration-logic-analysis.md`
**Path:** `/docs/cc10x-orchestration-logic-analysis.md`
**Purpose:** Technical documentation explaining HOW the system works
**Key Content:**
- System architecture overview with component diagram
- 6 agents with roles, workflows, modes, and memory access
- 12 skills with purposes and usage
- 3 memory files with purposes
- Orchestration flow phases (0-5)
- Chain execution loop (heart of orchestration)
- Task hierarchy structures
- English tricks and patterns (permission-free operations, gate enforcement, confidence scoring)
- Agent → Skill mapping
- Memory flow documentation
- Research flow (three-phase pattern)
- Handoff patterns (Router→Agent, Agent→Router, Plan→Build)
- Verification flow
- Task coordination mechanics

**Notable Features:**
- "English orchestration" insight (everything is implemented through carefully crafted English text)
- Hydration pattern explanation (Tasks + Memory files)
- Cross-session coordination documentation
- Decision guide for when to use Tasks
- The 3-Task Rule

---

## Agent Definitions

CC10x includes 6 specialized agents, each with specific frontmatter, skills, and responsibilities:

### 1. **cc10x:component-builder**
**File:** `/plugins/cc10x/agents/component-builder.md`
**Role:** Builds features using TDD cycle (RED → GREEN → REFACTOR)
**Mode:** WRITE (has Edit tool)
**Color:** green
**Skills:**
- cc10x:session-memory
- cc10x:test-driven-development
- cc10x:code-generation
- cc10x:verification-before-completion
- cc10x:frontend-patterns
- cc10x:architecture-patterns

**Tools:** Read, Edit, Write, Bash, Grep, Glob, Skill, LSP, AskUserQuestion, WebFetch

**Key Behaviors:**
- TDD enforcement: RED test first (exit 1), GREEN code (exit 0), REFACTOR
- Plan file check: MUST read plan before building
- Pre-implementation checklist: API, UI, DB, edge cases
- Memory updates: Direct Edit to `.claude/cc10x/*.md`
- Router Contract: STATUS requires TDD_RED_EXIT=1 AND TDD_GREEN_EXIT=0

**Output Format:**
- Dev Journal (transparency)
- TDD Evidence (RED/GREEN phases with exit codes)
- Changes Made
- Assumptions
- Findings
- Router Contract (YAML)

---

### 2. **cc10x:bug-investigator**
**File:** `/plugins/cc10x/agents/bug-investigator.md`
**Role:** Evidence-first debugging with LOG BEFORE FIX approach
**Mode:** WRITE (has Edit tool)
**Color:** red
**Skills:**
- cc10x:session-memory
- cc10x:debugging-patterns
- cc10x:test-driven-development
- cc10x:verification-before-completion
- cc10x:architecture-patterns
- cc10x:frontend-patterns

**Tools:** Read, Edit, Write, Bash, Grep, Glob, Skill, LSP, AskUserQuestion, WebFetch

**Key Behaviors:**
- LOG FIRST: Evidence before hypothesizing
- TDD enforcement for bug fixes (regression test first)
- Anti-Hardcode Gate: Variant scanning (locale, config, roles, platform, time, data, concurrency, network, caching)
- Debug attempt format: `[DEBUG-N]: {what was tried} → {result}`
- Variant coverage: MUST cover non-default cases
- Memory updates: Root cause → patterns.md, TDD evidence → progress.md

**Output Format:**
- Dev Journal (investigation path)
- Root Cause Analysis
- TDD Evidence (RED/GREEN with variants)
- Variant Coverage
- Evidence (command results)
- Router Contract (YAML with ROOT_CAUSE, TDD evidence, VARIANTS_COVERED)

---

### 3. **cc10x:code-reviewer**
**File:** `/plugins/cc10x/agents/code-reviewer.md`
**Role:** Multi-dimensional review with confidence ≥80
**Mode:** READ-ONLY (no Edit tool)
**Color:** blue
**Skills:**
- cc10x:code-review-patterns
- cc10x:verification-before-completion
- cc10x:frontend-patterns
- cc10x:architecture-patterns

**Tools:** Read, Bash, Grep, Glob, Skill, LSP, AskUserQuestion, WebFetch

**Key Behaviors:**
- Confidence scoring: Only report issues ≥80
- Two-stage review: Spec compliance first, then code quality
- Git context: Checks recent commits and blame
- Memory Notes: Outputs learnings for router persistence
- CRITICAL issues block shipping

**Output Format:**
- Dev Journal (review approach)
- Summary (functionality, verdict)
- Critical Issues (≥80 confidence)
- Important Issues (≥80 confidence)
- Findings
- Router Handoff (stable extraction)
- Memory Notes (for persistence)
- Router Contract (YAML with STATUS=APPROVE/CHANGES_REQUESTED)

---

### 4. **cc10x:silent-failure-hunter**
**File:** `/plugins/cc10x/agents/silent-failure-hunter.md`
**Role:** Find empty catches, log-only handlers, generic errors
**Mode:** READ-ONLY (no Edit tool)
**Color:** red
**Skills:**
- cc10x:code-review-patterns
- cc10x:verification-before-completion
- cc10x:frontend-patterns
- cc10x:architecture-patterns

**Tools:** Read, Bash, Grep, Glob, Skill, LSP, AskUserQuestion, WebFetch

**Key Behaviors:**
- Zero tolerance for silent failures
- Severity rubric: CRITICAL (data loss/security), HIGH (wrong behavior), MEDIUM (suboptimal), LOW (style)
- CRITICAL issues MUST be fixed before shipping
- Memory Notes: Outputs patterns found

**Output Format:**
- Dev Journal (hunt approach)
- Summary (handlers audited, issue counts)
- Critical Issues (blocks shipping)
- High Issues (should fix)
- Verified Good (proper handling)
- Router Handoff
- Memory Notes
- Router Contract (YAML with STATUS=CLEAN/ISSUES_FOUND)

---

### 5. **cc10x:integration-verifier**
**File:** `/plugins/cc10x/agents/integration-verifier.md`
**Role:** End-to-end validation with exit code evidence
**Mode:** READ-ONLY (no Edit tool)
**Color:** yellow
**Skills:**
- cc10x:architecture-patterns
- cc10x:debugging-patterns
- cc10x:verification-before-completion
- cc10x:frontend-patterns

**Tools:** Read, Bash, Grep, Glob, Skill, LSP, AskUserQuestion, WebFetch

**Key Behaviors:**
- E2E scenarios with PASS/FAIL evidence
- Network failures, invalid responses, auth expiry testing
- Rollback decision tree (Create Fix Task, Revert Branch, Document & Continue)
- Memory Notes: Integration insights

**Output Format:**
- Dev Journal (verification approach)
- Summary (overall, scenarios passed/blockers)
- Scenarios (table with results and evidence)
- Rollback Decision (if FAIL)
- Router Handoff
- Memory Notes
- Router Contract (YAML with STATUS=PASS/FAIL, SCENARIOS_PASSED)

---

### 6. **cc10x:planner**
**File:** `/plugins/cc10x/agents/planner.md`
**Role:** Create comprehensive implementation plans
**Mode:** WRITE (Edit for plan files + memory)
**Color:** cyan
**Skills:**
- cc10x:session-memory
- cc10x:planning-patterns
- cc10x:architecture-patterns
- cc10x:brainstorming
- cc10x:frontend-patterns

**Tools:** Read, Edit, Write, Bash, Grep, Glob, Skill, LSP, AskUserQuestion, WebFetch

**Key Behaviors:**
- Clarification gate: Requirements before planning
- Conditional research for new/unfamiliar tech
- Confidence scoring (1-10) with factors
- Two-step save: Plan file + memory update
- Context retrieval pattern (DISPATCH → EVALUATE → REFINE)
- Plan phases: MVP → Phase 2 → Phase 3

**Output Format:**
- Dev Journal (planning process)
- Summary (phases, risks, decisions)
- Recommended Skills for BUILD
- Confidence Score
- Key Assumptions
- Findings
- Router Contract (YAML with STATUS=PLAN_CREATED, PLAN_FILE, PHASES, RISKS)

---

## Skills Inventory

CC10x includes 12 composable skills organized by purpose:

### Core Orchestration Skills

#### 1. **cc10x:cc10x-router** (Entry Point)
**File:** `/plugins/cc10x/skills/cc10x-router/SKILL.md`
**Purpose:** THE ONLY ENTRY POINT - detects intent and routes to workflows
**Trigger Keywords:** build, implement, create, make, write, add, develop, code, feature, component, app, application, review, audit, check, analyze, debug, fix, error, bug, broken, troubleshoot, plan, design, architect, roadmap, strategy, and 30+ more

**Key Functions:**
- Decision tree: ERROR → DEBUG | PLAN → PLAN | REVIEW → REVIEW | → BUILD
- Memory loading and validation
- Task hierarchy creation
- Chain execution loop
- Agent invocation with SKILL_HINTS
- Router contract validation
- Remediation re-review loop
- Parallel execution coordination

**Notable Features:**
- 80+ trigger keywords for comprehensive coverage
- Template validation gate (auto-heal missing sections)
- Orphan task detection
- Circuit breaker for 3+ remediation attempts
- SKILL_HINTS bridge for forked agents

---

#### 2. **cc10x:session-memory** (Persistence)
**File:** `/plugins/cc10x/skills/session-memory/SKILL.md`
**Purpose:** Memory persistence across sessions (7-layer architecture)
**Allowed Tools:** Read, Write, Edit, Bash

**Memory Files:**
1. `.claude/cc10x/activeContext.md` - Current focus, decisions, learnings
2. `.claude/cc10x/patterns.md` - Project conventions, gotchas
3. `.claude/cc10x/progress.md` - What's done, verification evidence

**Key Protocols:**
- Iron Law: LOAD at START, UPDATE at END
- Permission-free operations (specific tools avoid prompts)
- Read-Edit-Verify pattern (mandatory for every edit)
- Stable anchors (7 guaranteed section headers)
- Promotion ladder (observation → pattern → artifact → evidence)
- Pre-compaction memory safety

**Notable Features:**
- Permission-free file operations guide
- File purpose matrix (which file for what)
- Decision integration checklist
- Memory update templates
- Rationalization prevention table

---

### Development Process Skills

#### 3. **cc10x:test-driven-development**
**File:** `/plugins/cc10x/skills/test-driven-development/SKILL.md`
**Purpose:** TDD cycle enforcement (RED → GREEN → REFACTOR)
**Allowed Tools:** Read, Grep, Glob, Bash, Write, Edit

**Key Protocols:**
- Iron Law: NO PRODUCTION CODE WITHOUT FAILING TEST FIRST
- RED Phase: Write failing test (MUST exit 1)
- GREEN Phase: Minimal code (MUST exit 0)
- REFACTOR Phase: Clean up, keep tests green
- Coverage threshold: 80%+ for branches, functions, lines, statements

**Notable Features:**
- Test smells table (8 anti-patterns)
- Mocking patterns (Supabase, Fetch, Redis, env, time)
- Factory pattern for tests
- Rationalization prevention
- Verification checklist
- Output format template

---

#### 4. **cc10x:code-generation**
**File:** `/plugins/cc10x/skills/code-generation/SKILL.md`
**Purpose:** Expert code writing with understanding first
**Allowed Tools:** Read, Grep, Glob, Write, Edit, LSP

**Key Protocols:**
- Iron Law: NO CODE BEFORE UNDERSTANDING FUNCTIONALITY AND PATTERNS
- Universal Questions (8 questions before writing)
- Context-dependent flows (UI, API, Business Logic, Database)
- Minimal diffs principle (only what's necessary)
- Edge cases handling

**Notable Features:**
- LSP-powered code analysis
- Universal questions checklist
- YAGNI enforcement
- Output format with functionality documentation
- Common patterns (functions, components, error handling)

---

#### 5. **cc10x:debugging-patterns**
**File:** `/plugins/cc10x/skills/debugging-patterns/SKILL.md`
**Purpose:** Systematic debugging with root cause investigation
**Allowed Tools:** Read, Grep, Glob, Bash, LSP

**Key Protocols:**
- Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
- 4-Phase process: Root Cause → Pattern → Hypothesis → Implementation
- LSP-powered root cause tracing
- Hypothesis quality criteria (falsifiability)
- Cognitive biases awareness (confirmation, anchoring, availability, sunk cost)

**Notable Features:**
- Debugging scenarios (build errors, test failures, runtime errors, intermittent failures)
- Git bisect workflow
- Meta-debugging (debugging your own code)
- When to restart investigation
- Output format template

---

#### 6. **cc10x:verification-before-completion**
**File:** `/plugins/cc10x/skills/verification-before-completion/SKILL.md`
**Purpose:** Evidence-based verification (exit codes, commands)
**Allowed Tools:** Read, Grep, Glob, Bash, LSP

**Key Protocols:**
- Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
- Gate function: IDENTIFY → RUN → READ → VERIFY → REFLECT → CLAIM
- Goal-backward lens (Truths → Artifacts → Wiring)
- Stub detection patterns
- Wiring verification (Component → API → Database)

**Notable Features:**
- Validation levels (1: Syntax, 2: Unit, 3: Integration, 4: Manual)
- Self-critique gate before verification (universal
- Stub patterns, React, API, function)
- Export/import verification
- Auth protection verification

---

### Review & Analysis Skills

#### 7. **cc10x:code-review-patterns**
**File:** `/plugins/cc10x/skills/code-review-patterns/SKILL.md`
**Purpose:** Multi-dimensional code review (security, quality, performance)
**Allowed Tools:** Read, Grep, Glob, LSP

**Key Protocols:**
- Iron Law: NO CODE QUALITY REVIEW BEFORE SPEC COMPLIANCE
- Two-stage: Spec Compliance → Code Quality
- Confidence scoring (≥80 to report)
- Severity classification (CRITICAL, MAJOR, MINOR, NIT)
- Pattern recognition criteria

**Notable Features:**
- Security review checklist (OWASP Top 10)
- LSP-powered code analysis
- Hidden failure patterns table
- UX and accessibility checklists
- Review loop protocol

---

#### 8. **cc10x:brainstorming**
**File:** `/plugins/cc10x/skills/brainstorming/SKILL.md`
**Purpose:** Ideas → designs through collaborative dialogue
**Allowed Tools:** Read, Grep, Glob, AskUserQuestion

**Key Protocols:**
- Iron Law: NO DESIGN WITHOUT UNDERSTANDING PURPOSE AND CONSTRAINTS
- Phase 1: Understand Context
- Phase 2: Explore Idea (one question at a time)
- Phase 3: Explore Approaches (2-3 options with trade-offs)
- Phase 4: Present Design Incrementally

**Notable Features:**
- Multiple choice questions preference
- YAGNI enforcement
- Incremental validation
- UI mockup ASCII art
- Design document template

---

### Architecture & Design Skills

#### 9. **cc10x:architecture-patterns**
**File:** `/plugins/cc10x/skills/architecture-patterns/SKILL.md`
**Purpose:** System design from functionality flows
**Allowed Tools:** Read, Grep, Glob, LSP

**Key Protocols:**
- Iron Law: NO ARCHITECTURE DESIGN BEFORE FUNCTIONALITY FLOWS ARE MAPPED
- Phase 1: Map Functionality Flows (User, Admin, System)
- Phase 2: Map to Architecture Components
- Phase 3: Design Components
- C4 views (Context, Container, Component)

**Notable Features:**
- LSP-powered architecture analysis
- API design checklist
- Integration patterns (retry, circuit breaker, queue, WebSocket)
- Observability design
- Decision framework with trade-off tables

---

#### 10. **cc10x:planning-patterns**
**File:** `/plugins/cc10x/skills/planning-patterns/SKILL.md`
**Purpose:** Write comprehensive executable plans
**Allowed Tools:** Read, Grep, Glob, AskUserQuestion, LSP

**Key Protocols:**
- Iron Law: NO VAGUE STEPS - EVERY STEP IS SPECIFIC ACTION
- Bite-sized task granularity (2-5 minutes per step)
- Plan document header
- Context references section (file:line anchors)
- Validation levels by risk
- Risk assessment table

**Notable Features:**
- Task structure template (files, test, steps)
- Risk-based testing matrix
- ADR format for decisions
- Two-step save (plan file + memory)
- Task-based execution tracking

---

### Frontend & UI Skills

#### 11. **cc10x:frontend-patterns**
**File:** `/plugins/cc10x/skills/frontend-patterns/SKILL.md`
**Purpose:** UI/UX patterns with accessibility and performance
**Allowed Tools:** Read, Grep, Glob, LSP

**Key Protocols:**
- Iron Law: NO UI DESIGN BEFORE USER FLOW IS UNDERSTOOD
- Loading state order (error → loading → empty → success)
- Design thinking pre-code (purpose, tone, constraints, differentiation)
- Motion & animation rules
- Typography rules

**Notable Features:**
- Error handling hierarchy
- Skeleton vs spinner decision
- Typography rules (ellipsis, quotes, units)
- Content overflow handling
- WCAG 2.1 AA accessibility checklist
- Form best practices
- Light/dark mode rules
- Anti-patterns blocklist

---

### Research Skills

#### 12. **cc10x:github-research**
**File:** `/plugins/cc10x/skills/github-research/SKILL.md`
**Purpose:** External code research from GitHub and docs
**Allowed Tools:** WebFetch, WebSearch, AskUserQuestion, MCP tools (octocode, brightdata, context7), Read, Write, Edit, Bash

**Key Protocols:**
- Iron Law: NO EXTERNAL RESEARCH WITHOUT CLEAR AI KNOWLEDGE GAP OR EXPLICIT USER REQUEST
- User confirmation gate (required before research)
- 3-tier research chain:
  - Tier 1: Parallel search (Octocode + Bright Data)
  - Tier 2: Native Claude Code (WebSearch + WebFetch)
  - Tier 3: Ask User for Context

**Notable Features:**
- Checkpoint pattern (incremental saves during long research)
- Availability check for MCPs
- Merge strategy (Octocode for code, Bright Data for docs)
- Research persistence (docs/research/, memory link, patterns.md)
- Output format template

---

## MCP Servers & Tools

CC10x leverages multiple MCP servers for enhanced capabilities:

### Primary MCPs Used

#### 1. **Octocode MCP** (`mcp__octocode__*`)
**Purpose:** GitHub code search and research
**Tools Used:**
- `mcp__octocode__githubSearchCode` - Search code across GitHub
- `mcp__octocode__githubSearchRepositories` - Find repositories
- `mcp__octocode__githubViewRepoStructure` - View repository structure
- `mcp__octocode__githubGetFileContent` - Get file contents
- `mcp__octocode__githubSearchPullRequests` - Search PRs for patterns
- `mcp__octocode__packageSearch` - Search package registries

**Usage:**
- Used by github-research skill
- Used by planner for technology research
- Used by bug-investigator for external error patterns

---

#### 2. **Bright Data MCP** (`mcp__brightdata__*`)
**Purpose:** Web search and documentation scraping
**Tools Used:**
- `mcp__brightdata__search_engine` - Google/Bing search
- `mcp__brightdata__scrape_as_markdown` - Convert docs to markdown

**Usage:**
- Used by github-research skill
- Tier 1 parallel search with Octocode
- Documentation research for planning

---

#### 3. **Context7 MCP** (`mcp__context7__*`)
**Purpose:** Library documentation retrieval
**Tools Used:**
- `mcp__context7__resolve-library-id` - Find library ID
- `mcp__context7__query-docs` - Query documentation

**Usage:**
- Library documentation research
- API reference lookup
- Framework best practices

---

#### 4. **Native Claude Code Tools**
**Always Available:**
- `WebSearch` - Native web search
- `WebFetch` - Fetch URL content
- `AskUserQuestion` - Interactive user questions
- `Read` - Read files (permission-free)
- `Write` - Write new files (permission-free)
- `Edit` - Edit existing files (permission-free)
- `Bash` - Execute commands
- `Grep` - Search file contents
- `Glob` - Find files by pattern
- `TaskCreate` - Create tasks
- `TaskUpdate` - Update task status
- `TaskList` - List tasks
- `TaskGet` - Get task details
- `Skill` - Load skills
- `LSP` - Language Server Protocol

**Usage:**
- All agents and skills
- Memory persistence
- Code analysis
- Workflow orchestration

---

## Workflows

CC10x defines 4 main workflows triggered by intent detection:

### 1. BUILD Workflow

**Trigger Keywords:** build, implement, create, make, write, add, develop, code, feature, component, app, application

**Agent Chain:**
```
component-builder → [code-reviewer ∥ silent-failure-hunter] → integration-verifier
                    ↑ PARALLEL EXECUTION ↑
```

**Steps:**
1. Load memory → Check progress.md (already done?)
2. Clarify requirements → AskUserQuestion (REQUIRED)
3. Create task hierarchy
4. Execute chain with dependencies
5. Update memory when ALL tasks completed

**Key Features:**
- TDD enforcement (RED → GREEN → REFACTOR)
- Parallel review and silent failure hunting
- E2E verification before completion
- Re-review loop after remediation
- Memory persistence at workflow end

---

### 2. DEBUG Workflow

**Trigger Keywords:** debug, fix, error, bug, broken, troubleshoot, issue, problem, doesn't work

**Agent Chain:**
```
bug-investigator → code-reviewer → integration-verifier
```

**Steps:**
1. Load memory → Check patterns.md Common Gotchas
2. Clarify error → AskUserQuestion (REQUIRED)
3. Check research triggers:
   - User explicitly requested research?
   - External service error?
   - 3+ local debugging attempts failed?
4. Execute research if triggered
5. Create task hierarchy
6. Execute chain
7. Update memory → Add to Common Gotchas

**Key Features:**
- LOG FIRST approach (evidence before fixes)
- Regression test enforcement
- Variant coverage (non-default cases)
- Debug attempt tracking format: `[DEBUG-N]: {attempt} → {result}`
- Circuit breaker for 3+ failures (research recommendation)

---

### 3. REVIEW Workflow

**Trigger Keywords:** review, audit, check, analyze, assess, "what do you think", "is this good"

**Agent Chain:**
```
code-reviewer (single agent)
```

**Steps:**
1. Load memory
2. Clarify scope → AskUserQuestion (REQUIRED)
   - Entire codebase OR specific files?
   - Focus area: security/performance/quality/all?
   - Blocking issues only OR all findings?
3. Create task hierarchy
4. Execute
5. Update memory

**Key Features:**
- Confidence scoring (≥80 to report)
- Two-stage review (spec compliance → quality)
- Git context (recent changes, blame)
- CRITICAL issues block shipping
- Memory Notes for patterns discovered

---

### 4. PLAN Workflow

**Trigger Keywords:** plan, design, architect, roadmap, strategy, spec, "before we build", "how should we"

**Agent Chain:**
```
planner (single agent)
```

**Steps:**
1. Load memory
2. If github-research detected:
   - Execute research FIRST
   - Persist to docs/research/
   - Update memory
3. Create task hierarchy
4. Execute (pass research results)
5. Update memory → Reference saved plan

**Key Features:**
- Clarification gate (requirements before planning)
- Conditional research for new tech
- Confidence scoring (1-10)
- Two-step save (plan file + memory)
- Plan phases (MVP → Phase 2 → Phase 3)

---

## Directives & Rules

### Core Directives (from AGENTS.md-like principles)

#### 1. Router Supremacy
- cc10x-router is THE ONLY ENTRY POINT
- Never bypass the router
- Always invoke router on ANY development task
- Skip ONLY when user EXPLICITLY says "don't use cc10x"

#### 2. Memory Mandatory
- Load memory at START of any workflow
- Update memory at END of any workflow
- Memory survives context compaction
- Permission-free operations (specific tool patterns)

#### 3. Evidence-Based Claims
- No completion claims without fresh verification
- Exit code evidence required
- Command execution for verification
- Exit code 0 = success, non-zero = failure

#### 4. TDD Enforcement (for BUILD/DEBUG)
- RED test first (MUST exit 1)
- GREEN code second (MUST exit 0)
- REFACTOR last (tests stay green)
- No production code without failing test

#### 5. Parallel Safety
- code-reviewer + silent-failure-hunter run in parallel
- Both invoked in SAME message
- No memory edits during parallel phases
- Memory Notes for READ-ONLY agents

#### 6. Task-Based Orchestration
- All workflows use Tasks with dependencies
- Parent → Agent hierarchy
- blockedBy for dependency chains
- Namespaced subjects: `CC10X BUILD:`, `CC10X DEBUG:`, etc.

#### 7. Confidence Scoring
- code-reviewer: Only report issues ≥80 confidence
- planner: Score plans 1-10 with factors
- Reduces false positives, improves signal

#### 8. Critical Issue Blocking
- CRITICAL security/correctness issues block shipping
- silent-failure-hunter CRITICAL issues require fix
- Re-review loop after remediation
- No unreviewed changes ship

---

## Scripts & Utilities

While CC10x doesn't include traditional bash scripts, it defines several command patterns:

### Memory Operations
```bash
# Create memory directory
mkdir -p .claude/cc10x

# Load memory files
Read .claude/cc10x/activeContext.md
Read .claude/cc10x/patterns.md
Read .claude/cc10x/progress.md
```

### Research Persistence
```bash
mkdir -p docs/research
Write docs/research/YYYY-MM-DD-topic-research.md
git add docs/research/*.md
git commit -m 'docs: add topic research'
```

### Plan Persistence
```bash
mkdir -p docs/plans
Write docs/plans/YYYY-MM-DD-feature-plan.md
git add docs/plans/*.md
git commit -m 'docs: add feature plan'
```

### Git Context Commands
```bash
git status                              # Current working state
git diff HEAD                           # ALL changes
git log --oneline -10 -- <file>        # Recent commits
git blame <file> -L <start>,<end>      # Authorship
```

### Test & Verification Commands
```bash
npm test                               # All tests
npm test -- --grep "pattern"           # Specific test
npm run lint                           # Linting
tsc --noEmit                           # Type check
npm run build                          # Build
```

---

## Unique Features

### 1. Intelligent Router (cc10x-router)
- Automatic intent detection via keywords
- Routes to appropriate workflow (BUILD/DEBUG/REVIEW/PLAN)
- Creates task hierarchies
- Coordinates agent chains
- Validates outputs via Router Contracts
- Circuit breaker for failed remediation

**What We Don't Have:** Our NSO framework lacks automatic intent detection and routing.

---

### 2. Task-Based Orchestration
- Claude Code Tasks integration
- Dependency chains via blockedBy
- Parent → Agent task hierarchy
- Namespaced subjects for safety
- Cross-session continuity

**What We Don't Have:** Our NSO uses manual coordination without Tasks system.

---

### 3. Multi-Layer Memory Architecture
- 3 persistent memory files
- Survival across context compaction
- Permission-free operation patterns
- Template validation with auto-heal
- Promotion ladder for information

**What We Don't Have:** Our NSO doesn't have structured memory persistence.

---

### 4. Parallel Agent Execution
- code-reviewer + silent-failure-hunter run in parallel
- Both invoked in single message
- Memory Notes for parallel safety
- Results collection and merging

**What We Don't Have:** Our NSO lacks parallel execution capabilities.

---

### 5. Router Contract System
- Machine-readable YAML output from agents
- STATUS field for validation
- Blocking/Remediation flags
- Memory Notes structured extraction
- Automated re-review loop

**What We Don't Have:** Our NSO lacks formal contract system for validation.

---

### 6. Anti-Hardcode Gate
- Bug-investigator scans for variants
- Tests cover non-default cases
- Prevents patchy/hardcoded fixes
- Variant dimensions checklist

**What We Don't Have:** Our NSO doesn't enforce variant testing.

---

### 7. Circuit Breaker for Debugging
- Tracks debug attempts: `[DEBUG-N]: {attempt} → {result}`
- Triggers external research after 3+ failures
- Recommends research best practices
- Prevents endless local debugging

**What We Don't Have:** Our NSO lacks automated circuit breaking for debugging.

---

### 8. Evidence-Based Verification
- Exit code requirements
- Command execution evidence
- Goal-backward lens (Truths → Artifacts → Wiring)
- Stub detection patterns
- Wiring verification (Component → API → Database)

**What We Don't Have:** Our NSO has basic verification but lacks structured evidence collection.

---

### 9. Confidence Scoring
- code-reviewer: ≥80 confidence threshold
- planner: 1-10 scoring with factors
- Reduces false positives
- Improves signal quality

**What We Don't Have:** Our NSO lacks confidence scoring system.

---

### 10. Remediation Re-Review Loop
- After any code fix, re-review required
- Re-runs reviewer + hunter
- Only then integration verification
- Prevents unreviewed changes

**What We Don't Have:** Our NSO lacks automated re-review enforcement.

---

### 11. Complementary Skills Bridge
- Router reads CLAUDE.md Complementary Skills table
- Passes matching skills via SKILL_HINTS
- Forked agents invoke conditional skills
- Bridges main context and sub-agent context

**What We Don't Have:** Our NSO doesn't have skill bridging mechanism.

---

### 12. Permission-Free Operations
- Specific tool patterns avoid permission prompts
- Edit vs Write distinction
- Read tool instead of cat
- mkdir as single command
- Enables seamless automation

**What We Don't Have:** Our NSO doesn't have systematic permission-free patterns.

---

## Comparison Notes

### Gaps in Our NSO Framework

Based on CC10x analysis, our framework is missing:

1. **Intelligent Router** - No automatic intent detection and routing
2. **Task-Based Orchestration** - No Claude Code Tasks integration
3. **Multi-Layer Memory** - No persistence across sessions
4. **Parallel Execution** - No parallel agent capabilities
5. **Router Contracts** - No formal validation contracts
6. **Confidence Scoring** - No confidence thresholds
7. **Evidence-Based Verification** - No exit code enforcement
8. **Remediation Re-Review** - No re-review loop enforcement
9. **Debug Circuit Breaker** - No automated research triggers
10. **Variant Testing Gate** - No non-default case coverage
11. **Complementary Skills Bridge** - No context bridging
12. **Permission-Free Patterns** - No systematic approach

### Potential Integrations

1. **MCP Integration** - Add Octocode, Bright Data, Context7 MCPs
2. **Skills System** - Adopt skill composition pattern
3. **Agent Specialization** - Create specialized agents like CC10x
4. **Memory Architecture** - Implement 3-layer memory
5. **Task System** - Integrate Claude Code Tasks

### Anti-Patterns to Avoid

1. **Don't skip verification** - CC10x shows this is non-negotiable
2. **Don't skip memory** - Evidence shows context loss causes rework
3. **Don't skip TDD** - Without enforcement, quality suffers
4. **Don't skip research persistence** - Context compaction loses insights
5. **Don't skip re-review** - Unreviewed code ships with bugs

---

## Summary Statistics

| Component | Count |
|-----------|-------|
| Agents | 6 |
| Skills | 12 |
| Workflows | 4 |
| Memory Files | 3 |
| MCP Servers Used | 4+ |
| Trigger Keywords (Router) | 80+ |
| Version History Entries | 60+ |
| Unique Features | 12+ |

---

## Files Reference

| Path | Purpose | Lines |
|------|---------|-------|
| README.md | Main documentation | 520 |
| CLAUDE.md | Global configuration | 38 |
| CHANGELOG.md | Version history | 1170+ |
| marketplace.json | Plugin metadata | 42 |
| plugin.json | Plugin config | 26 |
| orchestration-bible.md | Canonical spec | 605 |
| orchestration-logic-analysis.md | Technical guide | 699 |
| cc10x-router/SKILL.md | Router skill | 674 |
| session-memory/SKILL.md | Memory skill | 556 |
| test-driven-development/SKILL.md | TDD skill | 471 |
| code-generation/SKILL.md | Code gen skill | 325 |
| debugging-patterns/SKILL.md | Debug skill | 537 |
| code-review-patterns/SKILL.md | Review skill | 388 |
| planning-patterns/SKILL.md | Planning skill | 510 |
| architecture-patterns/SKILL.md | Architecture skill | 361 |
| frontend-patterns/SKILL.md | Frontend skill | 583 |
| brainstorming/SKILL.md | Brainstorming skill | 365 |
| github-research/SKILL.md | Research skill | 432 |
| verification-before-completion/SKILL.md | Verification skill | 399 |
| component-builder.md | Builder agent | 155 |
| bug-investigator.md | Debug agent | 201 |
| code-reviewer.md | Reviewer agent | 139 |
| silent-failure-hunter.md | Hunter agent | 160 |
| integration-verifier.md | Verifier agent | 146 |
| planner.md | Planner agent | 202 |

---

**Document Created:** February 7, 2026
**Analysis Version:** 1.0
**CC10x Version Analyzed:** 6.0.18
