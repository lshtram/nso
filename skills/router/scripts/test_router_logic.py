"""
Unit tests for NSO Router Logic.

@verifies: REQ-NSO-Router
"""

import pytest
import sys
from pathlib import Path

# Add router scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from router_logic import (
    Workflow,
    RoutingDecision,
    detect_intent,
    create_task_breakdown,
    generate_contract_template,
    route_request,
    KEYWORDS,
)


class TestWorkflowEnum:
    """Test Workflow enum values."""

    def test_workflow_values(self):
        """Verify all expected workflows exist."""
        assert Workflow.BUILD.value == "BUILD"
        assert Workflow.DEBUG.value == "DEBUG"
        assert Workflow.REVIEW.value == "REVIEW"
        assert Workflow.PLAN.value == "PLAN"


class TestDetectIntent:
    """Test intent detection functionality."""

    def test_build_keywords(self):
        """Test BUILD workflow detection with various keywords."""
        build_keywords = [
            "build a new feature",
            "implement a calculator",
            "create a component",
            "make a web app",
            "write unit tests",
            "add authentication",
            "develop an API",
            "code a new module",
            "feature request",
            "app development",
        ]
        
        for request in build_keywords:
            workflow, matches, confidence = detect_intent(request)
            assert workflow == Workflow.BUILD, f"Failed for: {request}"
            assert len(matches) > 0, f"No matches for: {request}"
            assert 0.0 <= confidence <= 1.0

    def test_debug_keywords(self):
        """Test DEBUG workflow detection with various keywords."""
        debug_keywords = [
            "debug the login issue",
            "fix the memory leak",
            "error in production",
            "bug in the code",
            "broken build",
            "troubleshoot connection",
            "issue with API",
            "problem with data",
            "doesn't work properly",
            "system failure",
        ]
        
        for request in debug_keywords:
            workflow, matches, confidence = detect_intent(request)
            assert workflow == Workflow.DEBUG, f"Failed for: {request}"
            assert len(matches) > 0, f"No matches for: {request}"

    def test_review_keywords(self):
        """Test REVIEW workflow detection with various keywords."""
        review_keywords = [
            "review the code",
            "audit the security",
            "check performance",
            "analyze the design",
            "assess the architecture",
            "what do you think about this",
            "is this good code",
            "evaluate the solution",
        ]
        
        for request in review_keywords:
            workflow, matches, confidence = detect_intent(request)
            assert workflow == Workflow.REVIEW, f"Failed for: {request}"
            assert len(matches) > 0, f"No matches for: {request}"

    def test_plan_keywords(self):
        """Test PLAN workflow detection with various keywords."""
        plan_keywords = [
            "plan the implementation",
            "design the architecture",
            "architect a solution",
            "roadmap for Q1",
            "strategy for scaling",
            "create a spec",
            "before we build",
            "how should we approach this",
        ]
        
        for request in plan_keywords:
            workflow, matches, confidence = detect_intent(request)
            assert workflow == Workflow.PLAN, f"Failed for: {request}"
            assert len(matches) > 0, f"No matches for: {request}"

    def test_default_to_build(self):
        """Test that unrecognized requests default to BUILD."""
        unknown_requests = [
            "hello",
            "what is the weather",
            "random text",
            "",
        ]
        
        for request in unknown_requests:
            workflow, matches, confidence = detect_intent(request)
            assert workflow == Workflow.BUILD, f"Failed for: '{request}'"

    def test_case_insensitive(self):
        """Test that keyword matching is case-insensitive."""
        requests = [
            "BUILD A FEATURE",
            "Debug the issue",
            "REVIEW the code",
            "PLAN the design",
        ]
        
        expected = [Workflow.BUILD, Workflow.DEBUG, Workflow.REVIEW, Workflow.PLAN]
        
        for request, expected_workflow in zip(requests, expected):
            workflow, _, _ = detect_intent(request)
            assert workflow == expected_workflow, f"Failed for: {request}"

    def test_confidence_calculation(self):
        """Test confidence score calculation."""
        # Single keyword match
        workflow, matches, confidence = detect_intent("build")
        assert confidence == pytest.approx(1.0 / 3.0, rel=0.1)
        
        # Multiple keyword matches should increase confidence
        workflow, matches2, confidence2 = detect_intent("build implement create")
        assert len(matches2) > len(matches)
        assert confidence2 > confidence

    def test_priority_debug_over_build(self):
        """Test DEBUG takes priority over BUILD when both match."""
        # Request has both DEBUG and BUILD keywords
        workflow, matches, confidence = detect_intent("debug the build issue")
        assert workflow == Workflow.DEBUG
        assert len(matches) > 0


