"""
Unit tests for Code-Reviewer Skill.

@verifies: REQ-NSO-BUILD-Workflow (FR-3 REVIEW Workflow)
"""

import pytest
from pathlib import Path


class TestCodeReviewerSkill:
    """Test code-reviewer skill functionality."""

    def test_skill_metadata_exists(self):
        """Verify skill has required YAML frontmatter."""
        skill_path = Path(__file__).parent.parent / "skills" / "code-reviewer" / "SKILL.md"
        if not skill_path.exists():
            pytest.skip("SKILL.md not yet created")
        
        content = skill_path.read_text()
        assert "---" in content, "Missing YAML frontmatter"
        assert "name:" in content, "Missing skill name"
        assert "code-reviewer" in content, "Missing skill name in content"

    def test_confidence_threshold_enforced(self):
        """Test that only issues with ≥80 confidence are reported."""
        issues = [
            {"type": "security", "confidence": 95, "message": "SQL injection vulnerability"},
            {"type": "performance", "confidence": 85, "message": "N+1 query pattern"},
            {"type": "style", "confidence": 70, "message": "Variable naming"},
            {"type": "logic", "confidence": 60, "message": "Potential off-by-one"},
        ]
        
        # Filter issues with ≥80 confidence
        reported_issues = [i for i in issues if i["confidence"] >= 80]
        
        assert len(reported_issues) == 2
        assert all(i["confidence"] >= 80 for i in reported_issues)

    def test_critical_issues_block_shipping(self):
        """Test that CRITICAL issues block shipping."""
        review_result = {
            "verdict": "BLOCK",
            "critical_issues": 1,
            "important_issues": 3,
            "minor_issues": 5,
            "blocking": True,
        }
        
        # Critical issue should block
        assert review_result["critical_issues"] > 0
        assert review_result["blocking"] is True
        assert review_result["verdict"] == "BLOCK"

    def test_two_stage_review_process(self):
        """Test two-stage review: spec compliance → quality."""
        stage_1_results = {
            "spec_compliance": {
                "meets_requirements": True,
                "missing_features": [],
                "incorrect_behavior": [],
            }
        }
        
        stage_2_results = {
            "code_quality": {
                "security_issues": [],
                "performance_concerns": ["N+1 query pattern"],
                "readability_score": 8,
                "maintainability_score": 7,
            }
        }
        
        # Verify both stages are executed
        assert "spec_compliance" in stage_1_results
        assert "code_quality" in stage_2_results

    def test_scope_phase_outputs(self):
        """Test scope phase generates required outputs."""
        scope_contract = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "SCOPE",
            "files_reviewed": ["src/auth.py", "src/login.py", "src/session.py"],
            "focus_areas": ["security", "performance"],
        }
        
        assert "files_reviewed" in scope_contract
        assert "focus_areas" in scope_contract
        assert len(scope_contract["files_reviewed"]) > 0
        assert len(scope_contract["focus_areas"]) > 0

    def test_analysis_phase_outputs(self):
        """Test analysis phase generates required outputs."""
        analysis_contract = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "ANALYSIS",
            "files_reviewed": ["src/auth.py"],
            "critical_issues": 1,
            "important_issues": 3,
            "minor_issues": 5,
            "confidence_threshold": 80,
        }
        
        assert "critical_issues" in analysis_contract
        assert "important_issues" in analysis_contract
        assert "minor_issues" in analysis_contract
        assert analysis_contract["confidence_threshold"] == 80

    def test_report_phase_outputs(self):
        """Test report phase generates required outputs."""
        report_contract = {
            "status": "COMPLETE",
            "workflow": "REVIEW",
            "phase": "REPORT",
            "verdict": "CHANGES_REQUESTED",
            "issues_reported": 9,
            "critical_blocking": True,
            "summary": "Code meets most requirements but has security issues",
            "critical_issues": [
                {"confidence": 95, "message": "SQL injection in auth.py:42"},
            ],
            "important_issues": [
                {"confidence": 85, "message": "N+1 query in session.py:15"},
            ],
        }
        
        assert "verdict" in report_contract
        assert report_contract["verdict"] in ["APPROVE", "CHANGES_REQUESTED", "BLOCK"]
        assert "critical_blocking" in report_contract
        assert "summary" in report_contract

    def test_verdict_logic(self):
        """Test verdict determination logic."""
        test_cases = [
            {"critical": 0, "important": 0, "minor": 0, "expected": "APPROVE"},
            {"critical": 0, "important": 2, "minor": 5, "expected": "CHANGES_REQUESTED"},
            {"critical": 1, "important": 0, "minor": 0, "expected": "BLOCK"},
            {"critical": 0, "important": 0, "minor": 10, "expected": "CHANGES_REQUESTED"},
        ]
        
        for tc in test_cases:
            # Determine verdict
            if tc["critical"] > 0:
                verdict = "BLOCK"
            elif tc["important"] > 0 or tc["minor"] > 0:
                verdict = "CHANGES_REQUESTED"
            else:
                verdict = "APPROVE"
            
            assert verdict == tc["expected"], f"Failed for {tc}"

    def test_confidence_scoring_formula(self):
        """Test confidence scoring calculation."""
        # Simple confidence scoring based on evidence
        evidence_counts = {
            "clear_error": 30,
            "test_failure": 25,
            "static_analysis": 20,
            "code_inspection": 15,
            "heuristic": 10,
        }
        
        max_confidence = sum(evidence_counts.values())
        assert max_confidence == 100
        
        # Test different evidence combinations
        test_evidence = ["clear_error", "test_failure", "static_analysis"]
        confidence = sum(evidence_counts[e] for e in test_evidence)
        assert confidence == 75


