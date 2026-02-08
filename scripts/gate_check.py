"""
NSO Gate Enforcement Script.

@implements: REQ-NSO-BUILD-Workflow (FR-5 Gate Enforcement)
@verifies: TECHSPEC-NSO-WorkflowSystem (Section 6.1 Gate Check Logic)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


@dataclass
class GateResult:
    """Result of a gate check."""
    passed: bool
    reason: str


# Gate definitions: (workflow, phase) -> contract requirements
WORKFLOW_GATES: dict[tuple[str, str], dict] = {
    # BUILD workflow gates
    ("BUILD", "DISCOVERY"): {
        "required_fields": ["approval"],
        "validator": lambda c: c.get("approval") == "approved",
        "description": "User must approve requirements document",
    },
    ("BUILD", "ARCHITECTURE"): {
        "required_fields": ["approval"],
        "validator": lambda c: c.get("approval") == "approved",
        "description": "User must approve tech spec",
    },
    ("BUILD", "VALIDATION"): {
        "required_fields": ["test_status"],
        "validator": lambda c: c.get("test_status") == "PASS",
        "description": "Tests must pass",
    },
    # DEBUG workflow gates
    ("DEBUG", "INVESTIGATION"): {
        "required_fields": ["evidence_collected", "root_cause"],
        "validator": lambda c: (
            len(c.get("evidence_collected", [])) > 0 and
            len(c.get("root_cause", "")) > 0
        ),
        "description": "Evidence collected and root cause identified",
    },
    ("DEBUG", "FIX"): {
        "required_fields": ["regression_test", "fix_applied"],
        "validator": lambda c: (
            c.get("regression_test") is not None and
            c.get("fix_applied") is True
        ),
        "description": "Regression test written and fix applied",
    },
    ("DEBUG", "VALIDATION"): {
        "required_fields": ["regression_test", "full_test_suite"],
        "validator": lambda c: (
            c.get("regression_test") == "PASS" and
            c.get("full_test_suite") == "PASS"
        ),
        "description": "All tests pass",
    },
    # REVIEW workflow gates
    ("REVIEW", "SCOPE"): {
        "required_fields": ["files_reviewed", "focus_areas"],
        "validator": lambda c: (
            len(c.get("files_reviewed", [])) > 0 and
            len(c.get("focus_areas", [])) > 0
        ),
        "description": "Review scope defined",
    },
    ("REVIEW", "ANALYSIS"): {
        "required_fields": ["files_reviewed"],
        "validator": lambda c: len(c.get("files_reviewed", [])) > 0,
        "description": "Analysis complete",
    },
    ("REVIEW", "REPORT"): {
        "required_fields": ["verdict", "issues_reported"],
        "validator": lambda c: c.get("verdict") is not None,
        "description": "Report generated with verdict",
    },
}


def check_gate(workflow: str, phase: str, contract: dict) -> GateResult:
    """
    Check if gate criteria are met for a given workflow phase.
    
    @implements: FR-5 Gate Enforcement
    
    Args:
        workflow: Workflow type (BUILD, DEBUG, REVIEW)
        phase: Current phase
        contract: Phase contract with required fields
        
    Returns:
        GateResult with passed status and reason
    """
    gate_key = (workflow.upper(), phase.upper())
    
    if gate_key not in WORKFLOW_GATES:
        return GateResult(
            passed=True,
            reason=f"No gate required for {workflow}/{phase}",
        )
    
    gate = WORKFLOW_GATES[gate_key]
    
    # Check required fields exist
    for field in gate["required_fields"]:
        if field not in contract:
            return GateResult(
                passed=False,
                reason=f"Missing required field: {field}",
            )
    
    # Run validation
    try:
        validator: Callable = gate["validator"]
        if validator(contract):
            return GateResult(
                passed=True,
                reason=gate["description"],
            )
        else:
            return GateResult(
                passed=False,
                reason=f"Gate criteria not met: {gate['description']}",
            )
    except Exception as e:
        return GateResult(
            passed=False,
            reason=f"Gate validation error: {str(e)}",
        )


def get_gate_criteria(workflow: str, phase: str) -> str | None:
    """
    Get human-readable gate criteria for a workflow phase.
    
    Args:
        workflow: Workflow type
        phase: Phase name
        
    Returns:
        Description of gate criteria or None if no gate exists
    """
    gate_key = (workflow.upper(), phase.upper())
    gate = WORKFLOW_GATES.get(gate_key)
    
    if gate:
        return f"{gate['description']} (required fields: {', '.join(gate['required_fields'])})"
    
    return None


def list_all_gates() -> str:
    """
    List all defined gates with their criteria.
    
    Returns:
        Formatted string of all gates
    """
    lines = ["NSO Gate Definitions", "=" * 40, ""]
    
    current_workflow = None
    for (workflow, phase), gate in WORKFLOW_GATES.items():
        if workflow != current_workflow:
            current_workflow = workflow
            lines.append(f"\n## {workflow} Workflow")
            lines.append("-" * 40)
        
        lines.append(f"\n### {phase}")
        lines.append(f"Criteria: {gate['description']}")
        lines.append(f"Required fields: {', '.join(gate['required_fields'])}")
    
    return "\n".join(lines)


def validate_contract(workflow: str, phase: str, contract: dict) -> tuple[bool, list[str]]:
    """
    Validate a contract has all required fields for a phase.
    
    Args:
        workflow: Workflow type
        phase: Phase name
        contract: Contract to validate
        
    Returns:
        Tuple of (is_valid: bool, errors: list[str])
    """
    errors = []
    
    gate_key = (workflow.upper(), phase.upper())
    if gate_key not in WORKFLOW_GATES:
        return True, []
    
    gate = WORKFLOW_GATES[gate_key]
    
    for field in gate["required_fields"]:
        if field not in contract:
            errors.append(f"Missing required field: {field}")
    
    return len(errors) == 0, errors


# CLI for testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "--list":
            print(list_all_gates())
        elif command == "--check" and len(sys.argv) >= 4:
            workflow = sys.argv[2]
            phase = sys.argv[3]
            result = check_gate(workflow, phase, {})
            print(f"Gate Check: {workflow}/{phase}")
            print(f"Passed: {result.passed}")
            print(f"Reason: {result.reason}")
        else:
            print("Usage: python gate_check.py --list")
            print("       python gate_check.py --check <workflow> <phase>")
    else:
        print("NSO Gate Enforcement Script")
        print("=" * 40)
        print()
        print("Commands:")
        print("  --list              List all defined gates")
        print("  --check <w> <p>      Check gate for workflow/phase")
        print()
        print("Examples:")
        print("  python gate_check.py --list")
        print("  python gate_check.py --check BUILD DISCOVERY")
        print("  python gate_check.py --check DEBUG INVESTIGATION")
