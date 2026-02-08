"""
Unit tests for NSO Workflow System - Gate Enforcement.

@verifies: REQ-NSO-BUILD-Workflow (FR-5 Gate Enforcement)
"""

import pytest
import sys
from pathlib import Path

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from gate_check import (  # type: ignore
    check_gate,
    get_gate_criteria,
    GateResult,
    WORKFLOW_GATES,
)


class TestGateEnforcement:
    """Test gate enforcement logic."""

    def test_build_discovery_gate_requires_approval(self):
        """BUILD Discovery gate requires user approval."""
        # Contract with pending approval should fail
        contract_pending = {
            "status": "COMPLETE",
            "workflow": "BUILD",
            "phase": "DISCOVERY",
            "approval": "pending",
        }
        result = check_gate("BUILD", "DISCOVERY", contract_pending)
        assert result.passed is False
        assert "approve" in result.reason.lower()

        # Contract with approved status should pass
        contract_approved = {
            "status": "COMPLETE",
            "workflow": "BUILD",
            "phase": "DISCOVERY",
            "approval": "approved",
        }
        result = check_gate("BUILD", "DISCOVERY", contract_approved)
        assert result.passed is True

    def test_build_architecture_gate_requires_approval(self):
        """BUILD Architecture gate requires user approval."""
        contract_pending = {
            "status": "COMPLETE",
            "workflow": "BUILD",
            "phase": "ARCHITECTURE",
            "approval": "pending",
        }
        result = check_gate("BUILD", "ARCHITECTURE", contract_pending)
        assert result.passed is False

        contract_approved = {
            "status": "COMPLETE",
            "workflow": "BUILD",
            "phase": "ARCHITECTURE",
            "approval": "approved",
        }
        result = check_gate("BUILD", "ARCHITECTURE", contract_approved)
        assert result.passed is True

    def test_build_validation_gate_requires_test_pass(self):
        """BUILD Validation gate requires tests to pass."""
        contract_fail = {
            "status": "COMPLETE",
            "workflow": "BUILD",
            "phase": "VALIDATION",
            "test_status": "FAIL",
        }
        result = check_gate("BUILD", "VALIDATION", contract_fail)
        assert result.passed is False

        contract_pass = {
            "status": "COMPLETE",
            "workflow": "BUILD",
            "phase": "VALIDATION",
            "test_status": "PASS",
        }
        result = check_gate("BUILD", "VALIDATION", contract_pass)
        assert result.passed is True

    def test_debug_investigation_gate_requires_evidence(self):
        """DEBUG Investigation gate requires evidence and root cause."""
        contract_incomplete = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "INVESTIGATION",
            "evidence_collected": [],
            "root_cause": "",
        }
        result = check_gate("DEBUG", "INVESTIGATION", contract_incomplete)
        assert result.passed is False

        contract_complete = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "INVESTIGATION",
            "evidence_collected": ["log_error.txt", "stack_trace.txt"],
            "root_cause": "Null pointer exception in user initialization",
        }
        result = check_gate("DEBUG", "INVESTIGATION", contract_complete)
        assert result.passed is True

    def test_debug_fix_gate_requires_regression_test(self):
        """DEBUG Fix gate requires regression test and fix applied."""
        contract_incomplete = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "FIX",
            "regression_test": None,
            "fix_applied": False,
        }
        result = check_gate("DEBUG", "FIX", contract_incomplete)
        assert result.passed is False

        contract_partial = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "FIX",
            "regression_test": "tests/test_login.py",
            "fix_applied": False,
        }
        result = check_gate("DEBUG", "FIX", contract_partial)
        assert result.passed is False

        contract_complete = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "FIX",
            "regression_test": "tests/test_login.py",
            "fix_applied": True,
        }
        result = check_gate("DEBUG", "FIX", contract_complete)
        assert result.passed is True

    def test_debug_validation_gate_requires_all_tests_pass(self):
        """DEBUG Validation gate requires all tests to pass."""
        contract_fail = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "VALIDATION",
            "regression_test": "PASS",
            "full_test_suite": "FAIL",
        }
        result = check_gate("DEBUG", "VALIDATION", contract_fail)
        assert result.passed is False

        contract_pass = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "VALIDATION",
            "regression_test": "PASS",
            "full_test_suite": "PASS",
        }
        result = check_gate("DEBUG", "VALIDATION", contract_pass)
        assert result.passed is True

    def test_review_scope_gate_requires_files_reviewed(self):
        """REVIEW Scope gate requires files to be defined."""
        contract_incomplete = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "SCOPE",
            "files_reviewed": [],
            "focus_areas": [],
        }
        result = check_gate("REVIEW", "SCOPE", contract_incomplete)
        assert result.passed is False

        contract_complete = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "SCOPE",
            "files_reviewed": ["src/auth.py", "src/login.py"],
            "focus_areas": ["security", "performance"],
        }
        result = check_gate("REVIEW", "SCOPE", contract_complete)
        assert result.passed is True

    def test_review_analysis_gate_requires_issues_found(self):
        """REVIEW Analysis gate requires analysis to be complete."""
        contract_incomplete = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "ANALYSIS",
            "files_reviewed": ["src/auth.py"],
            "critical_issues": 0,
            "important_issues": 0,
            "minor_issues": 0,
        }
        result = check_gate("REVIEW", "ANALYSIS", contract_incomplete)
        # Analysis is complete when files are reviewed (even with 0 issues)
        assert result.passed is True

    def test_review_report_gate_requires_verdict(self):
        """REVIEW Report gate requires a verdict."""
        contract_incomplete = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "REPORT",
            "verdict": None,
            "issues_reported": 0,
        }
        result = check_gate("REVIEW", "REPORT", contract_incomplete)
        assert result.passed is False

        contract_complete = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "REPORT",
            "verdict": "APPROVE",
            "issues_reported": 3,
        }
        result = check_gate("REVIEW", "REPORT", contract_complete)
        assert result.passed is True

    def test_unknown_phase_has_no_gate(self):
        """Unknown phases have no gate requirements."""
        contract = {"status": "COMPLETE", "workflow": "BUILD", "phase": "UNKNOWN"}
        result = check_gate("BUILD", "UNKNOWN", contract)
        assert result.passed is True
        assert "No gate" in result.reason

    def test_get_gate_criteria_returns_description(self):
        """get_gate_criteria returns human-readable criteria."""
        criteria = get_gate_criteria("BUILD", "DISCOVERY")
        assert criteria is not None
        assert "approval" in criteria.lower() or "user" in criteria.lower()

    def test_workflow_gates_complete_coverage(self):
        """Verify all required gates are defined in WORKFLOW_GATES."""
        expected_gates = [
            # BUILD gates
            ("BUILD", "DISCOVERY"),
            ("BUILD", "ARCHITECTURE"),
            ("BUILD", "VALIDATION"),
            # DEBUG gates
            ("DEBUG", "INVESTIGATION"),
            ("DEBUG", "FIX"),
            ("DEBUG", "VALIDATION"),
            # REVIEW gates
            ("REVIEW", "SCOPE"),
            ("REVIEW", "ANALYSIS"),
            ("REVIEW", "REPORT"),
        ]
        
        for workflow, phase in expected_gates:
            assert (workflow, phase) in WORKFLOW_GATES, f"Missing gate: {workflow}/{phase}"


class TestGateResult:
    """Test GateResult dataclass."""

    def test_gate_result_creation(self):
        """Test GateResult can be created with passed and reason."""
        result = GateResult(passed=True, reason="All checks passed")
        assert result.passed is True
        assert result.reason == "All checks passed"

    def test_gate_result_failure(self):
        """Test GateResult for failed gate."""
        result = GateResult(passed=False, reason="Missing approval")
        assert result.passed is False
        assert "Missing" in result.reason


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
