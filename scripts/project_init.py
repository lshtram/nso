#!/usr/bin/env python3
"""
NSO Project Initialization Script

Creates the complete .opencode/ structure for a new project or existing project
that doesn't have NSO context yet.

Usage:
    python3 project_init.py [project_name] [project_type]
    
Examples:
    python3 project_init.py "My React App" react
    python3 project_init.py "Python API" python
    python3 project_init.py "My Project" generic
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional


# Templates for different project types
PROJECT_TEMPLATES = {
    "react": {
        "tech_stack": """# Tech Stack

## Project Overview
**Project Name:** {project_name}
**Type:** React Application
**Architecture:** Single-page application (SPA)

## Core Technologies
- **React**: Frontend framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first styling

## Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Vitest**: Unit testing
- **Playwright**: E2E testing

## NSO Integration
This project uses the Neuro-Symbolic Orchestrator (NSO) framework.
See `~/.config/opencode/nso/` for global NSO configuration.
""",
        "patterns": """# Patterns

## Component Patterns
- Functional components with hooks
- Custom hooks for reusable logic
- Context for global state

## Naming Conventions
- Components: PascalCase
- Hooks: camelCase with `use` prefix
- Files: kebab-case

## NSO Patterns
- LOAD memory at session start
- UPDATE memory at session end
- Check router before user messages
"""
    },
    "python": {
        "tech_stack": """# Tech Stack

## Project Overview
**Project Name:** {project_name}
**Type:** Python Application
**Architecture:** Backend/API/Script

## Core Technologies
- **Python**: Primary language
- **Type Hints**: Full type annotation
- **pytest**: Testing framework
- **ruff**: Linting and formatting

## Development Tools
- **pytest**: Unit testing
- **mypy**: Type checking
- **ruff**: Linting
- **black**: Code formatting

## NSO Integration
This project uses the Neuro-Symbolic Orchestrator (NSO) framework.
See `~/.config/opencode/nso/` for global NSO configuration.
""",
        "patterns": """# Patterns

## Code Patterns
- Type hints on all functions
- Docstrings for public APIs
- pytest for testing

## Naming Conventions
- Modules: snake_case
- Classes: PascalCase
- Functions: snake_case
- Constants: UPPER_SNAKE_CASE

## NSO Patterns
- LOAD memory at session start
- UPDATE memory at session end
- Check router before user messages
"""
    },
    "generic": {
        "tech_stack": """# Tech Stack

## Project Overview
**Project Name:** {project_name}
**Type:** General Project
**Architecture:** TBD

## Core Technologies
- Define your stack here

## Development Tools
- Define your tools here

## NSO Integration
This project uses the Neuro-Symbolic Orchestrator (NSO) framework.
See `~/.config/opencode/nso/` for global NSO configuration.
""",
        "patterns": """# Patterns

## General Patterns
- Define your patterns here

## Naming Conventions
- Define your conventions here

## NSO Patterns
- LOAD memory at session start
- UPDATE memory at session end
- Check router before user messages
"""
    }
}


DEFAULT_GLOSSARY = """# Glossary

## Project Terms
**{project_name}** - Main project definition

## Technical Terms
Define project-specific technical terms here.

## NSO Terms
- **Oracle** - System architect agent
- **Builder** - Implementation agent
- **Janitor** - Quality assurance agent
- **Librarian** - Memory management agent

