#!/usr/bin/env python3
"""
NSO Project Initialization Script

Creates the .opencode/ structure for a new project AND reviews existing
directive files (AGENTS.md, CLAUDE.md, .agent/, etc.) for conflicts
with NSO processes.

Usage:
    python3 nso_init.py                          # Auto-detect everything
    python3 nso_init.py --name "My Project"      # Specify project name
    python3 nso_init.py --type react              # Specify project type
    python3 nso_init.py --json                    # JSON output for agents

Output:
    - Creates .opencode/ directory structure (if missing)
    - Scans for conflicting directive files
    - Outputs conflict report with suggested resolutions
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Optional


# --- Directive Conflict Detection ---

DIRECTIVE_FILES = [
    # (path, description, conflict_type)
    ("AGENTS.md", "Project agent directives", "process"),
    ("CLAUDE.md", "Claude Code directives", "process"),
    (".agent/PROCESS.md", "Agent SDLC process", "process"),
    (".agent/GUIDELINES.md", "Agent behavioral guidelines", "guidelines"),
    (".agent/CODING_STYLE.md", "Coding standards", "standards"),
    (".cursor/rules", "Cursor AI rules", "process"),
    (".cursorrules", "Cursor AI rules (legacy)", "process"),
    ("COPILOT.md", "GitHub Copilot directives", "process"),
    (".github/copilot-instructions.md", "GitHub Copilot instructions", "process"),
]

# Keywords that indicate a file defines its own SDLC/process (conflicts with NSO)
PROCESS_CONFLICT_KEYWORDS = [
    "SDLC", "lifecycle", "phase-locked", "workflow", "sprint",
    "requirements phase", "design phase", "implementation phase",
    "PRD", "tech spec", "flight plan", "gate", "approval",
    "you must follow", "strictly follow", "never proceed",
]

# Keywords that indicate project context (safe, no conflict)
CONTEXT_KEYWORDS = [
    "tech stack", "coding standard", "naming convention",
    "architecture", "boundary", "forbidden", "auto-allowed",
]


def detect_project_type() -> str:
    """Detect project type based on existing files."""
    if Path("package.json").exists():
        try:
            content = json.loads(Path("package.json").read_text())
            deps = {**content.get("dependencies", {}), **content.get("devDependencies", {})}
            if "react" in deps:
                return "react"
            if "next" in deps:
                return "nextjs"
            if "vue" in deps:
                return "vue"
            return "node"
        except (json.JSONDecodeError, KeyError):
            return "node"

    if Path("pyproject.toml").exists() or Path("requirements.txt").exists():
        return "python"

    if Path("Cargo.toml").exists():
        return "rust"

    if Path("go.mod").exists():
        return "go"

    return "generic"


def detect_project_name() -> str:
    """Detect project name from package.json or directory name."""
    if Path("package.json").exists():
        try:
            content = json.loads(Path("package.json").read_text())
            if "name" in content:
                return content["name"].replace("-", " ").replace("_", " ").title()
        except (json.JSONDecodeError, KeyError):
            pass
    return Path.cwd().name.replace("-", " ").replace("_", " ").title()


def scan_directive_conflicts() -> list[dict]:
    """Scan for existing directive files and check for NSO conflicts."""
    conflicts = []

    for filepath, description, conflict_type in DIRECTIVE_FILES:
        path = Path(filepath)
        if not path.exists():
            continue

        try:
            content = path.read_text().lower()
        except (PermissionError, UnicodeDecodeError):
            conflicts.append({
                "file": filepath,
                "description": description,
                "type": conflict_type,
                "severity": "warning",
                "detail": "Could not read file",
                "suggestion": f"Manually review {filepath} for NSO conflicts.",
            })
            continue

        # Check for process-defining keywords (conflicts with NSO)
        found_process_keywords = [kw for kw in PROCESS_CONFLICT_KEYWORDS if kw.lower() in content]
        found_context_keywords = [kw for kw in CONTEXT_KEYWORDS if kw.lower() in content]

        if conflict_type == "process" and found_process_keywords:
            # This file defines its own SDLC — conflicts with NSO
            severity = "critical" if len(found_process_keywords) >= 3 else "warning"
            conflicts.append({
                "file": filepath,
                "description": description,
                "type": "process_conflict",
                "severity": severity,
                "detail": f"Defines its own process ({', '.join(found_process_keywords[:5])}). NSO must be the process authority.",
                "suggestion": _get_suggestion(filepath, found_process_keywords, found_context_keywords),
            })
        elif found_context_keywords and not found_process_keywords:
            # Safe — just project context
            conflicts.append({
                "file": filepath,
                "description": description,
                "type": "context_only",
                "severity": "info",
                "detail": "Contains project context (no process conflict).",
                "suggestion": "No changes needed. NSO will read this for project context.",
            })
        elif path.exists():
            # File exists but we're not sure what it does
            conflicts.append({
                "file": filepath,
                "description": description,
                "type": "unknown",
                "severity": "info",
                "detail": "File exists. Review manually for process directives.",
                "suggestion": f"Review {filepath} and remove any SDLC/process definitions that conflict with NSO.",
            })

    # Check for .agent/ directory (entire framework)
    if Path(".agent").is_dir():
        agent_files = list(Path(".agent").rglob("*"))
        file_count = len([f for f in agent_files if f.is_file()])
        conflicts.append({
            "file": ".agent/",
            "description": f"Competing agent framework ({file_count} files)",
            "type": "framework_conflict",
            "severity": "critical",
            "detail": "The .agent/ directory contains a complete competing SDLC framework. NSO replaces this.",
            "suggestion": "Archive .agent/ to _archive/.agent/ and let NSO manage the process. Useful coding standards from .agent/CODING_STYLE.md should be moved to the project AGENTS.md.",
        })

    return conflicts


def _get_suggestion(filepath: str, process_kws: list, context_kws: list) -> str:
    """Generate a specific suggestion for a conflicting file."""
    if filepath == "AGENTS.md":
        return (
            "Rewrite AGENTS.md to contain ONLY project context (tech stack, coding standards, boundaries). "
            "Remove any SDLC/workflow/phase definitions. Add at the top: "
            "'This project uses NSO. Follow NSO process directives from instructions.md.'"
        )
    elif filepath == "CLAUDE.md":
        return (
            "Rewrite CLAUDE.md to contain ONLY project context. "
            "Remove any workflow/lifecycle definitions. Add NSO precedence note at the top."
        )
    elif filepath.startswith(".agent/"):
        return (
            f"Archive {filepath} to _archive/{filepath}. NSO replaces the .agent/ framework."
        )
    else:
        return (
            f"Review {filepath} and remove process-defining directives. "
            "Keep project context (tech stack, coding standards). NSO owns the process."
        )


# --- Directory Structure Creation ---

def create_opencode_structure(project_name: str, project_type: str) -> dict:
    """Create .opencode/ directory structure. Returns status dict."""
    base = Path(".opencode")
    created = []
    skipped = []

    dirs = [
        base / "context" / "00_meta",
        base / "context" / "01_memory",
        base / "context" / "03_proposals",
        Path("docs") / "requirements",
        Path("docs") / "architecture",
        base / "templates",
        base / "logs",
    ]

    for d in dirs:
        if d.exists():
            skipped.append(str(d))
        else:
            d.mkdir(parents=True, exist_ok=True)
            try:
                os.chmod(str(d), 0o777)
            except Exception:
                pass
            created.append(str(d))

    # Create template files if missing
    files_created = []

    # Memory files
    memory_files = {
        base / "context" / "01_memory" / "active_context.md": f"""# Active Context

