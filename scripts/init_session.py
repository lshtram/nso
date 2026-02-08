#!/usr/bin/env python3
"""
NSO Session Initialization Script

Automatically loads all required context at the start of a new session.
This ensures the Oracle (and other agents) have full project context.

Usage:
    python3 init_session.py
    
Or from within an agent:
    Load NSO context by running: init_session.py
"""

import json
import sys
from pathlib import Path
from datetime import datetime


def load_file_content(file_path: Path, default_content: str = "") -> str:
    """Load content from a file, return default if not found."""
    if file_path.exists():
        try:
            return file_path.read_text()
        except Exception as e:
            return f"[Error reading {file_path}: {e}]"
    return default_content


def load_project_context():
    """Load Tier 2 (Project-Specific) context files."""
    context = {}
    
    # Define context files to load
    context_files = {
        "tech_stack": Path(".opencode/context/00_meta/tech-stack.md"),
        "patterns": Path(".opencode/context/00_meta/patterns.md"),
        "glossary": Path(".opencode/context/00_meta/glossary.md"),
    }
    
    print("📚 Loading Project Context (Tier 2)...")
    print("-" * 50)
    
    for name, file_path in context_files.items():
        content = load_file_content(file_path)
        context[name] = content
        status = "✅" if file_path.exists() else "⚠️  (not found)"
        print(f"{status} {name}: {file_path}")
    
    print()
    return context


def load_project_memory():
    """Load Tier 2 (Project-Specific) memory files."""
    memory = {}
    
    memory_files = {
        "active_context": Path(".opencode/context/01_memory/active_context.md"),
        "patterns": Path(".opencode/context/01_memory/patterns.md"),
        "progress": Path(".opencode/context/01_memory/progress.md"),
    }
    
    print("🧠 Loading Project Memory (Tier 2)...")
    print("-" * 50)
    
    for name, file_path in memory_files.items():
        content = load_file_content(file_path)
        memory[name] = content
        status = "✅" if file_path.exists() else "⚠️  (not found)"
        print(f"{status} {name}: {file_path}")
    
    print()
    return memory


def check_session_state():
    """Check if there's an active workflow in progress."""
    active_context_path = Path(".opencode/context/01_memory/active_context.md")
    
    if not active_context_path.exists():
        return {"in_workflow": False, "workflow": None, "status": "No active context"}
    
    try:
        content = active_context_path.read_text().lower()
        
        # Check for active states
        active_states = ["in_progress", "pending", "discovery", "architecture", 
                        "implementation", "validation", "investigation", "fix", 
                        "scope", "analysis"]
        
        in_workflow = any(state in content for state in active_states)
        
        # Try to determine which workflow
        workflow = None
        for wf in ["build", "debug", "review", "plan"]:
            if wf in content:
                workflow = wf.upper()
                break
        
        return {
            "in_workflow": in_workflow,
            "workflow": workflow,
            "status": "Active workflow detected" if in_workflow else "No active workflow"
        }
    except Exception as e:
        return {"in_workflow": False, "workflow": None, "status": f"Error: {e}"}


def check_nso_system():
    """Verify NSO global system is available."""
    nso_path = Path.home() / ".config/opencode/nso"
    
    print("🌐 Checking NSO System (Tier 1)...")
    print("-" * 50)
    
    if nso_path.exists():
        print(f"✅ NSO system found: {nso_path}")
        
        # Check key files
        key_files = [
            "instructions.md",
            "AGENTS.md",
            "scripts/router_monitor.py"
        ]
        
        all_present = True
        for file in key_files:
            file_path = nso_path / file
            status = "✅" if file_path.exists() else "❌"
            if not file_path.exists():
                all_present = False
            print(f"{status} {file}")
        
        if all_present:
            print("✅ NSO system fully operational")
        else:
            print("⚠️  Some NSO files missing")
        
        return {"available": True, "path": str(nso_path)}
    else:
        print(f"❌ NSO system not found at: {nso_path}")
        return {"available": False, "path": str(nso_path)}


