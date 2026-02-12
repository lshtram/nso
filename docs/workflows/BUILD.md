# BUILD Workflow

**Purpose:** Implement new features from requirements to deployment.

**Trigger:** User describes a new feature, invokes `/new-feature`, or Oracle detects BUILD intent.

---

## Agent Chain

```
Analyst (Discovery) → Oracle (Architecture) → Builder (Implementation) → Janitor (Validation) → CodeReviewer (Quality) → Oracle (Accountability) → Librarian (Closure)
```

| Phase | Agent | Responsibility |
|-------|-------|----------------|
| 0. Worktree | Oracle | Branch isolation (mandatory) |
| 1. Discovery | Analyst | Requirements gathering |
| 2. Architecture | Oracle | Technical design |
| 3. Implementation | Builder | Code development (TDD) |
| 4A. Validation | Janitor | Spec compliance + automated harness |
| 4B. Code Review | CodeReviewer | Independent quality review |
| 5. Closure | Librarian | Memory persistence, post-mortem |

---

## Phase 0: Worktree Setup (Oracle)

**Agent:** Oracle

**Action:** Create isolated branch for this feature.

```bash
git worktree add -b feat/[feature-name] .worktrees/feat/[feature-name] [base-branch]
```

**Safety Checks (all must pass):**
1. `.worktrees/` is in `.gitignore`
2. Base branch is up to date (`git pull`)
3. Baseline tests pass (if they exist)

**Exception:** Skip if user explicitly says "no worktree" OR change is trivial (< 3 files estimated).

**Context:** Once active, ALL delegations must target `.worktrees/[branch-name]` — no agent may modify the root directory.

---

## Phase 1: Discovery (Analyst)

**Agent:** Analyst (`task(subagent_type="Analyst")`)

**Skills Used:**
- `rm-intent-clarifier` — Clarify ambiguous user intent
- `rm-validate-intent` — Verify requirements match intent
- `rm-multi-perspective-audit` — Security/SRE/UX review

