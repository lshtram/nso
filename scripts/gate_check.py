#!/usr/bin/env python3
"""
NSO Gate Check — Filesystem-Based Phase Transition Validator

Reads the actual filesystem to verify that required artifacts exist
AND contain required quality content before allowing a phase transition.
Returns JSON for programmatic use.

Usage:
    python3 gate_check.py check --workflow BUILD --phase DISCOVERY --task-dir .opencode/context/active_tasks/my_task
    python3 gate_check.py check --workflow BUILD --phase IMPLEMENTATION --task-dir .opencode/context/active_tasks/my_task
    python3 gate_check.py list

Design: Filesystem is the database. This script reads files to determine
if gate criteria are met. It does NOT maintain its own state.

Quality Model (Option A — enriched gates, not extra phases):
  - Artifact existence checks (file must exist)
  - Content quality checks (required sections must be present)
  - Automated tool checks (typecheck/test status fields in result.md)
  - Review score checks (code_review_score >= 80 from Janitor)
"""

from __future__ import annotations

import json
import sys
import argparse
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class GateResult:
    """Result of a gate check."""
    passed: bool
    workflow: str
    phase: str
    task_dir: str
    reason: str
    missing_artifacts: list[str]
    found_artifacts: list[str]
    quality_checks: list[dict]  # [{name, passed, detail}]
    agent_id: Optional[str] = None

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)


def _find_files(base: Path, pattern: str) -> list[Path]:
    """Find files matching a glob pattern."""
    return [m for m in base.glob(pattern) if m.exists()]


def _read_status_field(filepath: Path, field: str) -> Optional[str]:
    """Read a field value from a markdown file (e.g., 'Status: COMPLETE')."""
    if not filepath.exists():
        return None
    content = filepath.read_text()
    for line in content.split("\n"):
        if field.lower() in line.lower() and ":" in line:
            return line.split(":", 1)[1].strip()
    return None


def _check_sections(filepath: Path, required_sections: list[str]) -> tuple[list[str], list[str]]:
    """
    Check if a markdown file contains the required sections (case-insensitive).
    Returns (found_sections, missing_sections).
    """
    if not filepath.exists():
        return [], required_sections[:]

    content = filepath.read_text().lower()
    found = []
    missing = []
    for section in required_sections:
        # Look for section as heading (## Section) or bold (**Section**) or plain text
        section_lower = section.lower()
        if (
            f"## {section_lower}" in content
            or f"### {section_lower}" in content
            or f"**{section_lower}**" in content
            or f"# {section_lower}" in content
            or section_lower in content
        ):
            found.append(section)
        else:
            missing.append(section)
    return found, missing


def _check_result_field(filepath: Path, field: str, expected: str) -> tuple[bool, str]:
    """
    Check if a result.md file contains a field with the expected value.
    Returns (passed, detail).
    Field matching is case-insensitive. Expected value matching is case-insensitive.
    """
    if not filepath.exists():
        return False, f"File not found: {filepath}"

    content = filepath.read_text()
    for line in content.split("\n"):
        stripped = line.strip().lower()
        field_lower = field.lower()
        if field_lower in stripped and ":" in stripped:
            value = stripped.split(":", 1)[1].strip()
            # Strip markdown formatting (bold, etc.)
            value = value.replace("**", "").replace("*", "").strip()
            if expected.lower() in value:
                return True, f"{field}: {value}"
            else:
                return False, f"{field} is '{value}', expected '{expected}'"
    return False, f"{field} not found in {filepath.name}"


