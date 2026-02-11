#!/usr/bin/env python3
"""
NSO Universal Validator

Validates Python, TypeScript, documentation naming, and memory architecture.
Supports fast mode (single file) and full project harness.

Usage:
    python validate.py --full          # Full project validation
    python validate.py <file>           # Fast mode (single file, not yet implemented)
"""

import sys
import subprocess
import os
from pathlib import Path
from typing import List, Optional, Tuple


# Exit codes for validation results
EXIT_SUCCESS = 0
EXIT_GENERAL_ERROR = 1
EXIT_VALIDATION_FAILED = 2
EXIT_TOOL_NOT_FOUND = 3


def find_executable(name: str) -> Optional[str]:
    """Find an executable in PATH or common locations."""
    # Check PATH first
    result = subprocess.run(["which", name], capture_output=True, text=True)
    if result.returncode == 0:
        return result.stdout.strip()
    
    # Check common installation locations
    common_paths = [
        f"/Library/Frameworks/Python.framework/Versions/3.9/bin/{name}",
        f"/usr/local/bin/{name}",
        f"{os.path.expanduser('~')}/.local/bin/{name}",
        f"{os.path.expanduser('~')}/Library/Python/3.9/bin/{name}",
    ]
    
    for path in common_paths:
        if Path(path).exists():
            return path
    
    return None


def run_command(cmd: List[str], cwd: Optional[Path] = None) -> Tuple[bool, str]:
    """
    Run a shell command and return (success, output).
    
    Returns:
        Tuple of (success: bool, output: str)
    """
    try:
        result = subprocess.run(
            cmd, 
            cwd=cwd,
            capture_output=True,
            text=True
        )
        output = result.stdout + result.stderr
        if result.returncode != 0:
            return False, output
        return True, output
    except FileNotFoundError:
        return False, f"Tool not found: {cmd[0]}"


def has_python_module(module: str) -> bool:
    """Return True if the given module can be imported by this Python."""
    result = subprocess.run(
        [sys.executable, "-c", f"import {module}"]
    )
    return result.returncode == 0


def resolve_pytest_cmd() -> Optional[List[str]]:
    """Return pytest command list if available, else None."""
    pytest_path = find_executable("pytest")
    if pytest_path:
        return [pytest_path]
    if has_python_module("pytest"):
        return [sys.executable, "-m", "pytest"]
    return None