class TestCreateTaskBreakdown:
    """Test task breakdown creation."""

    def test_build_workflow_tasks(self):
        """Test BUILD workflow task breakdown."""
        tasks = create_task_breakdown(Workflow.BUILD, "test request")
        assert len(tasks) == 5
        assert "Clarify requirements" in tasks[0]
        assert "Create task hierarchy" in tasks[1]
        assert "Implement feature using TDD" in tasks[2]
        assert "Run tests and verify" in tasks[3]
        assert "Update memory" in tasks[4]

    def test_debug_workflow_tasks(self):
        """Test DEBUG workflow task breakdown."""
        tasks = create_task_breakdown(Workflow.DEBUG, "test request")
        assert len(tasks) == 6
        assert "Investigate issue" in tasks[0]
        assert "Gather evidence" in tasks[1]
        assert "Identify root cause" in tasks[2]
        assert "Implement fix" in tasks[3]
        assert "Verify fix with tests" in tasks[4]
        assert "Update memory with findings" in tasks[5]

    def test_review_workflow_tasks(self):
        """Test REVIEW workflow task breakdown."""
        tasks = create_task_breakdown(Workflow.REVIEW, "test request")
        assert len(tasks) == 5
        assert "Review scope" in tasks[0]
        assert "Check spec compliance" in tasks[1]
        assert "Review code quality" in tasks[2]
        assert "Report findings" in tasks[3]
        assert "Update memory with patterns" in tasks[4]

    def test_plan_workflow_tasks(self):
        """Test PLAN workflow task breakdown."""
        tasks = create_task_breakdown(Workflow.PLAN, "test request")
        assert len(tasks) == 5
        assert "Plan for" in tasks[0]
        assert "Gather requirements" in tasks[1]
        assert "Design architecture" in tasks[2]
        assert "Create implementation plan" in tasks[3]
        assert "Document plan" in tasks[4]


class TestGenerateContractTemplate:
    """Test contract template generation."""

    def test_contract_format(self):
        """Test contract has correct YAML format."""
        tasks = ["Task 1", "Task 2", "Task 3"]
        contract = generate_contract_template(Workflow.BUILD, "test request", tasks)
        
        assert "router_contract:" in contract
        assert "status: IN_PROGRESS" in contract
        assert "workflow: BUILD" in contract
        assert 'intent: "test request"' in contract

    def test_contract_task_includes_id_and_status(self):
        """Test contract tasks include id and status."""
        tasks = ["Task 1", "Task 2"]
        contract = generate_contract_template(Workflow.DEBUG, "debug request", tasks)
        
        # Check for task structure
        assert "id: 1" in contract
        assert "id: 2" in contract
        assert "status: PENDING" in contract
        assert "dependencies: []" in contract

    def test_contract_has_next_action(self):
        """Test contract includes next_action field."""
        tasks = ["Single Task"]
        contract = generate_contract_template(Workflow.REVIEW, "review request", tasks)
        
        assert "next_action:" in contract
        assert "Start with Task 1" in contract


class TestRouteRequest:
    """Test main route_request function."""

    def test_route_request_returns_routing_decision(self):
        """Test route_request returns a RoutingDecision object."""
        decision = route_request("build a feature")
        
        assert isinstance(decision, RoutingDecision)
        assert decision.workflow == Workflow.BUILD
        assert isinstance(decision.confidence, float)
        assert isinstance(decision.matched_keywords, list)
        assert isinstance(decision.task_breakdown, list)
        assert isinstance(decision.contract_template, str)

    def test_route_request_for_all_workflows(self):
        """Test route_request works for all workflow types."""
        test_cases = [
            ("debug the issue", Workflow.DEBUG),
            ("review the code", Workflow.REVIEW),
            ("plan the architecture", Workflow.PLAN),
            ("build a feature", Workflow.BUILD),
        ]
        
        for request, expected_workflow in test_cases:
            decision = route_request(request)
            assert decision.workflow == expected_workflow, f"Failed for: {request}"

    def test_route_request_contract_is_valid_yaml_structure(self):
        """Test that generated contract has correct YAML structure."""
        decision = route_request("implement a feature")
        contract_str = decision.contract_template
        
        # Verify structure without requiring yaml module
        assert "router_contract:" in contract_str
        assert "status: IN_PROGRESS" in contract_str
        assert "workflow: BUILD" in contract_str
        assert "intent:" in contract_str
        assert "tasks:" in contract_str
        assert "- id:" in contract_str
        assert "description:" in contract_str
        assert "status: PENDING" in contract_str
        assert "dependencies: []" in contract_str
        assert "next_action:" in contract_str


class TestKeywordPatterns:
    """Test keyword pattern completeness."""

    def test_all_workflows_have_keywords(self):
        """Verify all workflows have keyword definitions."""
        assert len(KEYWORDS[Workflow.BUILD]) > 0
        assert len(KEYWORDS[Workflow.DEBUG]) > 0
        assert len(KEYWORDS[Workflow.REVIEW]) > 0
        assert len(KEYWORDS[Workflow.PLAN]) > 0

    def test_keywords_are_regex_patterns(self):
        """Verify keywords are valid regex patterns."""
        import re
        
        for workflow, patterns in KEYWORDS.items():
            for pattern in patterns:
                # This will raise if pattern is invalid
                re.compile(pattern)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
