"""
NSO Router Logic - Intent detection and workflow routing.

@implements: REQ-NSO-Router (FR-1, FR-2, FR-3, FR-5)
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class Workflow(Enum):
    """Supported NSO workflow types."""
    BUILD = "BUILD"
    DEBUG = "DEBUG"
    REVIEW = "REVIEW"
    PLAN = "PLAN"


@dataclass
class RoutingDecision:
    """Result of routing a user request."""
    workflow: Workflow
    confidence: float  # 0.0 to 1.0
    matched_keywords: list[str]
    task_breakdown: list[str]
    contract_template: str


# Keyword patterns (compiled for efficiency)
# Priority order: DEBUG > REVIEW > PLAN > BUILD
KEYWORDS: dict[Workflow, list[str]] = {
    Workflow.BUILD: [
        r"\bbuild\b", r"\bimplement\b", r"\bcreate\b", r"\bmake\b",
        r"\bwrite\b", r"\badd\b", r"\bdevelop\b", r"\bcode\b",
        r"\bfeature\b", r"\bcomponent\b", r"\bapp\b", r"\bapplication\b",
    ],
    Workflow.DEBUG: [
        r"\bdebug\b", r"\bfix\b", r"\berror\b", r"\bbug\b",
        r"\bbroken\b", r"\btroubleshoot\b", r"\bissue\b", r"\bproblem\b",
        r"\bdoesn't work\b", r"\bfailure\b",
    ],
    Workflow.REVIEW: [
        r"\breview\b", r"\baudit\b", r"\bcheck\b", r"\banalyze\b",
        r"\bassess\b", r"\bwhat do you think\b", r"\bis this good\b",
        r"\bevaluate\b",
    ],
    Workflow.PLAN: [
        r"\bplan\b", r"\bdesign\b", r"\barchitect\b", r"\broadmap\b",
        r"\bstrategy\b", r"\bspec\b", r"\bbefore we build\b",
        r"\bhow should we\b",
    ],
}


def detect_intent(request: str) -> tuple[Workflow, list[str], float]:
    """
    Detect user intent from natural language request.
    
    @implements: FR-1 Intent Detection
    
    Args:
        request: User's natural language request
        
    Returns:
        Tuple of (detected_workflow, matched_keywords, confidence)
    """
    if not request or not request.strip():
        return Workflow.BUILD, [], 0.0
    
    scores: dict[Workflow, list[str]] = {w: [] for w in Workflow}
    
    # Score each workflow based on keyword matches
    for workflow, patterns in KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, request, re.IGNORECASE):
                scores[workflow].append(pattern)
    
    # Find the workflow with the most matches
    # Priority: DEBUG > REVIEW > PLAN > BUILD if equal counts
    best_workflow = Workflow.BUILD  # Default
    best_matches: list[str] = []
    max_count = 0
    
    # Sort by priority for tie-breaking
    priority_order = [Workflow.DEBUG, Workflow.REVIEW, Workflow.PLAN, Workflow.BUILD]
    
    for workflow in priority_order:
        matches = scores[workflow]
        if len(matches) > max_count:
            max_count = len(matches)
            best_workflow = workflow
            best_matches = matches
    
    # Confidence is based on match count (simple heuristic)
    confidence = min(max_count / 3.0, 1.0)  # Cap at 1.0
    
    return best_workflow, best_matches, confidence


def create_task_breakdown(workflow: Workflow, request: str) -> list[str]:
    """
    Create a human-readable task breakdown for the selected workflow.
    
    @implements: FR-5 Task Hierarchy Creation
    
    Args:
        workflow: Selected workflow type
        request: Original user request
        
    Returns:
        List of task descriptions
    """
    request_preview = request[:50] + "..." if len(request) > 50 else request
    
    base_tasks = {
        Workflow.BUILD: [
            f"Clarify requirements for: {request_preview}",
            "Create task hierarchy",
            "Implement feature using TDD",
            "Run tests and verify",
            "Update memory",
        ],
        Workflow.DEBUG: [
            f"Investigate issue: {request_preview}",
            "Gather evidence (logs, error messages)",
            "Identify root cause",
            "Implement fix",
            "Verify fix with tests",
            "Update memory with findings",
        ],
        Workflow.REVIEW: [
            f"Review scope: {request_preview}",
            "Check spec compliance",
            "Review code quality",
            "Report findings",
            "Update memory with patterns",
        ],
        Workflow.PLAN: [
            f"Plan for: {request_preview}",
            "Gather requirements",
            "Design architecture",
            "Create implementation plan",
            "Document plan",
        ],
    }
    
    return base_tasks.get(workflow, ["Unknown workflow task"])


def generate_contract_template(
    workflow: Workflow,
    request: str,
    tasks: list[str],
) -> str:
    """
    Generate a YAML contract template for the workflow agent.
    
    @implements: FR-4 Router Contract System
    
    Args:
        workflow: Selected workflow type
        request: Original user request
        tasks: List of task descriptions
        
    Returns:
        YAML contract template string
    """
    task_list = "\n".join(
        f"  - id: {i+1}\n    description: {task}\n    status: PENDING\n    dependencies: []"
        for i, task in enumerate(tasks)
    )
    
    return f"""router_contract:
  status: IN_PROGRESS
  workflow: {workflow.value}
  intent: "{request}"
  tasks:
{task_list}
  memory_notes: ""
  next_action: "Start with Task 1"
"""


def route_request(request: str) -> RoutingDecision:
    """
    Main router function: detect intent and create routing decision.
    
    @implements: FR-2 Workflow Routing
    
    Args:
        request: User's natural language request
        
    Returns:
        RoutingDecision with workflow, tasks, and contract
    """
    workflow, matched_keywords, confidence = detect_intent(request)
    tasks = create_task_breakdown(workflow, request)
    contract = generate_contract_template(workflow, request, tasks)
    
    return RoutingDecision(
        workflow=workflow,
        confidence=confidence,
        matched_keywords=matched_keywords,
        task_breakdown=tasks,
        contract_template=contract,
    )


def load_memory() -> dict[str, str]:
    """
    Load existing memory files for context.
    
    @implements: FR-3 Memory LOAD Protocol
    
    Returns:
        Dictionary mapping filename to content
    """
    memory_dir = Path(".opencode/context/01_memory")
    memory = {}
    
    for filename in ["active_context.md", "patterns.md", "progress.md"]:
        filepath = memory_dir / filename
        if filepath.exists():
            try:
                memory[filename] = filepath.read_text()
            except (IOError, PermissionError):
                # Skip files that can't be read
                pass
    
    return memory


# CLI for testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        request = " ".join(sys.argv[1:])
        decision = route_request(request)
        
        print("🛣️  NSO Router Decision")
        print("=" * 40)
        print(f"Workflow: {decision.workflow.value}")
        print(f"Confidence: {decision.confidence:.2f}")
        print(f"Matched Keywords: {decision.matched_keywords}")
        print()
        print("### Task Breakdown")
        for i, task in enumerate(decision.task_breakdown, 1):
            print(f"  {i}. {task}")
        print()
        print("### Router Contract")
        print(decision.contract_template)
    else:
        print("Usage: python router_logic.py '<request>'")
        print()
        print("Examples:")
        print("  python router_logic.py 'build a new feature'")
        print("  python router_logic.py 'debug the login issue'")
        print("  python router_logic.py 'review the code'")
        print("  python router_logic.py 'plan the architecture'")