**Project:** {project_name}

## Current Focus
- **Status:** INITIALIZED
- **Last Activity:** NSO initialized for this project

## Active Decisions
- NSO manages all development workflows

## Open Questions
- None
""",
        base / "context" / "01_memory" / "patterns.md": """# Memory Patterns

## Discovered Issues & Solutions
- None yet

## Architecture Patterns
- Follow NSO BUILD workflow for features
- Follow NSO DEBUG workflow for bugs

## Best Practices
- Keep context files <200 lines
- Update memory at end of every session
""",
        base / "context" / "01_memory" / "progress.md": f"""# Progress

## Current Milestones
- [x] NSO initialized ({datetime.now().strftime('%Y-%m-%d')})

## Validation Status
- No features implemented yet
""",
    }

    # REQ template
    memory_files[base / "templates" / "REQ-TEMPLATE.md"] = """# REQ-<Feature-Name>

## Overview
<!-- Brief description of the feature -->

## User Stories
<!-- As a [user], I want [action] so that [benefit] -->

## Acceptance Criteria
<!-- Specific, testable criteria -->
- [ ] Criterion 1
- [ ] Criterion 2

## Scope
### In Scope
<!-- What this feature includes -->

### Out of Scope
<!-- What this feature does NOT include -->

## Constraints
<!-- Technical or business constraints -->

## Risks & Mitigations
<!-- What could go wrong and how to handle it -->
| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

