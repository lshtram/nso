"""
Memory validator tests for NSO memory architecture.

@verifies: FR-6
"""

from __future__ import annotations

from pathlib import Path

from scripts.memory_validator import (
    REQUIRED_ANCHORS,
    validate_memory_files,
)


def _write_memory_file(path: Path, anchors: list[str]) -> None:
    content_lines: list[str] = ["# Memory File", ""]
    for anchor in anchors:
        content_lines.append(anchor)
        content_lines.append("- item")
        content_lines.append("")
    path.write_text("\n".join(content_lines), encoding="utf-8")


def _write_empty_sections_file(path: Path, anchors: list[str]) -> None:
    content_lines: list[str] = ["# Memory File", ""]
    for anchor in anchors:
        content_lines.append(anchor)
        content_lines.append("")
    path.write_text("\n".join(content_lines), encoding="utf-8")


def test_validate_memory_files_success(tmp_path: Path) -> None:
    memory_root = tmp_path / "01_memory"
    memory_root.mkdir()

    for filename, anchors in REQUIRED_ANCHORS.items():
        _write_memory_file(memory_root / filename, anchors)

    result = validate_memory_files(memory_root)

    assert result["success"] is True
    assert result["errors"] == []


def test_validate_memory_files_missing_file(tmp_path: Path) -> None:
    memory_root = tmp_path / "01_memory"
    memory_root.mkdir()

    for filename, anchors in REQUIRED_ANCHORS.items():
        if filename == "patterns.md":
            continue
        _write_memory_file(memory_root / filename, anchors)

    result = validate_memory_files(memory_root)

    assert result["success"] is False
    assert any("patterns.md" in error for error in result["errors"])


def test_validate_memory_files_duplicate_anchor(tmp_path: Path) -> None:
    memory_root = tmp_path / "01_memory"
    memory_root.mkdir()

    anchors = REQUIRED_ANCHORS["active_context.md"]
    duplicate_anchor = anchors[0]
    content_lines = ["# Memory File", "", duplicate_anchor, "- item", "", duplicate_anchor]
    (memory_root / "active_context.md").write_text("\n".join(content_lines), encoding="utf-8")

    for filename, anchors in REQUIRED_ANCHORS.items():
        if filename == "active_context.md":
            continue
        _write_memory_file(memory_root / filename, anchors)

    result = validate_memory_files(memory_root)

    assert result["success"] is False
    assert any("duplicate" in error.lower() for error in result["errors"])


def test_validate_memory_files_empty_section_warning(tmp_path: Path) -> None:
    memory_root = tmp_path / "01_memory"
    memory_root.mkdir()

    _write_empty_sections_file(memory_root / "progress.md", REQUIRED_ANCHORS["progress.md"])

    for filename, anchors in REQUIRED_ANCHORS.items():
        if filename == "progress.md":
            continue
        _write_memory_file(memory_root / filename, anchors)

    result = validate_memory_files(memory_root)

    assert result["success"] is True
    assert result["warnings"]