See `~/.config/opencode/nso/` for complete NSO documentation.
"""


def detect_project_type() -> str:
    """Detect project type based on existing files."""
    if Path("package.json").exists():
        content = Path("package.json").read_text()
        if "react" in content.lower():
            return "react"
    
    if Path("requirements.txt").exists() or Path("pyproject.toml").exists():
        return "python"
    
    if Path("Cargo.toml").exists():
        return "rust"
    
    return "generic"


def create_directory_structure(base_path: Path):
    """Create the .opencode/ directory structure."""
    directories = [
        base_path / "context" / "00_meta",
        base_path / "context" / "01_memory",
        base_path / "context" / "02_learned",
        base_path / "context" / "03_proposals",
        base_path / "context" / "active_features",
        base_path / "docs" / "architecture",
        base_path / "docs" / "requirements",
        base_path / "hooks" / "pre_tool_use",
        base_path / "hooks" / "post_tool_use",
        base_path / "logs",
    ]
    
    print("📁 Creating directory structure...")
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"  ✅ {directory}")
    print()


def create_meta_files(base_path: Path, project_name: str, project_type: str):
    """Create 00_meta/ context files."""
    meta_path = base_path / "context" / "00_meta"
    template = PROJECT_TEMPLATES.get(project_type, PROJECT_TEMPLATES["generic"])
    
    print("📝 Creating meta files...")
    
    # tech-stack.md
    tech_stack_content = template["tech_stack"].format(project_name=project_name)
    (meta_path / "tech-stack.md").write_text(tech_stack_content)
    print(f"  ✅ tech-stack.md")
    
    # patterns.md
    patterns_content = template["patterns"].format(project_name=project_name)
    (meta_path / "patterns.md").write_text(patterns_content)
    print(f"  ✅ patterns.md")
    
    # glossary.md
    glossary_content = DEFAULT_GLOSSARY.format(project_name=project_name)
    (meta_path / "glossary.md").write_text(glossary_content)
    print(f"  ✅ glossary.md")
    
    print()


def create_memory_files(base_path: Path, project_name: str):
    """Create 01_memory/ files with initial content."""
    memory_path = base_path / "context" / "01_memory"
    timestamp = datetime.now().strftime("%Y-%m-%d")
    
    print("🧠 Creating memory files...")
    
    # active_context.md
    active_context = f"""# Active Context

## Current Focus
- Initializing project: {project_name}

## Session State
- Session started: {timestamp}
- Status: INITIALIZING

## Decisions
- Project initialized with NSO framework
- Directory structure created

## Open Questions
- Define project scope
- Identify initial features

## Next Steps
- Run init_session.py to load context
- Begin requirements gathering
"""
    (memory_path / "active_context.md").write_text(active_context)
    print(f"  ✅ active_context.md")
    
    # patterns.md
    patterns = """# Patterns

## Architectural Patterns
- NSO Hexagon Squad architecture
- Two-tier documentation (System-wide vs Project-specific)

## Coding Standards
- TDD Mandatory (RED -> GREEN -> REFACTOR)
- Logical logging (LOG FIRST)
- Minimal diffs

## Conventions
- To be defined as project evolves

## Gotchas
- None identified yet

## Approved Practices
- Follow NSO instructions.md for all operations
- Update memory files at end of each session
"""
    (memory_path / "patterns.md").write_text(patterns)
    print(f"  ✅ patterns.md")
    
    # progress.md
    progress = f"""# Progress

## Milestones
- [completed] Project Initialization ({timestamp})
  - [completed] NSO directory structure created
  - [completed] Meta files initialized
  - [completed] Memory files initialized

## Verified Deliverables
- Initial project structure
- NSO context framework

## Evidence Links
- None yet

## Deferred Items
- None yet
"""
    (memory_path / "progress.md").write_text(progress)
    print(f"  ✅ progress.md")
    
    print()


def create_docs_structure(base_path: Path):
    """Create initial docs structure."""
    docs_path = base_path / "docs"
    
    print("📚 Creating docs structure...")
    
    # Create INDEX.md
    index = """# Documentation Index

## Requirements
- No requirements defined yet

## Architecture
- No architecture defined yet

