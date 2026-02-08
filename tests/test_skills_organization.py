"""
Skill organization tests for NSO skills standard.

@verifies: FR-SKILLS-001
@verifies: FR-SKILLS-002
@verifies: FR-SKILLS-003
@verifies: FR-SKILLS-004
"""

from __future__ import annotations

from pathlib import Path
import re


SKILLS_ROOT = Path(__file__).resolve().parents[1] / "skills"

REQUIRED_SKILLS = [
    "rm-intent-clarifier",
    "rm-validate-intent",
    "rm-multi-perspective-audit",
    "rm-conflict-resolver",
    "brainstorming-bias-check",
    "architectural-review",
    "tdflow-unit-test",
    "minimal-diff-generator",
    "traceability-linker",
    "silent-failure-hunter",
    "tech-radar-scan",
    "router",
    "session-memory",
    "debugging-patterns",
    "verification-before-completion",
    "code-review-patterns",
    "planning-patterns",
    "code-generation",
    "skill-creator",
    "memory-update",
]


def _parse_frontmatter(skill_file: Path) -> dict[str, str]:
    lines = skill_file.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    try:
        end_index = lines[1:].index("---") + 1
    except ValueError:
        return {}

    frontmatter_lines = lines[1:end_index]
    data: dict[str, str] = {}
    for line in frontmatter_lines:
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip().strip("\"")
    return data


def test_no_flat_skills_files_exist():
    flat_files = list(SKILLS_ROOT.glob("*.md"))
    assert flat_files == []


def test_required_skills_directories_exist():
    missing = [skill for skill in REQUIRED_SKILLS if not (SKILLS_ROOT / skill).is_dir()]
    assert missing == []


def test_required_skill_entrypoints_exist():
    missing = [
        skill
        for skill in REQUIRED_SKILLS
        if not (SKILLS_ROOT / skill / "SKILL.md").is_file()
    ]
    assert missing == []


def test_skill_frontmatter_has_name_and_description():
    missing_fields = {}
    invalid_names = {}
    for skill in REQUIRED_SKILLS:
        skill_file = SKILLS_ROOT / skill / "SKILL.md"
        frontmatter = _parse_frontmatter(skill_file)
        name = frontmatter.get("name")
        description = frontmatter.get("description")
        if not name or not description:
            missing_fields[skill] = frontmatter
        if name != skill:
            invalid_names[skill] = name
        if name and not re.fullmatch(r"[a-z0-9-]{1,64}", name):
            invalid_names[skill] = name

    assert missing_fields == {}
    assert invalid_names == {}
