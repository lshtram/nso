# NSO Two-Tier Architecture

## Overview

NSO (Neuro-Symbolic Orchestrator) now uses a **two-tier architecture** that separates:
1. **Global System** - Shared across all projects (`~/.config/opencode/`)
2. **Per-Project Context** - Project-specific memory and state (`.opencode/` in each project)

---

## Tier 1: Global System (`~/.config/opencode/`)

**Location:** `~/.config/opencode/`

**Contains:**
- **Agents** (`agents/`) - Agent definitions and prompts
- **Skills** (`skills/`) - All NSO skills (router, bug-investigator, code-reviewer, etc.)
- **Commands** (`commands/`) - Slash commands (`/new-feature`, `/status`, etc.)
- **Plugins** (`plugins/`) - NSO plugin initialization
- **NSO Core** (`nso/`)
  - `AGENTS.md` - Agent definitions and responsibilities
  - `ARCHITECTURE.md` - System architecture documentation
  - `CODING_STANDARDS.md` - Coding standards
  - `DEVELOPMENT_PLAN.md` - Development roadmap
  - `USER_GUIDE.md` - User guide
  - `docs/` - Requirements, architecture specs, workflows
  - `scripts/` - Validation, monitoring, utility scripts
  - `tests/` - Test suites
  - `hooks/` - Git hooks and automation
  - `install.sh` - Installation script
- **Configuration** (`opencode.json`) - Global OpenCode config with NSO agents, MCPs, commands

**Purpose:**
- Single source of truth for NSO system
- Available in ALL projects automatically
- Updates apply globally
- Self-improvements benefit all projects

---

## Tier 2: Per-Project Context (`.opencode/`)

**Location:** `.opencode/` in each project root

**Contains:**
- **Context** (`context/`)
  - `00_meta/` - Project metadata, tech stack, glossary
  - `01_memory/` - **Project-specific memory**
    - `active_context.md` - Current focus and decisions
    - `patterns.md` - Learned patterns and gotchas
    - `progress.md` - Verified deliverables and status
    - `session_tracking.md` - Session history
  - `02_learned/` - Project-specific learnings
  - `03_proposals/` - RFCs and proposals
  - `active_features/` - Current feature work
- **Logs** (`logs/`) - Session logs and trends
- **Project Configuration** (`opencode.json`) - Project-specific overrides (optional)

**Purpose:**
- Project-specific memory and state
- Isolated context per project
- Tasks and active features tracked per project
- Can override global settings if needed

---

## How It Works

### Configuration Precedence (OpenCode loads in this order):

1. **Remote config** (`.well-known/opencode`) - organizational defaults
2. **Global config** (`~/.config/opencode/opencode.json`) ← **NSO lives here**
3. **Custom config** (`OPENCODE_CONFIG` env var)
4. **Project config** (`opencode.json` in project) - project-specific overrides
5. **`.opencode` directories** - project context
6. **Inline config** (`OPENCODE_CONFIG_CONTENT` env var)

**Later configs override earlier ones.**

### Agent Memory Loading Protocol:

When an agent starts in any project:

1. **LOAD Global Context** - Read `~/.config/opencode/nso/AGENTS.md`
2. **LOAD Project Memory** - Read `.opencode/context/01_memory/{active_context.md,patterns.md,progress.md}`
3. **EXECUTE** - Run the workflow
4. **UPDATE Project Memory** - Write to `.opencode/context/01_memory/` (project-specific)

### Example: Working on `fermata` project

```bash
cd /Users/Shared/dev/fermata
opencode
```

**What happens:**
1. OpenCode loads global config from `~/.config/opencode/opencode.json`
2. NSO agents (Oracle, Builder, Janitor, etc.) are available
3. Agent loads project memory from `fermata/.opencode/context/01_memory/`
4. Agent executes workflow
5. Agent updates `fermata/.opencode/context/01_memory/` (project-specific)

---

## Benefits

### Global System Benefits:
✅ **Single Source of Truth** - One NSO installation for all projects  
✅ **Shared Improvements** - Self-improvements benefit all projects  
✅ **No Replication** - Changes apply globally instantly  
✅ **Consistent Experience** - Same agents, skills, commands everywhere  
✅ **Easy Updates** - Update once, apply everywhere  