**Inputs:**
- User request (via Oracle's `contract.md`)
- Existing memory files (`.opencode/context/01_memory/`)
- Project context

**Process:**
- Analyst interacts with user one question at a time (200-300 word sections)
- Applies YAGNI check to each requirement
- Produces structured REQ document

**Outputs:**
- Requirements document: `docs/requirements/REQ-<Feature-Name>.md`
- `result.md` in task workspace

**Contract (Oracle writes before delegation):**
```yaml
contract:
  workflow: BUILD
  phase: DISCOVERY
  agent: Analyst
  user_request: "<original request>"
  worktree_path: ".worktrees/feat/[name]"
  deliverable: "REQ-<Feature-Name>.md"
```

**Gate:** User MUST approve REQ document before proceeding to Architecture.

---

## Phase 2: Architecture (Oracle)

**Agent:** Oracle (direct)

**Skills Used:**
- `architectural-review` — Self-critique of architecture

**Inputs:**
- Approved REQ document
- Project context and existing architecture

**Process:**
- Draft TECHSPEC in `docs/architecture/`
- Reference the approved REQ document
- Apply `architectural-review` skill for self-critique
- Present 2-3 approaches with trade-offs where appropriate

**Outputs:**
- Tech Spec: `docs/architecture/TECHSPEC-<Feature-Name>.md`

**Gate:** User MUST approve TECHSPEC before proceeding to Implementation.

---

## Phase 3: Implementation (Builder)

**Agent:** Builder (`task(subagent_type="Builder")`)

**Skills Used:**
- `tdd` — Test-driven development (RED → GREEN → REFACTOR)
- `minimal-diff-generator` — Small, focused changes
- `verification-gate` — Evidence-based completion claims

**Inputs:**
- Approved TECHSPEC (via `contract.md`)
- Worktree path

**Process:**
- Builder reads TECHSPEC and asks clarifying questions (QUESTION GATE)
- Follows strict TDD: write failing test → make it pass → refactor
- Applies verification gate before claiming completion
- Loads `patterns.md` for project gotchas

**Outputs:**
- Code implementation
- Unit/integration tests
- `result.md` with evidence of passing tests

**Contract (Oracle writes before delegation):**
```yaml
contract:
  workflow: BUILD
  phase: IMPLEMENTATION
  agent: Builder
  techspec: "docs/architecture/TECHSPEC-<Feature-Name>.md"
  worktree_path: ".worktrees/feat/[name]"
  deliverable: "Working code with passing tests"
  tdd_required: true
```

**Gate:** All tests pass + Builder's `result.md` shows evidence before Validation.

---

## Phase 4A: Validation (Janitor)

**Agent:** Janitor (`task(subagent_type="Janitor")`)

**Skills Used:**
- `verification-gate` — Evidence-based validation
- `silent-failure-hunter` — Detect empty catches, log-only handlers
- `traceability-linker` — Requirements → implementation mapping
- `integration-verifier` — E2E scenarios (if applicable)

**Inputs:**
- Implemented code + tests
- TECHSPEC for spec compliance
- Worktree path

**Process (two stages):**

### Stage A: Spec Compliance (Binary PASS/FAIL)
- Every TECHSPEC requirement maps to implemented code
- If ANY requirement is unmet → FAIL immediately, do NOT proceed to Stage B

### Stage B: Automated Harness
- TypeScript typecheck: `npx tsc --noEmit`
- Lint: project linter
- Tests: `npm test` or equivalent
- TDD compliance: test files exist, coverage adequate
- Silent failure scan
- Traceability check

**Outputs:**
- `result.md` with PASS/FAIL per stage

**Contract (Oracle writes before delegation):**
```yaml
validation_contract:
  workflow: BUILD
  phase: VALIDATION
  agent: Janitor
  techspec: "docs/architecture/TECHSPEC-<Feature-Name>.md"
  worktree_path: ".worktrees/feat/[name]"
  stages: ["spec_compliance", "automated_harness"]
```

**Gate:** Both stages PASS. If FAIL → loop back to Builder with specific failures.

---

## Phase 4B: Code Review (CodeReviewer)

**Agent:** CodeReviewer (`task(subagent_type="CodeReviewer")`)

**Skills Used:**
- `code-reviewer` — Confidence scoring, severity classification

**Inputs:**
- Code changes (diff from base branch)
- TECHSPEC for context
- Worktree path

**Process:**
- Two-stage review: spec compliance → code quality
- Confidence scoring (≥80 threshold to report)
- Severity classification (CRITICAL/IMPORTANT/MINOR)
- Mandatory positive findings section

**Outputs:**
- `result.md` with verdict: BLOCK | CHANGES_REQUESTED | APPROVE_WITH_NOTES | APPROVE
- Issue list with confidence scores

**Contract (Oracle writes before delegation):**
```yaml
review_contract:
  workflow: BUILD
  phase: CODE_REVIEW
  agent: CodeReviewer
  techspec: "docs/architecture/TECHSPEC-<Feature-Name>.md"
  worktree_path: ".worktrees/feat/[name]"
  review_scope: "all changes since branch creation"
```

**Gate:** No CRITICAL issues. Oracle presents accountability summary to user.

**ACCOUNTABILITY GATE (Oracle):**
After receiving CodeReviewer results, Oracle MUST:
1. Present summary of what was built (achievements)
2. Present Janitor validation results
3. Present CodeReviewer findings
4. Ask: "Are you satisfied with the quality? Can I proceed to commit?"
5. **STOP FOR USER APPROVAL.**

---

## Phase 5: Closure & Self-Improvement (Librarian)

**Agent:** Librarian (`task(subagent_type="Librarian")`)

**Skills Used:**
- `post-mortem` — Session analysis, pattern detection, improvement proposals
- `memory-update` — Refresh memory files
- `archive-conversation` — Session archival

**Inputs:**
- Completed workflow artifacts
- All agent results

**Process:**

### Worktree Closure (Oracle, before Librarian):
1. Pull latest main: `git pull origin main`
2. Merge: `git merge --squash feat/[name]` (or standard merge per user preference)
3. Push: `git push origin main`
4. Cleanup: `git worktree remove .worktrees/feat/[name]` AND `git branch -d feat/[name]`

### Knowledge Closure (Librarian):
1. Run `post-mortem` skill — analyze session, detect patterns
2. Present findings to user — **STOP FOR APPROVAL** of any improvements
3. Apply approved improvements to NSO or project patterns
4. Update memory files (`active_context.md`, `progress.md`, `patterns.md`)
5. Final git commit if needed

**Outputs:**
- Updated memory files
- Post-mortem findings (approved improvements applied)
- Git commit

**No gate:** Closure is the final phase.

---

## Gate Summary

| From → To | Gate | Criteria |
|-----------|------|----------|
| Phase 0 → Phase 1 | Worktree Gate | Branch created, safety checks pass |
| Phase 1 → Phase 2 | User Approval | User approves REQ document |
| Phase 2 → Phase 3 | User Approval | User approves TECHSPEC |
| Phase 3 → Phase 4A | Test Gate | All tests pass, Builder result.md shows evidence |
| Phase 4A → Phase 4B | Validation Gate | Janitor spec compliance + harness PASS |
| Phase 4B → Phase 5 | User Approval | User approves quality after accountability summary |

---

## Task Delegation Pattern

```python
# Oracle → Analyst (Discovery)
task(
    subagent_type="Analyst",
    prompt="Read contract.md at .opencode/context/active_tasks/[feature]/contract.md. "
           "Discover requirements for [feature]. Interact with user. "
           "Produce REQ document. Write result.md when complete."
)

# Oracle → Builder (Implementation)
task(
    subagent_type="Builder",
    prompt="Read contract.md at .opencode/context/active_tasks/[feature]/contract.md. "
           "Implement per TECHSPEC. Use TDD. Work in .worktrees/[branch]. "
           "Write result.md with test evidence when complete."
)

# Oracle → Janitor (Validation)
task(
    subagent_type="Janitor",
    prompt="Read validation_contract.md at .opencode/context/active_tasks/[feature]/. "
           "Run Stage A (spec compliance) then Stage B (harness). "
           "Work in .worktrees/[branch]. Write result.md."
)

# Oracle → CodeReviewer (Quality)
task(
    subagent_type="CodeReviewer",
    prompt="Read review_contract.md at .opencode/context/active_tasks/[feature]/. "
           "Review all changes. Apply confidence scoring. Write result.md with verdict."
)

# Oracle → Librarian (Closure)
task(
    subagent_type="Librarian",
    prompt="Run post-mortem for [feature]. Update memory files. "
           "Present improvement proposals. Write result.md."
)
```

---

## References

- Agent Prompts: `~/.config/opencode/nso/prompts/`
- Skills: `~/.config/opencode/nso/skills/`
- Agent Reference: `~/.config/opencode/nso/docs/NSO-AGENTS.md`
- Configuration: `~/.config/opencode/opencode.json`
