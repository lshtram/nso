#!/usr/bin/env python3
"""
NSO Session Closure Script

Handles proper session closure with validation, memory updates, and optional git operations.

Usage:
    python3 close_session.py [options]
    
Options:
    --message "commit message"    Custom commit message
    --no-push                    Commit but don't push
    --dry-run                    Show what would happen without doing it
    --force                      Skip confirmation prompts
"""

from __future__ import annotations

import subprocess
import sys
import argparse
import json as json_mod
from pathlib import Path
from datetime import datetime
from typing import Union


def run_command(cmd, cwd=None, capture_output=True):
    """Run a shell command and return result."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=capture_output,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)


def check_git_status() -> tuple[bool, dict | str]:
    """Check if there are uncommitted changes.
    
    Returns:
        (True, details_dict) on success
        (False, error_string) on failure
    """
    success, stdout, stderr = run_command("git status --porcelain")
    
    if not success:
        return False, f"Error checking git status: {stderr}"
    
    # Parse git status output
    modified_files: list[str] = []
    new_files: list[str] = []
    deleted_files: list[str] = []
    
    for line in stdout.strip().split('\n'):
        if not line:
            continue
        status = line[:2]
        filename = line[3:]
        
        if status.startswith('M') or status.endswith('M'):
            modified_files.append(filename)
        elif status.startswith('A') or status.startswith('?'):
            new_files.append(filename)
        elif status.startswith('D'):
            deleted_files.append(filename)
    
    has_changes = bool(modified_files or new_files or deleted_files)
    
    details: dict = {
        "has_changes": has_changes,
        "modified": modified_files,
        "new": new_files,
        "deleted": deleted_files,
        "total_changes": len(modified_files) + len(new_files) + len(deleted_files)
    }
    
    return True, details


def check_test_status():
    """Check if validation/tests pass."""
    # First check if there's a validate.py script
    validate_script = Path(".opencode/scripts/validate.py")
    
    if validate_script.exists():
        print("🔍 Running NSO validation...")
        success, stdout, stderr = run_command("python3 .opencode/scripts/validate.py --full")
        
        if success and "PASS" in stdout:
            return True, "NSO validation passed"
        elif success:
            # Check if tests actually ran
            if "test" in stdout.lower() or "pass" in stdout.lower():
                return True, "Validation completed"
        else:
            return False, f"Validation failed: {stderr or stdout}"
    
    # Check for common test commands
    test_commands = [
        ("npm run validate", "package.json"),
        ("npm run test", "package.json"),
        ("npm run check", "package.json"),
        ("pytest", "pytest.ini"),
        ("python -m pytest", "pytest.ini"),
    ]
    
    for cmd, marker in test_commands:
        if Path(marker).exists():
            print(f"🔍 Running tests: {cmd}...")
            success, stdout, stderr = run_command(cmd)
            
            if success:
                return True, f"Tests passed ({cmd})"
            else:
                return False, f"Tests failed: {stderr or stdout}"
    
    # No test suite found
    return None, "No test suite detected"


def update_memory_files():
    """Update memory files for session closure."""
    print("📝 Updating memory files...")
    
    # Update active_context.md
    active_context_path = Path(".opencode/context/01_memory/active_context.md")
    if active_context_path.exists():
        content = active_context_path.read_text()
        
        # Update status to COMPLETE if not already
        if "Status:" in content and "COMPLETE" not in content:
            content = content.replace(
                "Status: IN_PROGRESS", 
                "Status: COMPLETE"
            ).replace(
                "Status: PENDING",
                "Status: COMPLETE"
            )
            
            # Add session closure timestamp
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            closure_note = f"\n- Session closed: {timestamp}\n"
            
            if "## Next Steps" in content:
                content = content.replace("## Next Steps", f"{closure_note}## Next Steps")
            else:
                content += f"\n{closure_note}"
            
            active_context_path.write_text(content)
            print("  ✅ active_context.md updated")
    
    # Note: patterns.md and progress.md should be updated during the session
    # not just at closure
    
    return True


def stage_memory_files():
    """Stage memory file changes."""
    memory_files = [
        ".opencode/context/01_memory/active_context.md",
        ".opencode/context/01_memory/patterns.md",
        ".opencode/context/01_memory/progress.md"
    ]
    
    for file in memory_files:
        if Path(file).exists():
            run_command(f"git add {file}")
    
    return True


def create_commit_message(custom_message=None):
    """Generate commit message."""
    if custom_message:
        return custom_message
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Try to extract current focus from active_context.md
    active_context_path = Path(".opencode/context/01_memory/active_context.md")
    if active_context_path.exists():
        content = active_context_path.read_text()
        
        # Look for Current Focus
        for line in content.split('\n'):
            if 'current focus' in line.lower() and '-' in line:
                focus = line.split('-', 1)[1].strip()
                if focus and not focus.endswith('COMPLETED'):
                    return f"Session closure: {focus} [{timestamp}]"
    
    return f"Session closure: Memory updates [{timestamp}]"


def is_interactive():
    """Check if running in an interactive terminal."""
    return sys.stdin.isatty()


def prompt_user(question, default="yes", force_non_interactive=False):
    """Prompt user for confirmation. Auto-accepts in non-interactive mode."""
    if force_non_interactive or not is_interactive():
        # Non-interactive: use default answer
        result = default.lower() == "yes"
        print(f"{question} → {'yes' if result else 'no'} (non-interactive default)")
        return result
    
    if default.lower() == "yes":
        prompt = f"{question} [Y/n]: "
    else:
        prompt = f"{question} [y/N]: "
    
    try:
        response = input(prompt).strip().lower()
        if not response:
            return default.lower() == "yes"
        return response in ['y', 'yes']
    except (EOFError, KeyboardInterrupt):
        return False


def main():
    parser = argparse.ArgumentParser(description="NSO Session Closure")
    parser.add_argument("--message", "-m", help="Custom commit message")
    parser.add_argument("--no-push", action="store_true", help="Commit but don't push")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen")
    parser.add_argument("--force", action="store_true", help="Skip confirmation prompts")
    parser.add_argument("--non-interactive", action="store_true",
                        help="Non-interactive mode: auto-accept defaults, no input() calls. "
                             "Use when called by Librarian agent via task().")
    parser.add_argument("--json", action="store_true",
                        help="Output results as JSON (for programmatic use)")
    args = parser.parse_args()
    
    print("=" * 70)
    print("🔒 NSO SESSION CLOSURE")
    print("=" * 70)
    print()
    
    if args.dry_run:
        print("🧪 DRY RUN MODE - No changes will be made")
        print()
    
    # Step 1: Check if we're in a git repo
    success, stdout, stderr = run_command("git rev-parse --git-dir")
    if not success:
        print("❌ Error: Not in a git repository")
        sys.exit(1)
    
    # Step 2: Check for uncommitted changes
    print("Checking repository status...")
    success, git_status = check_git_status()
    
    if not success:
        print(f"Error: {git_status}")
        sys.exit(1)
    
    # Type narrowing: if success is True, git_status is a dict
    assert isinstance(git_status, dict)
    
    has_code_changes = git_status["has_changes"]
    code_changes_count = git_status["total_changes"]
    
    if has_code_changes:
        print(f"   Found {code_changes_count} changed file(s):")
        for f in git_status["modified"]:
            print(f"     M {f}")
        for f in git_status["new"]:
            print(f"     A {f}")
        for f in git_status["deleted"]:
            print(f"     D {f}")
    else:
        print("   No code changes detected")
    
    print()
    
    # Step 3: Check test status (only if code changes exist)
    if has_code_changes:
        print("🧪 Checking test/validation status...")
        tests_passed, test_message = check_test_status()
        
        if tests_passed is True:
            print(f"   ✅ {test_message}")
        elif tests_passed is False:
            print(f"   ❌ {test_message}")
        else:
            print(f"   ⚠️  {test_message}")
        
        print()
    else:
        tests_passed = True  # No code changes = nothing to test
        test_message = "No code changes to validate"
    
    # Step 4: Update memory files
    if not args.dry_run:
        update_memory_files()
    else:
        print("📝 Would update memory files...")
    
    # Step 5: Determine git actions
    print("📋 Session Closure Plan:")
    print("-" * 70)
    
    actions = []
    
    # Always stage memory files
    actions.append("Stage memory files (active_context.md, patterns.md, progress.md)")
    
    if has_code_changes:
        if tests_passed:
            actions.append(f"Stage {code_changes_count} code file(s)")
            actions.append("Create commit with memory updates + code changes")
            if not args.no_push:
                actions.append("Push to remote")
            else:
                actions.append("(Skip push: --no-push flag set)")
        else:
            actions.append("⚠️  Code changes detected but tests failed")
            actions.append("   Options:")
            actions.append("   1. Fix tests and re-run close-session")
            actions.append("   2. Commit only memory files (skip code)")
            actions.append("   3. Force commit anyway (not recommended)")
    else:
        actions.append("Create commit with memory updates only")
        if not args.no_push:
            actions.append("Push to remote")
    
    for i, action in enumerate(actions, 1):
        print(f"{i}. {action}")
    
    print()
    
    # Step 6: User confirmation
    non_interactive = args.non_interactive or args.force or not is_interactive()
    
    if not non_interactive and not args.dry_run:
        if has_code_changes and not tests_passed:
            print("WARNING: You have code changes but tests are failing!")
            print()
            try:
                choice = input("What would you like to do?\n"
                              "[1] Fix tests first (recommended)\n"
                              "[2] Commit only memory files\n"
                              "[3] Commit everything anyway\n"
                              "[4] Cancel\n"
                              "Choice: ").strip()
            except (EOFError, KeyboardInterrupt):
                choice = "2"  # Safe default: commit only memory
            
            if choice == "1":
                print("\nSession closure cancelled. Please fix tests and try again.")
                print(f"   Test status: {test_message}")
                sys.exit(1)
            elif choice == "2":
                print("\nWill commit only memory files.")
                has_code_changes = False
            elif choice == "3":
                if not prompt_user("Are you sure? Committing failing code is not recommended"):
                    print("\nSession closure cancelled.")
                    sys.exit(1)
            else:
                print("\nSession closure cancelled.")
                sys.exit(0)
        else:
            if not prompt_user("Proceed with session closure?"):
                print("\nSession closure cancelled.")
                sys.exit(0)
    elif non_interactive:
        # Non-interactive: auto-decide
        if has_code_changes and not tests_passed:
            print("Non-interactive mode: tests failing, committing only memory files.")
            has_code_changes = False
        else:
            print("Non-interactive mode: auto-proceeding with closure.")
    
    if args.dry_run:
        if args.json:
            print(json_mod.dumps({
                "status": "dry_run",
                "memory_updated": False,
                "committed": False,
                "pushed": False,
                "commit_message": "",
                "test_status": str(test_message),
                "planned_actions": actions
            }))
        else:
            print("\nDry run complete. No changes made.")
        sys.exit(0)
    
    # Step 7: Execute git operations
    print("\nExecuting session closure...")
    print()
    
    # Track results for JSON output
    committed = False
    pushed = False
    commit_message = ""
    push_success = False
    
    # Stage memory files
    stage_memory_files()
    print("Memory files staged")
    
    # Stage code changes if appropriate
    if has_code_changes and tests_passed:
        run_command("git add -A")
        print("Code changes staged")
    
    # Create commit
    commit_message = create_commit_message(args.message)
    success, stdout, stderr = run_command(f'git commit -m "{commit_message}"')
    
    if success:
        committed = True
        print(f"Commit created: {commit_message}")
    else:
        # Check if it's just "nothing to commit"
        if "nothing to commit" in stderr or "nothing to commit" in stdout:
            print("Nothing to commit (memory files unchanged)")
        else:
            if args.json:
                print(json_mod.dumps({
                    "status": "failure",
                    "error": f"Commit failed: {stderr}",
                    "memory_updated": True,
                    "committed": False,
                    "pushed": False,
                    "commit_message": commit_message,
                    "test_status": str(test_message)
                }))
            else:
                print(f"Commit failed: {stderr}")
            sys.exit(1)
    
    # Push if requested
    if not args.no_push:
        print("\nPushing to remote...")
        push_success, stdout, stderr = run_command("git push")
        pushed = push_success
        
        if push_success:
            print("Pushed successfully")
        else:
            print(f"Push failed: {stderr}")
            print("   You may need to push manually")
    
    # Final output: JSON or text summary
    if args.json:
        result = {
            "status": "success",
            "memory_updated": True,
            "committed": committed,
            "pushed": pushed,
            "commit_message": commit_message,
            "test_status": str(test_message),
            "code_changes_count": code_changes_count if has_code_changes else 0,
            "code_committed": bool(has_code_changes and tests_passed)
        }
        print(json_mod.dumps(result))
    else:
        print("\n" + "=" * 70)
        print("SESSION CLOSURE COMPLETE")
        print("=" * 70)
        print()
        print("Summary:")
        print(f"  - Memory files: Updated and committed")
        if has_code_changes and tests_passed:
            print(f"  - Code changes: {code_changes_count} file(s) committed")
        elif has_code_changes:
            print(f"  - Code changes: Skipped (tests failing)")
        else:
            print(f"  - Code changes: None")
        print(f"  - Tests: {test_message}")
        print(f"  - Commit: {commit_message[:50]}...")
        if not args.no_push:
            print(f"  - Push: {'Success' if pushed else 'Failed'}")
        print()
        print("Ready for next session!")


if __name__ == "__main__":
    main()