### Per-Project Context Benefits:
✅ **Isolation** - Each project has its own memory and state  
✅ **Clean History** - Project-specific decisions and patterns  
✅ **Parallel Work** - Work on multiple projects without context pollution  
✅ **Portable** - Project folder contains all project-specific context  

---

## Directory Structure Comparison

### Global (`~/.config/opencode/`)
```
~/.config/opencode/
├── opencode.json              # Global config with NSO agents/commands
├── agents/                    # Agent definitions
├── skills/                    # All NSO skills
├── commands/                  # Slash commands
├── plugins/                   # Plugin initialization
└── nso/                       # NSO core files
    ├── AGENTS.md
    ├── ARCHITECTURE.md
    ├── CODING_STANDARDS.md
    ├── docs/
    ├── scripts/
    └── tests/
```

### Per-Project (`.opencode/`)
```
project-root/
├── .opencode/
│   ├── context/
│   │   ├── 00_meta/          # Project metadata
│   │   ├── 01_memory/        # Project memory
│   │   │   ├── active_context.md
│   │   │   ├── patterns.md
│   │   │   └── progress.md
│   │   ├── 02_learned/       # Project learnings
│   │   └── 03_proposals/     # RFCs
│   └── logs/                 # Session logs
└── opencode.json             # Project-specific overrides (optional)
```

---

## Setup Instructions

### Initial Setup (One-time)

The NSO system has already been copied to `~/.config/opencode/`. 

To verify it's working:

```bash
# Check global config exists
ls -la ~/.config/opencode/

# Verify agents are available
ls ~/.config/opencode/agents/

# Verify skills are available
ls ~/.config/opencode/skills/
```

### Working on a New Project

When you start working on a new project, create its context directory:

```bash
cd /path/to/new-project

# Create per-project context
mkdir -p .opencode/context/{00_meta,01_memory,02_learned,03_proposals}
mkdir -p .opencode/logs

# Create initial memory files
touch .opencode/context/01_memory/{active_context.md,patterns.md,progress.md}

# Start OpenCode
opencode
```

### Existing Projects

For existing projects that already have `.opencode/`:

No changes needed! The global NSO system will automatically be available when you run `opencode` in those projects.

---

## Maintenance

### Updating NSO System

When you improve NSO in `high-reliability-framework`:

```bash
# Copy updated files to global config
cp -r /Users/Shared/dev/high-reliability-framework/.opencode/agents/* ~/.config/opencode/agents/
cp -r /Users/Shared/dev/high-reliability-framework/.opencode/skills/* ~/.config/opencode/skills/
cp /Users/Shared/dev/high-reliability-framework/.opencode/AGENTS.md ~/.config/opencode/nso/
# ... etc
```

**Note:** We should create a sync script for this in the future.

### Self-Improvement

Self-improvements work across all projects:

1. Run `/self-improve` in any project
2. Librarian analyzes the session
3. Patterns are stored in `~/.config/opencode/nso/context/01_memory/` (global)
4. All projects benefit from the improvements

---

## Troubleshooting

### NSO Not Loading

1. Check global config exists:
   ```bash
   ls ~/.config/opencode/opencode.json
   ```

2. Verify skills are in the right place:
   ```bash
   ls ~/.config/opencode/skills/
   ```

3. Check OpenCode is loading global config:
   ```bash
   opencode --version
   # Should show version, confirming it's reading config
   ```

### Project Context Not Found

Ensure `.opencode/context/01_memory/` exists in your project:

```bash
ls .opencode/context/01_memory/
# Should show: active_context.md patterns.md progress.md
```

---

## Future Enhancements

- [ ] Create sync script to update global NSO from `high-reliability-framework`
- [ ] Add `nso-sync` command to automatically sync changes
- [ ] Create project template with initial `.opencode/` structure
- [ ] Package NSO as npm module `nso-opencode` for easier distribution

---

## Summary

**Global (`~/.config/opencode/`):** System files, agents, skills, shared docs  
**Per-Project (`.opencode/`):** Memory, context, tasks, project-specific state  

This architecture gives you the best of both worlds:
- **Consistency** across all projects via global system
- **Isolation** per project via local context
- **Shared improvements** via global self-improvement
- **Clean history** per project via local memory
