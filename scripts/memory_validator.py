"""
Memory structure validator for NSO memory architecture.

@implements: FR-1
@implements: FR-6
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable, TypedDict


MEMORY_ROOT = Path(".opencode/context/01_memory")

REQUIRED_ANCHORS: dict[str, list[str]] = {
    "active_context.md": [
        "## Current Focus",
        "## Decisions",
        "## Open Questions",
        "## Next Steps",
    ],
    "patterns.md": [
        "## Conventions",
        "## Gotchas",
        "## Approved Practices",
    ],
    "progress.md": [
        "## Verified Deliverables",
        "## Evidence Links",
        "## Deferred Items",
    ],
}


def _find_anchor_positions(lines: list[str], anchor: str) -> list[int]:
    return [index for index, line in enumerate(lines, start=1) if line.strip() == anchor]


def _iter_section_lines(lines: list[str], start_line: int, anchors: set[str]) -> Iterable[str]:
    for line in lines[start_line:]:
        if line.strip() in anchors:
            break
        yield line


def _section_has_content(lines: list[str], start_line: int, anchors: set[str]) -> bool:
    for line in _iter_section_lines(lines, start_line, anchors):
        if line.strip():
            return True
    return False


class ValidationResult(TypedDict):
    success: bool
    errors: list[str]
    warnings: list[str]


def validate_memory_files(memory_root: Path) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    for filename, anchors in REQUIRED_ANCHORS.items():
        file_path = memory_root / filename
        if not file_path.exists():
            errors.append(f"Missing memory file: {filename}")
            continue

        lines = file_path.read_text(encoding="utf-8").splitlines()
        anchor_set = set(anchors)

        for anchor in anchors:
            positions = _find_anchor_positions(lines, anchor)
            if not positions:
                errors.append(f"Missing anchor '{anchor}' in {filename}")
                continue
            if len(positions) > 1:
                errors.append(f"Duplicate anchor '{anchor}' in {filename}")
                continue

            start_index = positions[0]
            if not _section_has_content(lines, start_index, anchor_set):
                warnings.append(f"Empty section '{anchor}' in {filename}")

    return {
        "success": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }


def _print_report(result: ValidationResult) -> None:
    success = result["success"]
    errors = result["errors"]
    warnings = result["warnings"]

    if success:
        print("✅ Memory validation PASSED")
    else:
        print("❌ Memory validation FAILED")

    if errors:
        print("Violations:")
        for error in errors:
            print(f"- {error}")

    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--path",
        type=Path,
        default=MEMORY_ROOT,
        help="Path to memory directory",
    )
    args = parser.parse_args()

    result = validate_memory_files(args.path)
    _print_report(result)
    return 0 if result["success"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