## How to Use
1. Create requirements in `requirements/REQ-*.md`
2. Create architecture in `architecture/TECHSPEC-*.md`
3. Update this index as documents are added
"""
    (docs_path / "INDEX.md").write_text(index)
    print(f"  ✅ docs/INDEX.md")
    
    print()


def create_nso_config(base_path: Path):
    """Create NSO configuration file."""
    config = {
        "version": "2.0.0",
        "initialized": datetime.now().isoformat(),
        "workflows_enabled": ["BUILD", "DEBUG", "REVIEW", "PLAN"],
        "agents_enabled": ["Oracle", "Builder", "Janitor", "Librarian", "Designer", "Scout"],
        "auto_router": True,
        "memory_protocol": "LOAD_AT_START_UPDATE_AT_END",
        "context_tiers": {
            "tier1": "~/.config/opencode/nso/",
            "tier2": "./.opencode/"
        }
    }
    
    config_path = base_path / "nso-config.json"
    config_path.write_text(json.dumps(config, indent=2))
    print(f"⚙️  Created {config_path}")
    print()


def check_nso_system():
    """Verify NSO global system is installed."""
    nso_path = Path.home() / ".config/opencode/nso"
    
    if not nso_path.exists():
        print("⚠️  WARNING: NSO global system not found!")
        print(f"   Expected: {nso_path}")
        print("\n   Please ensure NSO is installed at ~/.config/opencode/nso/")
        print("   The project context has been created, but global NSO is required.")
        return False
    
    print("✅ NSO global system found")
    return True


def generate_summary(project_name: str, project_type: str, base_path: Path):
    """Generate initialization summary."""
    print("=" * 70)
    print("🎉 PROJECT INITIALIZATION COMPLETE")
    print("=" * 70)
    print()
    print(f"📦 Project Name: {project_name}")
    print(f"🔧 Project Type: {project_type}")
    print(f"📂 Base Path: {base_path.absolute()}")
    print()
    print("📁 Created Structure:")
    print("  .opencode/")
    print("  ├── context/")
    print("  │   ├── 00_meta/")
    print("  │   │   ├── tech-stack.md")
    print("  │   │   ├── patterns.md")
    print("  │   │   └── glossary.md")
    print("  │   ├── 01_memory/")
    print("  │   │   ├── active_context.md")
    print("  │   │   ├── patterns.md")
    print("  │   │   └── progress.md")
    print("  │   ├── 02_learned/")
    print("  │   ├── 03_proposals/")
    print("  │   └── active_features/")
    print("  ├── docs/")
    print("  │   ├── architecture/")
    print("  │   └── requirements/")
    print("  ├── hooks/")
    print("  ├── logs/")
    print("  └── nso-config.json")
    print()
    print("🚀 Next Steps:")
    print("  1. Run: python3 ~/.config/opencode/nso/scripts/init_session.py")
    print("  2. Begin requirements gathering with Oracle")
    print("  3. The router will automatically detect development intent")
    print()
    print("📖 Documentation:")
    print("  - NSO Instructions: ~/.config/opencode/nso/instructions.md")
    print("  - Agent Roles: ~/.config/opencode/nso/AGENTS.md")
    print("  - Workflows: ~/.config/opencode/nso/docs/workflows/")
    print()
    print("=" * 70)


def main():
    """Main initialization logic."""
    print("=" * 70)
    print("🚀 NSO PROJECT INITIALIZATION")
    print("=" * 70)
    print()
    
    # Parse arguments
    if len(sys.argv) > 1:
        project_name = sys.argv[1]
    else:
        # Try to detect from current directory
        project_name = Path.cwd().name.replace("-", " ").replace("_", " ").title()
        print(f"📦 Project name (auto-detected): {project_name}")
    
    if len(sys.argv) > 2:
        project_type = sys.argv[2]
    else:
        project_type = detect_project_type()
        print(f"🔧 Project type (auto-detected): {project_type}")
    
    print()
    
    # Check if already initialized
    base_path = Path(".opencode")
    if base_path.exists():
        print("⚠️  Warning: .opencode/ already exists!")
        response = input("   Overwrite existing files? (y/N): ").lower()
        if response != 'y':
            print("\n❌ Initialization cancelled")
            return
        print()
    
    # Check NSO system
    nso_available = check_nso_system()
    if not nso_available:
        print()
    
    # Create everything
    create_directory_structure(base_path)
    create_meta_files(base_path, project_name, project_type)
    create_memory_files(base_path, project_name)
    create_docs_structure(base_path)
    create_nso_config(base_path)
    
    # Generate summary
    generate_summary(project_name, project_type, base_path)
    
    print("\n✅ Ready to use! Run init_session.py to begin.")


if __name__ == "__main__":
    main()
