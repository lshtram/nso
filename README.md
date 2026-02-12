# NSO (Neuro-Symbolic Orchestrator) v2.0

**An 8-agent orchestration system for OpenCode that enforces quality through process.**

---

## What is NSO?

NSO is a multi-agent workflow system that turns OpenCode into a rigorous software development process with:

- **8 specialized agents** (Oracle, Analyst, Builder, Designer, Janitor, CodeReviewer, Librarian, Scout)
- **3 workflows** (BUILD for features, DEBUG for bugs, REVIEW for quality)
- **Quality gates** (TDD enforcement, spec compliance, independent code review)
- **Self-improvement** (post-mortem analysis, pattern detection)

---

## Quick Links

| Document | Purpose |
|----------|---------|
| **[QUICKSTART.md](QUICKSTART.md)** | Get started in 60 seconds |
| **[USER_GUIDE.md](USER_GUIDE.md)** | Complete user guide with workflow details |
| **[AGENTS.md](AGENTS.md)** | Quick reference for the 8 agents |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture and philosophy |
| **[docs/NSO-AGENTS.md](docs/NSO-AGENTS.md)** | Complete agent reference (SSOT) |
| **[docs/workflows/](docs/workflows/)** | BUILD.md, DEBUG.md, REVIEW.md |

---

## Version

**Current:** 2.0.0 (2026-02-12)

**What's New in v2.0:**
- 🆕 **Analyst** agent — Handles requirements discovery (BUILD) and bug investigation (DEBUG)
- 🆕 **CodeReviewer** agent — Independent code quality auditor
- 🎯 **Validation Split** — Janitor (spec+harness) + CodeReviewer (quality) instead of Janitor doing both
- 📚 **New Skills** — `tdd`, `systematic-debugging`, `verification-gate`, `post-mortem`
- 🧹 **Deleted Skills** — 12 old skills removed (superseded or consolidated)
- 🚫 **Anti-Performative Protocol** — No "I think", "should", "probably" — only evidence

---

## Installation

NSO is already installed at `~/.config/opencode/nso/`.

To initialize NSO for a project:
```bash
cd your-project
# In OpenCode, run:
/nso-init
```

---

## Usage

Just describe what you want in natural language:

```
"Add a dark mode toggle to settings"  → BUILD workflow
"The feed parser crashes on empty RSS" → DEBUG workflow
"Review the auth module for security"  → REVIEW workflow
```

NSO automatically detects intent and runs the right workflow.

---

## The 3 Workflows

### 🏗️ BUILD (New Features)
```
Analyst → Oracle → Builder → Janitor → CodeReviewer → Oracle → Librarian
```
- 7 phases, 3 approval gates
- Mandatory TDD (RED → GREEN → REFACTOR)
- Worktree isolation for branch safety

### 🐛 DEBUG (Bug Fixes)
```
Analyst → Oracle → Builder → Janitor → Oracle → Librarian
```
- LOG FIRST approach (evidence before hypothesis)
- Regression test must fail before fix
- 3-fix escalation rule

### 🔍 REVIEW (Code Quality)
```
CodeReviewer → Oracle → Librarian
```
- Confidence scoring (≥80 threshold)
- Severity classification (CRITICAL/IMPORTANT/MINOR)
- Mandatory positive findings

---

## The 8 Agents

| Agent | Role | Primary Function |
|-------|------|------------------|
| **Oracle** | System Architect | Architecture, orchestration, delegation |
| **Analyst** | Mastermind | Requirements discovery, bug investigation |
| **Builder** | Software Engineer | Code implementation (TDD) |
| **Designer** | Frontend/UX | UI mockups, frontend components |
| **Janitor** | QA Monitor | Spec compliance + automated validation |
| **CodeReviewer** | Quality Auditor | Independent code quality review |
| **Librarian** | Knowledge Manager | Memory, documentation, self-improvement |
| **Scout** | Researcher | External research, technology evaluation |

---

## Key Principles

1. **TDD is mandatory** — RED → GREEN → REFACTOR
2. **No self-review** — Builder doesn't review own code
3. **Evidence-based completion** — No "I think it works", show test output
4. **Worktrees for BUILD** — Branch isolation, main stays clean
5. **3 approval gates** — After requirements, after architecture, after quality review
6. **Post-mortem every session** — Learn and improve

---

## Configuration Files

| File | Purpose |
|------|---------|
| `opencode.json` | Agent definitions and runtime config |
| `instructions.md` | Universal NSO rules (loaded by all agents) |
| `prompts/*.md` | Agent-specific prompts (8 files) |
| `skills/*/SKILL.md` | Skill definitions (20 skills) |
| `nso-plugin.js` | Event hooks (session init, tool validation) |

---

## Commands

| Command | What It Does |
|---------|--------------|
| `/nso-init` | Initialize NSO for current project |
| `/new-feature [name]` | Explicit BUILD workflow start |
| `/scout [topic]` | Research a technology or pattern |
| `/memory-update` | Force update memory files |
| `/close-session` | Close session with memory update |

---

## Support

- **Issues?** Check `docs/STATUS_REPORT.md` for known issues
- **Questions?** Read `USER_GUIDE.md` for complete documentation
- **Deferred features?** See `DEFERRED.md`

---

## License

Internal tool for OpenSpace project development.

---

**Ready to start? Open the [QUICKSTART.md](QUICKSTART.md) guide.**