## Dependencies
<!-- External dependencies or prerequisites -->
"""

    # TECHSPEC template
    memory_files[base / "templates" / "TECHSPEC-TEMPLATE.md"] = """# TECHSPEC-<Feature-Name>

## Overview
<!-- What we're building and why -->

## Interface Design
<!-- Public API, types, function signatures -->

## Data Model
<!-- Data structures, storage, schemas -->

## Error Handling
<!-- Error types, recovery strategies -->

## Architecture Review
### Simplicity Checklist
- [ ] Can this be done with fewer moving parts?
- [ ] Are the boundaries clear?
- [ ] Are we leaking implementation details?

### Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| | | |

## Implementation Plan
<!-- Ordered list of implementation steps -->
1. Step 1
2. Step 2

## Testing Strategy
<!-- What tests are needed -->
"""

    # NSO config
    memory_files[base / "nso-config.json"] = json.dumps({
        "name": project_name,
        "type": project_type,
        "version": "1.0.0",
        "created": datetime.now().strftime("%Y-%m-%d"),
        "nso_version": "3.0.0",
    }, indent=2)

    for filepath, content in memory_files.items():
        if filepath.exists():
            skipped.append(str(filepath))
        else:
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_text(content)
            files_created.append(str(filepath))

    return {
        "dirs_created": created,
        "dirs_skipped": skipped,
        "files_created": files_created,
    }


# --- Main ---

def main():
    """Main entry point."""
    # Parse args
    args = sys.argv[1:]
    json_output = "--json" in args
    args = [a for a in args if a != "--json"]

    project_name = None
    project_type = None

    i = 0
    while i < len(args):
        if args[i] == "--name" and i + 1 < len(args):
            project_name = args[i + 1]
            i += 2
        elif args[i] == "--type" and i + 1 < len(args):
            project_type = args[i + 1]
            i += 2
        else:
            # Positional: first is name, second is type
            if project_name is None:
                project_name = args[i]
            elif project_type is None:
                project_type = args[i]
            i += 1

    if not project_name:
        project_name = detect_project_name()
    if not project_type:
        project_type = detect_project_type()

    # 1. Create directory structure
    structure_result = create_opencode_structure(project_name, project_type)

    # 2. Scan for directive conflicts
    conflicts = scan_directive_conflicts()

    # 3. Output results
    result = {
        "project_name": project_name,
        "project_type": project_type,
        "project_path": str(Path.cwd()),
        "structure": structure_result,
        "directive_conflicts": conflicts,
        "summary": {
            "critical_conflicts": len([c for c in conflicts if c["severity"] == "critical"]),
            "warnings": len([c for c in conflicts if c["severity"] == "warning"]),
            "info": len([c for c in conflicts if c["severity"] == "info"]),
        },
    }

    if json_output:
        print(json.dumps(result, indent=2))
    else:
        print("=" * 60)
        print("  NSO Project Initialization")
        print("=" * 60)
        print()
        print(f"  Project: {project_name}")
        print(f"  Type:    {project_type}")
        print(f"  Path:    {Path.cwd()}")
        print()

        # Structure
        if structure_result["dirs_created"] or structure_result["files_created"]:
            print("  CREATED:")
            for d in structure_result["dirs_created"]:
                print(f"    + {d}")
            for f in structure_result["files_created"]:
                print(f"    + {f}")
            print()

        if structure_result["dirs_skipped"]:
            print(f"  SKIPPED (already exist): {len(structure_result['dirs_skipped'])} items")
            print()

        # Conflicts
        critical = [c for c in conflicts if c["severity"] == "critical"]
        warnings = [c for c in conflicts if c["severity"] == "warning"]
        infos = [c for c in conflicts if c["severity"] == "info"]

        if critical:
            print("  CRITICAL CONFLICTS (must resolve):")
            for c in critical:
                print(f"    [!] {c['file']}")
                print(f"        {c['detail']}")
                print(f"        Suggestion: {c['suggestion']}")
                print()

        if warnings:
            print("  WARNINGS (should review):")
            for c in warnings:
                print(f"    [?] {c['file']}")
                print(f"        {c['detail']}")
                print(f"        Suggestion: {c['suggestion']}")
                print()

        if infos:
            print("  INFO (no action needed):")
            for c in infos:
                print(f"    [i] {c['file']} - {c['detail']}")
            print()

        if not conflicts:
            print("  No directive conflicts found.")
            print()

        print("=" * 60)
        print("  Done. NSO is ready for this project.")
        print("=" * 60)


if __name__ == "__main__":
    main()