def _check_result_score(filepath: Path, field: str, minimum: int) -> tuple[bool, str]:
    """
    Check if a result.md file contains a numeric score field >= minimum.
    Returns (passed, detail).
    """
    if not filepath.exists():
        return False, f"File not found: {filepath}"

    content = filepath.read_text()
    for line in content.split("\n"):
        stripped = line.strip().lower()
        field_lower = field.lower()
        if field_lower in stripped and ":" in stripped:
            value_str = stripped.split(":", 1)[1].strip()
            # Extract numeric value (handle "85/100", "85", "85%")
            value_str = value_str.replace("**", "").replace("*", "").strip()
            for part in value_str.replace("/", " ").replace("%", " ").split():
                try:
                    score = int(part)
                    if score >= minimum:
                        return True, f"{field}: {score} (>= {minimum})"
                    else:
                        return False, f"{field}: {score} (< {minimum}, minimum required)"
                except ValueError:
                    continue
            return False, f"{field} value '{value_str}' is not numeric"
    return False, f"{field} not found in {filepath.name}"


def _find_req_files(task_dir: Path) -> list[Path]:
    """Find REQ-*.md files in standard locations."""
    req_patterns = [
        (Path("."), ".opencode/docs/requirements/REQ-*.md"),
        (task_dir, "REQ-*.md"),
        (task_dir, "*_REQ-*.md"),
    ]
    results = []
    for base, pattern in req_patterns:
        results.extend(_find_files(base, pattern))
    return results


def _find_techspec_files(task_dir: Path) -> list[Path]:
    """Find TECHSPEC-*.md files in standard locations."""
    techspec_patterns = [
        (Path("."), ".opencode/docs/architecture/TECHSPEC-*.md"),
        (task_dir, "TECHSPEC-*.md"),
        (task_dir, "*_TECHSPEC-*.md"),
    ]
    results = []
    for base, pattern in techspec_patterns:
        results.extend(_find_files(base, pattern))
    return results


def _find_result_file(task_dir: Path, prefix: str = "") -> Optional[Path]:
    """Find result.md in the task directory, optionally with a prefix."""
    if prefix:
        prefixed = task_dir / f"{prefix}_result.md"
        if prefixed.exists():
            return prefixed
    result = task_dir / "result.md"
    if result.exists():
        return result
    return None


def _find_validation_result(task_dir: Path) -> Optional[Path]:
    """Find the Janitor's validation result.md."""
    # Try {task_dir}_validation/ first (separate validation task dir)
    validation_dir = Path(str(task_dir) + "_validation")
    if validation_dir.exists():
        result = validation_dir / "result.md"
        if result.exists():
            return result
    # Fallback to validation_result.md in same dir
    fallback = task_dir / "validation_result.md"
    if fallback.exists():
        return fallback
    return None


# ─── BUILD Gate Definitions ─────────────────────────────────────────