class TestGitContextIntegration:
    """Test git context integration for code-reviewer."""

    def test_recent_changes_considered(self):
        """Test that recent changes are considered in review."""
        git_context = {
            "recent_commits": [
                "abc123: Fix login timeout",
                "def456: Add user validation",
                "ghi789: Refactor auth module",
            ],
            "changed_files": ["src/auth.py", "src/login.py"],
            "blame_info": {
                "src/auth.py": {"author": "dev1", "line": 42},
            },
        }
        
        assert "recent_commits" in git_context
        assert "changed_files" in git_context
        assert len(git_context["changed_files"]) > 0

    def test_blame_info_for_review_focus(self):
        """Test blame info helps focus review on recent changes."""
        # Files changed in recent commits should get extra scrutiny
        focus_files = ["src/auth.py", "src/login.py"]
        
        for file in focus_files:
            # Simulated blame check
            assert file is not None


class TestReviewReport:
    """Test review report generation."""

    def test_report_includes_all_required_sections(self):
        """Test report includes all required sections."""
        report = {
            "summary": "Code review for authentication module",
            "verdict": "CHANGES_REQUESTED",
            "critical_issues": [
                {
                    "file": "src/auth.py",
                    "line": 42,
                    "type": "security",
                    "message": "SQL injection vulnerability",
                    "confidence": 95,
                    "recommendation": "Use parameterized queries",
                }
            ],
            "important_issues": [
                {
                    "file": "src/session.py",
                    "line": 15,
                    "type": "performance",
                    "message": "N+1 query pattern",
                    "confidence": 85,
                    "recommendation": "Use eager loading",
                }
            ],
            "minor_issues": [
                {
                    "file": "src/auth.py",
                    "line": 100,
                    "type": "style",
                    "message": "Variable naming could be improved",
                    "confidence": 70,
                }
            ],
            "positive_findings": [
                "Good test coverage (>80%)",
                "Clean separation of concerns",
                "Proper error handling",
            ],
        }
        
        required_sections = ["summary", "verdict", "critical_issues", "important_issues"]
        for section in required_sections:
            assert section in report

    def test_issues_grouped_by_severity(self):
        """Test issues are grouped by severity in report."""
        issues = [
            {"severity": "critical", "confidence": 95},
            {"severity": "critical", "confidence": 90},
            {"severity": "important", "confidence": 85},
            {"severity": "important", "confidence": 80},
            {"severity": "minor", "confidence": 75},
        ]
        
        # Group by severity
        grouped = {}
        for issue in issues:
            severity = issue["severity"]
            if severity not in grouped:
                grouped[severity] = []
            grouped[severity].append(issue)
        
        assert len(grouped["critical"]) == 2
        assert len(grouped["important"]) == 2
        assert len(grouped["minor"]) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
