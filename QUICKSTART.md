# NSO Quick Start

**Get started with NSO v2.0 in 60 seconds.**

---

## Step 1: Verify Installation

Open your terminal and check:
```bash
ls ~/.config/opencode/nso/
```

You should see: `opencode.json`, `instructions.md`, `prompts/`, `skills/`, `docs/`

---

## Step 2: Initialize Your Project (First Time Only)

In your project directory:
```bash
# Start OpenCode and run:
/nso-init
```

This creates `.opencode/` structure in your project.

---

## Step 3: Just Describe What You Want

NSO automatically detects what workflow to use.

### Example 1: Build a New Feature
```
You: "Add a dark mode toggle to the settings page"
```

NSO will:
1. **Analyst** asks you questions (one at a time)
2. Produces `REQ-DarkMode.md` → **You approve**
3. **Oracle** designs architecture → `TECHSPEC-DarkMode.md` → **You approve**
4. **Builder** codes it (TDD: tests first)
5. **Janitor** validates (spec + harness)
6. **CodeReviewer** audits quality → **You approve to commit**
7. **Librarian** merges + runs post-mortem

### Example 2: Fix a Bug
```
You: "The feed parser crashes on empty RSS feeds"
```

NSO will:
1. **Analyst** investigates (LOG FIRST approach)
2. **Builder** writes regression test (must fail) → fixes bug
3. **Janitor** validates regression + full tests
4. **Librarian** documents the Gotcha in patterns.md

### Example 3: Review Code
```
You: "Review the authentication module for security issues"
```

NSO will:
1. **CodeReviewer** scopes files + focus areas
2. Analyzes code (confidence scoring ≥80)
3. Reports verdict + issues + positive findings
4. **Librarian** updates patterns

---

## Step 4: Understand the Approval Gates

NSO **will stop and wait** for your approval 3 times during BUILD:

1. After **requirements** (REQ doc)
2. After **architecture** (TECHSPEC doc)
3. After **quality review** (before git commit)

Just say **"Approved"** or **"Looks good"** to continue.

If you want changes, say what needs fixing.

---

## Common Commands

| Say This | NSO Does This |
|----------|---------------|
| "Add [feature]" | BUILD workflow |
| "Bug: [description]" | DEBUG workflow |
| "Review [module/file]" | REVIEW workflow |
| "/nso-init" | Initialize NSO for project |
| "/new-feature [name]" | Explicit BUILD start |
| "/scout [topic]" | Research a technology |

---

## Where Things Are

```
Your Project/
├── docs/
│   ├── requirements/      # REQ-*.md
│   └── architecture/      # TECHSPEC-*.md
└── .opencode/
    └── context/
        └── 01_memory/     # active_context.md, patterns.md, progress.md

NSO System/
~/.config/opencode/nso/
├── USER_GUIDE.md          # Full user guide
├── AGENTS.md              # Agent quick reference
├── ARCHITECTURE.md        # System architecture
└── docs/
    ├── NSO-AGENTS.md      # Complete agent reference
    └── workflows/         # BUILD.md, DEBUG.md, REVIEW.md
```

---

## The 8 Agents (One-Liner)

- **Oracle** — Architect (designs, orchestrates)
- **Analyst** — Mastermind (discovers requirements, investigates bugs)
- **Builder** — Engineer (codes using TDD)
- **Designer** — UX (mockups, frontend)
- **Janitor** — QA (spec validation + automated harness)
- **CodeReviewer** — Auditor (independent quality review)
- **Librarian** — Knowledge Manager (memory, git, post-mortem)
- **Scout** — Researcher (external research on demand)

---

## Key Rules

1. **TDD is mandatory.** RED (failing test) → GREEN (make it pass) → REFACTOR.
2. **No self-review.** Builder doesn't review own code.
3. **Evidence only.** No "I think" or "should work" — show test output.
4. **Worktrees for BUILD.** Your main branch stays clean.
5. **Memory persists.** Decisions saved in `.opencode/context/01_memory/`.

---

## Need Help?

- **Full guide:** `~/.config/opencode/nso/USER_GUIDE.md`
- **Agent details:** `~/.config/opencode/nso/docs/NSO-AGENTS.md`
- **Workflow details:** `~/.config/opencode/nso/docs/workflows/`

---

**Ready? Just describe what you want to build, fix, or review.**
