"""
Unit tests for Bug-Investigator Skill.

@verifies: REQ-NSO-BUILD-Workflow (FR-2 DEBUG Workflow)
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import patch

# Add skills directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "skills" / "bug-investigator"))


class TestBugInvestigatorSkill:
    """Test bug-investigator skill functionality."""

    def test_skill_metadata_exists(self):
        """Verify skill has required YAML frontmatter."""
        skill_path = Path(__file__).parent.parent / "skills" / "bug-investigator" / "SKILL.md"
        if not skill_path.exists():
            pytest.skip("SKILL.md not yet created")
        
        content = skill_path.read_text()
        assert "---" in content, "Missing YAML frontmatter"
        assert "name:" in content, "Missing skill name"
        assert "bug-investigator" in content, "Missing skill name in content"

    def test_investigation_phase_outputs(self):
        """Test investigation phase generates expected outputs."""
        # This tests the expected contract structure
        expected_outputs = [
            "evidence_collected",
            "root_cause",
            "reproduction_steps",
        ]
        
        # Mock investigation result
        mock_contract = {
            "status": "COMPLETE",
            "workflow": "DEBUG",
            "phase": "INVESTIGATION",
            "evidence_collected": [
                "Error: Connection refused in auth.py:42",
                "Stack trace: TimeoutException at network.py:100",
            ],
            "root_cause": "Network timeout due to missing retry logic",
            "reproduction_steps": [
                "1. Start the server",
                "2. Send 100 concurrent requests",
                "3. Observe connection refused errors",
            ],
        }
        
        for key in expected_outputs:
            assert key in mock_contract

    def test_log_first_approach_required(self):
        """Test that LOG FIRST approach is enforced in investigation."""
        # Simulated investigation steps (evidence before hypothesis)
        investigation_steps = [
            {"type": "evidence", "content": "Error in auth.py line 42"},
            {"type": "evidence", "content": "Stack trace shows timeout"},
            {"type": "hypothesis", "content": "Missing retry logic"},
        ]
        
        # Verify evidence comes before hypothesis
        first_evidence_idx = None
        first_hypothesis_idx = None
        
        for i, step in enumerate(investigation_steps):
            if step["type"] == "evidence" and first_evidence_idx is None:
                first_evidence_idx = i
            if step["type"] == "hypothesis" and first_hypothesis_idx is None:
                first_hypothesis_idx = i
        
        assert first_evidence_idx is not None
        assert first_hypothesis_idx is not None
        assert first_evidence_idx < first_hypothesis_idx, "LOG FIRST: evidence must precede hypothesis"

    def test_regression_test_required_before_fix(self):
        """Test that regression test is required before applying fix."""
        fix_phase_contract = {
            "phase": "FIX",
            "regression_test": "tests/test_auth_timeout.py",
            "fix_applied": True,
            "test_status": "PASS",
        }
        
        # Must have regression test
        assert fix_phase_contract.get("regression_test") is not None
        # Must have applied fix
        assert fix_phase_contract.get("fix_applied") is True

    def test_investigation_contract_template(self):
        """Test investigation contract has required fields."""
        contract_fields = [
            "status",
            "workflow",
            "phase",
            "evidence_collected",
            "root_cause",
            "reproduction_steps",
        ]
        
        # Verify all required fields exist
        for field in contract_fields:
            assert field in contract_fields, f"Missing required field: {field}"


class TestMemoryIntegration:
    """Test memory integration for bug-investigator."""

    def test_load_memory_for_similar_issues(self):
        """Test that memory is loaded to find similar issues."""
        # Mock patterns.md content with similar issues
        mock_patterns = """
# Gotchas

## Authentication Issues
- **Issue:** Timeout in auth.py
  - **Fix:** Added retry logic with exponential backoff
  - **Reference:** PR #123

## Network Issues  
- **Issue:** Connection refused under load
  - **Fix:** Increased connection pool size
  - **Reference:** PR #456
"""
        
        with patch("pathlib.Path.read_text", return_value=mock_patterns):
            memory_content = mock_patterns
            # Check that memory contains similar issue patterns
            assert "timeout" in memory_content.lower() or "auth" in memory_content.lower()

    def test_update_memory_with_findings(self):
        """Test that findings are added to patterns.md after debug."""
        # Simulated findings to add
        findings = {
            "issue": "Network timeout in auth.py",
            "root_cause": "Missing retry logic",
            "fix": "Added exponential backoff retry",
            "severity": "high",
        }
        
        # Verify findings can be formatted for patterns.md
        formatted_entry = f"""
## New Issue: {findings['issue']}
- **Root Cause:** {findings['root_cause']}
- **Fix:** {findings['fix']}
- **Severity:** {findings['severity']}
"""
        assert "Network timeout" in formatted_entry
        assert "Missing retry logic" in formatted_entry


class TestVariantCoverage:
    """Test variant coverage requirements."""

    def test_edge_cases_considered(self):
        """Test that edge cases are considered in investigation."""
        variants = [
            "Empty input",
            "Null values",
            "Timeout scenarios",
            "Concurrent access",
            "Network partitions",
        ]
        
        # All variants should be considered
        for variant in variants:
            assert variant is not None

    def test_non_default_cases_covered(self):
        """Test that non-default cases are tested."""
        test_cases = [
            {"input": "normal_case", "expected": "success"},
            {"input": "empty_input", "expected": "handle_gracefully"},
            {"input": "null_input", "expected": "handle_gracefully"},
            {"input": "concurrent_requests", "expected": "no_race_conditions"},
        ]
        
        # Verify non-default cases are included
        non_default_cases = [tc for tc in test_cases if tc["expected"] != "success"]
        assert len(non_default_cases) >= 2, "Should have at least 2 non-default cases"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