def generate_session_summary(context, memory, session_state, nso_status):
    """Generate a summary of the initialized session."""
    print("\n" + "=" * 70)
    print("📋 SESSION INITIALIZATION SUMMARY")
    print("=" * 70)
    
    # Session timestamp
    print(f"\n🕐 Session Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # NSO Status
    print(f"\n🌐 NSO System: {'✅ Available' if nso_status['available'] else '❌ Not Found'}")
    if nso_status['available']:
        print(f"   Location: {nso_status['path']}")
    
    # Workflow State
    print(f"\n🔄 Workflow State:")
    print(f"   Status: {session_state['status']}")
    if session_state['in_workflow']:
        print(f"   ⚠️  Active {session_state['workflow']} workflow in progress")
        print(f"   💡 Continue current workflow, do NOT start new routing")
    else:
        print(f"   ✅ Ready for new workflow activation")
    
    # Context Loaded
    print(f"\n📚 Context Files Loaded:")
    print(f"   - Tech Stack: {'✅' if context.get('tech_stack') else '❌'}")
    print(f"   - Patterns: {'✅' if context.get('patterns') else '❌'}")
    print(f"   - Glossary: {'✅' if context.get('glossary') else '❌'}")
    
    # Memory Loaded
    print(f"\n🧠 Memory Files Loaded:")
    print(f"   - Active Context: {'✅' if memory.get('active_context') else '❌'}")
    print(f"   - Patterns: {'✅' if memory.get('patterns') else '❌'}")
    print(f"   - Progress: {'✅' if memory.get('progress') else '❌'}")
    
    # Recommendations
    print(f"\n💡 Next Steps:")
    if not nso_status['available']:
        print(f"   ⚠️  Initialize NSO system with: project_init.py")
    elif not session_state['in_workflow']:
        print(f"   ✅ Ready to receive user requests")
        print(f"   🎯 Router will automatically detect intent")
    else:
        print(f"   🔄 Continue {session_state['workflow']} workflow")
        print(f"   📖 Check active_context.md for current phase")
    
    print("\n" + "=" * 70)


def main():
    """Main initialization sequence."""
    print("=" * 70)
    print("🚀 NSO SESSION INITIALIZATION")
    print("=" * 70)
    print()
    
    # Check if we're in a project directory
    if not Path(".opencode").exists():
        print("❌ Error: Not in an NSO-enabled project directory")
        print("   Expected: .opencode/ directory not found")
        print("\n💡 Run project_init.py to initialize this directory")
        sys.exit(1)
    
    # Load all context
    context = load_project_context()
    memory = load_project_memory()
    session_state = check_session_state()
    nso_status = check_nso_system()
    
    # Generate summary
    generate_session_summary(context, memory, session_state, nso_status)
    
    # Return status as JSON for programmatic use
    result = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "nso_available": nso_status['available'],
        "in_workflow": session_state['in_workflow'],
        "current_workflow": session_state['workflow'],
        "context_loaded": {
            "tech_stack": bool(context.get('tech_stack')),
            "patterns": bool(context.get('patterns')),
            "glossary": bool(context.get('glossary')),
        },
        "memory_loaded": {
            "active_context": bool(memory.get('active_context')),
            "patterns": bool(memory.get('patterns')),
            "progress": bool(memory.get('progress')),
        }
    }
    
    # Save session init log
    log_path = Path(".opencode/logs/session_init.json")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    logs = []
    if log_path.exists():
        try:
            logs = json.loads(log_path.read_text())
            if not isinstance(logs, list):
                logs = []
        except:
            logs = []
    
    logs.append(result)
    
    # Keep only last 100 entries
    logs = logs[-100:]
    
    log_path.write_text(json.dumps(logs, indent=2))
    
    print(f"\n📝 Session log saved: {log_path}")
    print("\n✅ Session initialization complete!")
    
    return result


if __name__ == "__main__":
    result = main()
    
    # Output JSON for programmatic use
    print("\n" + "-" * 70)
    print("📊 JSON Output:")
    print("-" * 70)
    print(json.dumps(result, indent=2))