def _gate_build_discovery(task_dir: Path) -> GateResult:
    """
    BUILD/DISCOVERY → Architecture.
    Checks:
      1. REQ-*.md exists
      2. REQ-*.md contains required sections: Scope, Acceptance Criteria, Constraints
    """
    missing = []
    found = []
    quality = []

    # 1. Artifact existence
    req_files = _find_req_files(task_dir)
    if req_files:
        found.extend([str(f) for f in req_files])
    else:
        missing.append("REQ-*.md (requirements document)")

    # 2. Content quality — check required sections in all found REQ files
    required_sections = ["scope", "acceptance criteria", "constraints"]
    if req_files:
        for req_file in req_files:
            found_sections, missing_sections = _check_sections(req_file, required_sections)
            for s in found_sections:
                quality.append({"name": f"section:{s}", "passed": True, "detail": f"Found in {req_file.name}"})
            for s in missing_sections:
                quality.append({"name": f"section:{s}", "passed": False, "detail": f"Missing in {req_file.name}"})
                missing.append(f"REQ section '{s}' missing in {req_file.name}")

    return GateResult(
        passed=len(missing) == 0,
        workflow="BUILD",
        phase="DISCOVERY",
        task_dir=str(task_dir),
        reason="Requirements must exist with Scope, Acceptance Criteria, Constraints" if missing else "Requirements document complete",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


def _gate_build_architecture(task_dir: Path) -> GateResult:
    """
    BUILD/ARCHITECTURE → Implementation.
    Checks:
      1. TECHSPEC-*.md exists
      2. TECHSPEC-*.md contains required sections: interface/API, data model, error handling
      3. REQ-*.md still exists (not deleted)
    """
    missing = []
    found = []
    quality = []

    # 1. Artifact existence
    techspec_files = _find_techspec_files(task_dir)
    if techspec_files:
        found.extend([str(f) for f in techspec_files])
    else:
        missing.append("TECHSPEC-*.md (technical specification)")

    # 2. Content quality
    required_sections = ["interface", "data model", "error handling"]
    if techspec_files:
        for ts_file in techspec_files:
            found_sections, missing_sections = _check_sections(ts_file, required_sections)
            for s in found_sections:
                quality.append({"name": f"section:{s}", "passed": True, "detail": f"Found in {ts_file.name}"})
            for s in missing_sections:
                quality.append({"name": f"section:{s}", "passed": False, "detail": f"Missing in {ts_file.name}"})
                missing.append(f"TECHSPEC section '{s}' missing in {ts_file.name}")

    # 3. REQ-*.md still exists
    req_files = _find_req_files(task_dir)
    if req_files:
        found.extend([str(f) for f in req_files])
    else:
        missing.append("REQ-*.md (requirements document — was it deleted?)")

    return GateResult(
        passed=len(missing) == 0,
        workflow="BUILD",
        phase="ARCHITECTURE",
        task_dir=str(task_dir),
        reason="Tech spec must exist with Interface, Data Model, Error Handling sections" if missing else "Tech spec and requirements complete",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


def _gate_build_implementation(task_dir: Path) -> GateResult:
    """
    BUILD/IMPLEMENTATION → Validation.
    Checks:
      1. Builder result.md exists
      2. result.md status != FAIL
      3. result.md contains typecheck_status: PASS
      4. result.md contains test_status: PASS
    """
    missing = []
    found = []
    quality = []

    result_path = _find_result_file(task_dir)

    if result_path:
        found.append(str(result_path))
        content = result_path.read_text().lower()

        # Status check
        if "status: fail" in content or "status:fail" in content:
            missing.append("Builder result.md shows FAIL status")
            quality.append({"name": "status", "passed": False, "detail": "Builder reported FAIL"})
        else:
            quality.append({"name": "status", "passed": True, "detail": "Builder did not report FAIL"})

        # typecheck_status
        tc_passed, tc_detail = _check_result_field(result_path, "typecheck_status", "pass")
        quality.append({"name": "typecheck_status", "passed": tc_passed, "detail": tc_detail})
        if not tc_passed:
            missing.append(f"typecheck_status: {tc_detail}")

        # test_status
        ts_passed, ts_detail = _check_result_field(result_path, "test_status", "pass")
        quality.append({"name": "test_status", "passed": ts_passed, "detail": ts_detail})
        if not ts_passed:
            missing.append(f"test_status: {ts_detail}")
    else:
        missing.append(f"result.md not found in {task_dir} (Builder must write result.md on completion)")

    # Contract must exist
    contract_path = task_dir / "contract.md"
    if contract_path.exists():
        found.append(str(contract_path))
    else:
        missing.append(f"{contract_path} (Oracle must write contract before delegating)")

    return GateResult(
        passed=len(missing) == 0,
        workflow="BUILD",
        phase="IMPLEMENTATION",
        task_dir=str(task_dir),
        reason="Builder result required with typecheck + tests passing" if missing else "Builder completed with passing checks",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


def _gate_build_validation(task_dir: Path) -> GateResult:
    """
    BUILD/VALIDATION → Closure.
    Checks:
      1. Janitor result.md exists with recommendation: APPROVE
      2. code_review_score >= 80
      3. typecheck_status: PASS in Janitor result
      4. test_status: PASS in Janitor result
    """
    missing = []
    found = []
    quality = []

    result_path = _find_validation_result(task_dir)

    if result_path:
        found.append(str(result_path))
        content = result_path.read_text().lower()

        # Recommendation check
        if "approve" in content:
            found.append("Janitor recommendation: APPROVE")
            quality.append({"name": "recommendation", "passed": True, "detail": "APPROVE"})
        elif "reject" in content:
            missing.append("Janitor recommendation: REJECT — fix issues before closure")
            quality.append({"name": "recommendation", "passed": False, "detail": "REJECT"})
        else:
            missing.append("Janitor result.md missing recommendation (APPROVE/REJECT)")
            quality.append({"name": "recommendation", "passed": False, "detail": "No recommendation found"})

        # code_review_score >= 80
        score_passed, score_detail = _check_result_score(result_path, "code_review_score", 80)
        quality.append({"name": "code_review_score", "passed": score_passed, "detail": score_detail})
        if not score_passed:
            # Also try confidence_score as alias
            score_passed2, score_detail2 = _check_result_score(result_path, "confidence_score", 80)
            if score_passed2:
                quality[-1] = {"name": "code_review_score", "passed": True, "detail": score_detail2 + " (via confidence_score)"}
            else:
                missing.append(f"code_review_score: {score_detail}")

        # typecheck_status
        tc_passed, tc_detail = _check_result_field(result_path, "typecheck_status", "pass")
        quality.append({"name": "typecheck_status", "passed": tc_passed, "detail": tc_detail})
        if not tc_passed:
            missing.append(f"Janitor typecheck_status: {tc_detail}")

        # test_status
        ts_passed, ts_detail = _check_result_field(result_path, "test_status", "pass")
        quality.append({"name": "test_status", "passed": ts_passed, "detail": ts_detail})
        if not ts_passed:
            missing.append(f"Janitor test_status: {ts_detail}")
    else:
        missing.append(f"Janitor result.md not found (tried {task_dir}_validation/ and {task_dir}/validation_result.md)")

    return GateResult(
        passed=len(missing) == 0,
        workflow="BUILD",
        phase="VALIDATION",
        task_dir=str(task_dir),
        reason="Janitor approval + score >= 80 + passing checks required" if missing else "Janitor approved with passing quality checks",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


# ─── DEBUG Gate Definitions ─────────────────────────────────────────

def _gate_debug_investigation(task_dir: Path) -> GateResult:
    """
    DEBUG/INVESTIGATION → Fix.
    Checks:
      1. Janitor result.md exists with root cause analysis
      2. Evidence documented
    """
    missing = []
    found = []
    quality = []

    result_path = _find_result_file(task_dir)
    if result_path:
        content = result_path.read_text().lower()
        found.append(str(result_path))

        if "root cause" in content or "root_cause" in content:
            quality.append({"name": "root_cause", "passed": True, "detail": "Root cause documented"})
        else:
            missing.append("Investigation result missing root cause analysis")
            quality.append({"name": "root_cause", "passed": False, "detail": "No root cause found"})

        if "evidence" in content:
            quality.append({"name": "evidence", "passed": True, "detail": "Evidence documented"})
        else:
            missing.append("Investigation result missing evidence")
            quality.append({"name": "evidence", "passed": False, "detail": "No evidence found"})
    else:
        missing.append(f"result.md not found in {task_dir} (Janitor investigation result required)")

    return GateResult(
        passed=len(missing) == 0,
        workflow="DEBUG",
        phase="INVESTIGATION",
        task_dir=str(task_dir),
        reason="Investigation evidence required" if missing else "Investigation complete with evidence",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


def _gate_debug_fix(task_dir: Path) -> GateResult:
    """
    DEBUG/FIX → Validation.
    Checks:
      1. Builder result.md exists, status != FAIL
      2. result.md mentions regression test
      3. typecheck_status: PASS
      4. test_status: PASS
    """
    missing = []
    found = []
    quality = []

    result_path = _find_result_file(task_dir)
    if result_path:
        found.append(str(result_path))
        content = result_path.read_text().lower()

        # Status check
        if "status: fail" in content or "status:fail" in content:
            missing.append("Builder result.md shows FAIL status")
            quality.append({"name": "status", "passed": False, "detail": "Builder reported FAIL"})
        else:
            quality.append({"name": "status", "passed": True, "detail": "No FAIL status"})

        # Regression test mention
        if "regression" in content or "regression test" in content or "regression_test" in content:
            quality.append({"name": "regression_test", "passed": True, "detail": "Regression test mentioned"})
        else:
            missing.append("Builder result.md should mention regression test for the fix")
            quality.append({"name": "regression_test", "passed": False, "detail": "No regression test mentioned"})

        # typecheck_status
        tc_passed, tc_detail = _check_result_field(result_path, "typecheck_status", "pass")
        quality.append({"name": "typecheck_status", "passed": tc_passed, "detail": tc_detail})
        if not tc_passed:
            missing.append(f"typecheck_status: {tc_detail}")

        # test_status
        ts_passed, ts_detail = _check_result_field(result_path, "test_status", "pass")
        quality.append({"name": "test_status", "passed": ts_passed, "detail": ts_detail})
        if not ts_passed:
            missing.append(f"test_status: {ts_detail}")
    else:
        missing.append(f"result.md not found in {task_dir} (Builder must write result.md)")

    return GateResult(
        passed=len(missing) == 0,
        workflow="DEBUG",
        phase="FIX",
        task_dir=str(task_dir),
        reason="Builder fix result with regression test + passing checks required" if missing else "Builder fix complete with regression test",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


def _gate_debug_validation(task_dir: Path) -> GateResult:
    """
    DEBUG/VALIDATION → Closure.
    Checks:
      1. Janitor result.md exists with recommendation: APPROVE
      2. test_status: PASS (all tests including regression)
      3. typecheck_status: PASS
    """
    missing = []
    found = []
    quality = []

    result_path = _find_validation_result(task_dir)
    if result_path:
        found.append(str(result_path))
        content = result_path.read_text().lower()

        # Recommendation
        if "approve" in content:
            quality.append({"name": "recommendation", "passed": True, "detail": "APPROVE"})
        elif "reject" in content:
            missing.append("Janitor recommendation: REJECT")
            quality.append({"name": "recommendation", "passed": False, "detail": "REJECT"})
        else:
            missing.append("Janitor result.md missing recommendation (APPROVE/REJECT)")
            quality.append({"name": "recommendation", "passed": False, "detail": "No recommendation"})

        # test_status
        ts_passed, ts_detail = _check_result_field(result_path, "test_status", "pass")
        quality.append({"name": "test_status", "passed": ts_passed, "detail": ts_detail})
        if not ts_passed:
            missing.append(f"Janitor test_status: {ts_detail}")

        # typecheck_status
        tc_passed, tc_detail = _check_result_field(result_path, "typecheck_status", "pass")
        quality.append({"name": "typecheck_status", "passed": tc_passed, "detail": tc_detail})
        if not tc_passed:
            missing.append(f"Janitor typecheck_status: {tc_detail}")
    else:
        missing.append(f"Janitor result.md not found for validation")

    return GateResult(
        passed=len(missing) == 0,
        workflow="DEBUG",
        phase="VALIDATION",
        task_dir=str(task_dir),
        reason="Janitor approval + passing checks required" if missing else "Janitor approved debug fix",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


# ─── REVIEW Gate Definitions ────────────────────────────────────────

def _gate_review_scope(task_dir: Path) -> GateResult:
    """
    REVIEW/SCOPE → Analysis.
    Checks:
      1. Scope document exists (result.md or scope.md)
      2. Contains files/areas to review
    """
    missing = []
    found = []
    quality = []

    # Look for scope definition
    scope_path = task_dir / "result.md"
    if not scope_path.exists():
        scope_path = task_dir / "scope.md"

    if scope_path.exists():
        found.append(str(scope_path))
        content = scope_path.read_text().lower()

        # Check that scope contains files or areas
        has_files = "file" in content or ".ts" in content or ".js" in content or ".py" in content or "src/" in content
        has_areas = "area" in content or "focus" in content or "scope" in content or "review" in content

        if has_files or has_areas:
            quality.append({"name": "scope_defined", "passed": True, "detail": "Review scope/files defined"})
        else:
            missing.append("Scope document doesn't specify files or areas to review")
            quality.append({"name": "scope_defined", "passed": False, "detail": "No files or areas specified"})
    else:
        missing.append(f"Scope document not found in {task_dir} (result.md or scope.md)")

    return GateResult(
        passed=len(missing) == 0,
        workflow="REVIEW",
        phase="SCOPE",
        task_dir=str(task_dir),
        reason="Review scope must define files/areas" if missing else "Review scope defined",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


def _gate_review_analysis(task_dir: Path) -> GateResult:
    """
    REVIEW/ANALYSIS → Report.
    Checks:
      1. Analysis result.md exists
      2. Contains findings
      3. Contains confidence_score (any value — the Report phase will present to user)
    """
    missing = []
    found = []
    quality = []

    result_path = _find_result_file(task_dir)
    if result_path:
        found.append(str(result_path))
        content = result_path.read_text().lower()

        # Findings check
        has_findings = "finding" in content or "issue" in content or "observation" in content or "problem" in content
        if has_findings:
            quality.append({"name": "findings", "passed": True, "detail": "Findings documented"})
        else:
            missing.append("Analysis result missing findings/issues/observations")
            quality.append({"name": "findings", "passed": False, "detail": "No findings documented"})

        # Confidence score
        has_score = "confidence" in content or "score" in content
        if has_score:
            quality.append({"name": "confidence_score", "passed": True, "detail": "Score present"})
        else:
            missing.append("Analysis result missing confidence/score")
            quality.append({"name": "confidence_score", "passed": False, "detail": "No score found"})
    else:
        missing.append(f"Analysis result.md not found in {task_dir}")

    return GateResult(
        passed=len(missing) == 0,
        workflow="REVIEW",
        phase="ANALYSIS",
        task_dir=str(task_dir),
        reason="Analysis must include findings and confidence score" if missing else "Analysis complete with findings",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


def _gate_review_report(task_dir: Path) -> GateResult:
    """
    REVIEW/REPORT → Closure.
    Checks:
      1. Report result.md exists
      2. Contains recommendation (action items or summary)
    """
    missing = []
    found = []
    quality = []

    result_path = _find_result_file(task_dir)
    if result_path:
        found.append(str(result_path))
        content = result_path.read_text().lower()

        has_recommendation = (
            "recommend" in content
            or "action" in content
            or "summary" in content
            or "conclusion" in content
        )
        if has_recommendation:
            quality.append({"name": "recommendation", "passed": True, "detail": "Recommendation/action items present"})
        else:
            missing.append("Report missing recommendation, action items, or summary")
            quality.append({"name": "recommendation", "passed": False, "detail": "No recommendation found"})
    else:
        missing.append(f"Report result.md not found in {task_dir}")

    return GateResult(
        passed=len(missing) == 0,
        workflow="REVIEW",
        phase="REPORT",
        task_dir=str(task_dir),
        reason="Report must include recommendations" if missing else "Report complete with recommendations",
        missing_artifacts=missing,
        found_artifacts=found,
        quality_checks=quality,
    )


# ─── Gate Registry ──────────────────────────────────────────────────

GATES = {
    # BUILD workflow (4 gates)
    ("BUILD", "DISCOVERY"): _gate_build_discovery,
    ("BUILD", "ARCHITECTURE"): _gate_build_architecture,
    ("BUILD", "IMPLEMENTATION"): _gate_build_implementation,
    ("BUILD", "VALIDATION"): _gate_build_validation,
    # DEBUG workflow (3 gates)
    ("DEBUG", "INVESTIGATION"): _gate_debug_investigation,
    ("DEBUG", "FIX"): _gate_debug_fix,
    ("DEBUG", "VALIDATION"): _gate_debug_validation,
    # REVIEW workflow (3 gates)
    ("REVIEW", "SCOPE"): _gate_review_scope,
    ("REVIEW", "ANALYSIS"): _gate_review_analysis,
    ("REVIEW", "REPORT"): _gate_review_report,
}


def check_gate(workflow: str, phase: str, task_dir: str, agent_id: Optional[str] = None) -> GateResult:
    """
    Check if gate criteria are met by reading the filesystem.

    Args:
        workflow: BUILD, DEBUG, or REVIEW
        phase: Phase being exited (e.g., DISCOVERY means "can we leave Discovery?")
        task_dir: Path to task directory
        agent_id: Optional agent ID for traceability

    Returns:
        GateResult with pass/fail, artifact details, and quality check details
    """
    key = (workflow.upper(), phase.upper())
    task_path = Path(task_dir)

    if key not in GATES:
        return GateResult(
            passed=True,
            workflow=workflow,
            phase=phase,
            task_dir=task_dir,
            reason=f"No gate defined for {workflow}/{phase} — auto-pass",
            missing_artifacts=[],
            found_artifacts=[],
            quality_checks=[],
            agent_id=agent_id,
        )

    result = GATES[key](task_path)
    result.agent_id = agent_id
    return result


def list_gates() -> str:
    """List all defined gates with their descriptions."""
    lines = [
        "NSO Gate Definitions (Filesystem-Based, Quality-Enriched)",
        "=" * 60,
        "",
        "Each gate checks the filesystem for required artifacts AND content quality.",
        "Gates are checked when EXITING a phase (before entering the next).",
        "",
    ]

    current_workflow = ""
    for (workflow, phase), func in GATES.items():
        if workflow != current_workflow:
            lines.append(f"── {workflow} Workflow ──")
            current_workflow = workflow
        lines.append(f"  {workflow}/{phase}:")
        lines.append(f"    {(func.__doc__ or '').strip()}")
        lines.append("")

    return "\n".join(lines)


# ─── CLI ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="NSO Gate Check — Filesystem-based phase transition validator"
    )
    sub = parser.add_subparsers(dest="command")

    # check command
    check_p = sub.add_parser("check", help="Check if a gate allows phase transition")
    check_p.add_argument("--workflow", required=True, help="BUILD, DEBUG, or REVIEW")
    check_p.add_argument("--phase", required=True, help="Phase being exited")
    check_p.add_argument("--task-dir", required=True, help="Path to task directory")
    check_p.add_argument("--agent-id", default=None, help="Agent ID for traceability")
    check_p.add_argument("--format", choices=["json", "text"], default="json",
                         help="Output format (default: json)")

    # list command
    sub.add_parser("list", help="List all defined gates")

    args = parser.parse_args()

    if args.command == "check":
        result = check_gate(
            workflow=args.workflow,
            phase=args.phase,
            task_dir=args.task_dir,
            agent_id=getattr(args, "agent_id", None) or "",
        )

        if args.format == "json":
            print(result.to_json())
        else:
            status = "PASS" if result.passed else "FAIL"
            print(f"Gate: {result.workflow}/{result.phase} → {status}")
            print(f"Reason: {result.reason}")
            if result.missing_artifacts:
                print(f"Missing: {', '.join(result.missing_artifacts)}")
            if result.found_artifacts:
                print(f"Found: {', '.join(result.found_artifacts)}")
            if result.quality_checks:
                print("Quality Checks:")
                for qc in result.quality_checks:
                    icon = "PASS" if qc["passed"] else "FAIL"
                    print(f"  [{icon}] {qc['name']}: {qc['detail']}")

        sys.exit(0 if result.passed else 1)

    elif args.command == "list":
        print(list_gates())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