def collect_pytest_count(pytest_cmd: List[str]) -> Optional[int]:
    """Return number of collected tests, or None if collection fails."""
    try:
        result = subprocess.run(
            pytest_cmd + ["--collect-only", "-q"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return None
        lines = [line for line in result.stdout.splitlines() if line.strip()]
        return len(lines)
    except FileNotFoundError:
        return None


def validate_doc_naming() -> Tuple[bool, List[str]]:
    """
    Validate naming conventions for requirements and tech specs.
    
    Returns:
        Tuple of (success: bool, errors: List[str])
    """
    errors: List[str] = []

    requirements_dir = Path("docs/requirements")
    architecture_dir = Path("docs/architecture")

    if requirements_dir.exists():
        for path in requirements_dir.glob("*.md"):
            if not path.name.startswith("REQ-"):
                errors.append(f"Requirements file must start with 'REQ-': {path}")
    else:
        errors.append("Missing docs/requirements directory")

    if architecture_dir.exists():
        for path in architecture_dir.glob("*.md"):
            if not path.name.startswith("TECHSPEC-"):
                errors.append(f"Tech spec file must start with 'TECHSPEC-': {path}")
    else:
        errors.append("Missing docs/architecture directory")

    if errors:
        return False, errors

    return True, []


def validate_memory_architecture() -> Tuple[bool, str]:
    """
    Validate NSO memory files and anchors.
    
    Returns:
        Tuple of (success: bool, output: str)
    """
    script_path = Path(".opencode/scripts/memory_validator.py")
    if not script_path.exists():
        return False, "memory_validator.py not found. Skipping memory validation."
    
    success, output = run_command([sys.executable, str(script_path)])
    return success, output


def validate_python_file(file_path: Path) -> Tuple[bool, List[str]]:
    """
    Validate a Python file with ruff and mypy.
    
    Returns:
        Tuple of (success: bool, errors: List[str])
    """
    errors: List[str] = []
    
    # Find ruff
    ruff_path = find_executable("ruff")
    if not ruff_path:
        errors.append("ruff not found. Skipping lint.")
    else:
        success, output = run_command([ruff_path, "check", str(file_path)])
        if not success:
            errors.append(f"Ruff lint failed:\n{output}")
    
    # Find mypy
    mypy_path = find_executable("mypy")
    if not mypy_path:
        errors.append("mypy not found. Skipping type check.")
    else:
        success, output = run_command([mypy_path, str(file_path)])
        if not success:
            errors.append(f"MyPy type check failed:\n{output}")
    
    return len(errors) == 0, errors


def validate_typescript_file(file_path: Path) -> Tuple[bool, List[str]]:
    """
    Validate a TypeScript file with biome and tsc.
    
    Returns:
        Tuple of (success: bool, errors: List[str])
    """
    errors: List[str] = []
    
    # Find bun
    bun_path = find_executable("bun")
    if not bun_path:
        errors.append("bun not found. Skipping biome lint.")
    else:
        success, output = run_command([bun_path, "x", "biome", "check", str(file_path)])
        if not success:
            errors.append(f"Biome lint failed:\n{output}")
        
        # Type check with tsc
        success, output = run_command([bun_path, "x", "tsc", "--noEmit", "--skipLibCheck", str(file_path)])
        if not success:
            errors.append(f"TypeScript type check failed:\n{output}")
    
    return len(errors) == 0, errors


def run_full_harness() -> Tuple[bool, int]:
    """
    Run the full project validation harness.
    
    Returns:
        Tuple of (success: bool, exit_code: int)
    """
    print("🚀 Running FULL Project Harness...")
    
    ruff_path = find_executable("ruff")
    mypy_path = find_executable("mypy")
    
    # 1. Lint Project
    print("1️⃣  Linting...")
    if ruff_path:
        success, output = run_command([ruff_path, "check", ".", "--exclude", "_ARCHIVE_LEGACY"])
        if not success:
            print(f"❌ Linting failed:\n{output}")
            return False, EXIT_VALIDATION_FAILED
    else:
        print("⚠️  ruff not found. Skipping lint.")

    # 2. Type Check Project
    print("2️⃣  Type Checking...")
    if mypy_path:
        success, output = run_command([mypy_path, "--config-file", ".opencode/mypy.ini"])
        if not success:
            print(f"❌ Type checking failed:\n{output}")
            return False, EXIT_VALIDATION_FAILED
    else:
        print("⚠️  mypy not found. Skipping type check.")

    # 3. Documentation Naming Conventions
    print("2.5️⃣  Documentation Naming...")
    success, errors = validate_doc_naming()
    if not success:
        print("❌ Documentation naming validation failed:")
        for error in errors:
            print(f"- {error}")
        return False, EXIT_VALIDATION_FAILED
    print("✅ Documentation naming passed")

    # 4. Memory Architecture Validation
    print("2.6️⃣  Memory Architecture...")
    success, output = validate_memory_architecture()
    if not success:
        print(f"❌ Memory validation failed: {output}")
        return False, EXIT_VALIDATION_FAILED
    print("✅ Memory validation passed")

    # 5. Unit Tests
    print("3️⃣  Unit Tests...")
    pytest_cmd = resolve_pytest_cmd()
    if pytest_cmd:
        collected = collect_pytest_count(pytest_cmd)
        if collected is not None:
            print(f"🧪 Collected tests: {collected}")
        success, output = run_command(pytest_cmd)
        if not success:
            print(f"❌ Unit tests failed:\n{output}")
            return False, EXIT_VALIDATION_FAILED
    else:
        print("⚠️  pytest not found. Skipping tests.")

    # 6. E2E Tests (Simulated)
    print("4️⃣  E2E Tests...")
    print("⚠️  E2E tests not yet implemented (placeholder)")

    print("✅ FULL HARNESS PASSED")
    return True, EXIT_SUCCESS


def main() -> int:
    """Main entry point for the validator."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="NSO Universal Validator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python validate.py --full         # Full project validation
    python validate.py                 # Show usage
        """
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Run full project harness"
    )
    parser.add_argument(
        "file_path",
        nargs="?",
        help="Specific file to check (Fast Mode - not yet implemented)"
    )
    
    args = parser.parse_args()
    
    if args.full:
        success, exit_code = run_full_harness()
        return exit_code
    
    # Fast mode (not yet implemented)
    if args.file_path:
        print("⚠️  Fast mode not yet implemented. Use --full for full validation.")
        return EXIT_GENERAL_ERROR
    
    # No arguments - show usage
    print("Usage: python validate.py --full          # Full project validation")
    print("       python validate.py <file>          # Fast mode (not yet implemented)")
    return EXIT_GENERAL_ERROR


if __name__ == "__main__":
    sys.exit(main())
