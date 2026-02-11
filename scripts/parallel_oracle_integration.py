#!/usr/bin/env python3
"""
NSO Parallel Execution Integration for Oracle

This module integrates parallel execution capabilities with the Oracle router,
enabling automatic parallel task detection and coordination.

Usage:
    from parallel_oracle_integration import ParallelOracleIntegration
    
    oracle = ParallelOracleIntegration()
    result = oracle.evaluate_parallel_request(user_message)
    if result["can_run_parallel"]:
        task_ids = oracle.create_parallel_tasks(result)
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any
import hashlib


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class ParallelConfig:
    """Configuration for parallel execution."""
    enabled: bool = False  # Disabled by default for backward compatibility
    max_agents: int = 3
    stall_threshold: int = 60  # seconds
    auto_detect: bool = True  # Automatically detect parallel opportunities
    
    @classmethod
    def load_from_project(cls) -> "ParallelConfig":
        """Load configuration from project settings."""
        config_path = Path(".opencode/config/parallel-config.yaml")
        
        if config_path.exists():
            try:
                content = config_path.read_text()
                # Simple YAML parsing for our config format
                enabled = "enabled: true" in content.lower()
                max_agents = 3
                stall_threshold = 60
                
                for line in content.split('\n'):
                    line = line.strip()
                    if 'max_agents' in line.lower():
                        try:
                            max_agents = int(line.split(':')[1].strip())
                        except:
                            pass
                    elif 'stall_threshold' in line.lower():
                        try:
                            stall_threshold = int(line.split(':')[1].strip())
                        except:
                            pass
                
                return cls(
                    enabled=enabled,
                    max_agents=max_agents,
                    stall_threshold=stall_threshold,
                    auto_detect=True
                )
            except Exception as e:
                print(f"⚠️  Error loading parallel config: {e}")
                return cls()
        
        return cls()


# ============================================================================
# TASK ID GENERATOR
# ============================================================================

class TaskIDGenerator:
    """Generates unique task IDs with metadata."""
    
    @staticmethod
    def generate(
        workflow: str = "build",
        agent: str = "unknown",
        project: str = "dream-news"
    ) -> str:
        """
        Generate a unique task ID.
        
        Format: {project}_{workflow}_{timestamp}_{hash}_{counter}
        
        Example: dream-news_build_20260208_abc123_001
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        hash_input = f"{project}_{workflow}_{timestamp}_{agent}"
        hash_suffix = hashlib.md5(hash_input.encode()).hexdigest()[:6]
        counter = TaskIDGenerator._get_counter()
        
        return f"{project}_{workflow}_{timestamp}_{hash_suffix}_{counter:03d}"
    
    @staticmethod
    def _get_counter() -> int:
        """Get a simple counter from session state."""
        try:
            state_path = Path(".opencode/.task_counter")
            if state_path.exists():
                counter = int(state_path.read_text().strip())
            else:
                counter = 0
            
            # Increment and save
            counter += 1
            state_path.write_text(str(counter))
            return counter
        except:
            return 1


# ============================================================================
# PARALLEL TASK PLANNER
# ============================================================================

@dataclass
class ParallelTask:
    """Represents a single task that can run in parallel."""
    task_id: str
    agent_type: str  # Builder, Janitor, etc.
    description: str
    workflow_phase: str  # Discovery, Architecture, etc.
    dependencies: List[str] = field(default_factory=list)
    estimated_duration: int = 30  # seconds


@dataclass
class ParallelPlan:
    """Plan for executing multiple tasks in parallel."""
    can_run_parallel: bool
    task_ids: List[str]
    tasks: List[ParallelTask]
    agents_needed: List[str]
    parallel_groups: List[List[int]]  # Indices of tasks that can run together
    sequential_tasks: List[int]  # Indices of tasks that must run sequentially
    estimated_speedup: float
    recommendation: str


class ParallelTaskPlanner:
    """
    Analyzes user requests and determines if they can be executed in parallel.
    """
    
    # Patterns that suggest parallel execution
    PARALLEL_PATTERNS = [
        # Multi-phase BUILD workflows
        (r"\b(build|create|implement)\s+(?:a\s+)?(?:new\s+)?(?:feature|module|component|system)\b", 
         ["Builder"]),
        
        # Complex features with testing
        (r"\bfeature\b.*\btest\b|\btest\b.*\bfeature\b", 
         ["Builder", "Janitor"]),
        
        # Code + Review
        (r"\b(build|create|write)\b.*\b(and|then)\b\s*\b(review|check|audit)\b",
         ["Builder", "Janitor"]),
        
        # Full feature lifecycle
        (r"\bcomplete\b|\bend[- ]to[- ]end\b|\bfull\s+stack\b|\bfrom\s+scratch\b",
         ["Builder", "Janitor", "Designer"]),
        
        # Multiple deliverables
        (r"\band\b\s+\w+\s+(?:and|or)\s+\w+",  # "X and Y" patterns
         ["Builder", "Janitor"]),
        
        # Frontend + Backend
        (r"\b(frontend|backend|api|ui|user\s+interface)\b.*\b(frontend|backend|api|ui|user\s+interface)\b",
         ["Builder", "Designer"]),
    ]
    
    # Agents that can run in parallel
    COMPATIBLE_AGENTS = {
        "Builder": ["Janitor", "Designer"],
        "Janitor": ["Builder", "Designer"],
        "Designer": ["Builder", "Janitor"],
        "Oracle": [],  # Oracle always runs first
    }
    
    @classmethod
    def analyze(cls, message: str) -> ParallelPlan:
        """
        Analyze a user message and determine parallel execution plan.
        
        Returns:
            ParallelPlan with recommendations
        """
        message_lower = message.lower()
        
        # Check if parallel execution is enabled
        config = ParallelConfig.load_from_project()
        
        if not config.enabled:
            return ParallelPlan(
                can_run_parallel=False,
                task_ids=[],
                tasks=[],
                agents_needed=[],
                parallel_groups=[],
                sequential_tasks=[0],
                estimated_speedup=1.0,
                recommendation="Parallel execution is disabled for this project"
            )
        
        if not config.auto_detect:
            return ParallelPlan(
                can_run_parallel=False,
                task_ids=[],
                tasks=[],
                agents_needed=[],
                parallel_groups=[],
                sequential_tasks=[0],
                estimated_speedup=1.0,
                recommendation="Auto-detection disabled - request sequential execution"
            )
        
        # Analyze message for parallel patterns
        matched_agents = []
        parallel_phases = []
        
        for pattern, agents in cls.PARALLEL_PATTERNS:
            import re
            if re.search(pattern, message_lower):
                matched_agents.extend(agents)
                # Add discovery + implementation phases
                if "Discovery" not in parallel_phases:
                    parallel_phases.append("Discovery")
                if "Implementation" not in parallel_phases:
                    parallel_phases.append("Implementation")
        
        # Remove duplicates
        matched_agents = list(dict.fromkeys(matched_agents))
        
        # Check if we have enough agents for parallel execution
        if len(matched_agents) < 2:
            return ParallelPlan(
                can_run_parallel=False,
                task_ids=[],
                tasks=[],
                agents_needed=matched_agents,
                parallel_groups=[],
                sequential_tasks=[0],
                estimated_speedup=1.0,
                recommendation="Single-agent task - sequential execution recommended"
            )
        
        # Check agent compatibility
        compatible_groups = cls._find_compatible_groups(matched_agents)
        
        if not compatible_groups:
            return ParallelPlan(
                can_run_parallel=False,
                task_ids=[],
                tasks=[],
                agents_needed=matched_agents,
                parallel_groups=[],
                sequential_tasks=[0],
                estimated_speedup=1.0,
                recommendation="Agents not compatible for parallel execution"
            )
        
        # Create parallel plan
        tasks = []
        task_ids = []
        
        for i, agent in enumerate(compatible_groups[0]):
            task_id = TaskIDGenerator.generate(
                workflow="build",
                agent=agent.lower()
            )
            task_ids.append(task_id)
            
            task = ParallelTask(
                task_id=task_id,
                agent_type=agent,
                description=f"{agent} task for: {message[:50]}...",
                workflow_phase=parallel_phases[i] if i < len(parallel_phases) else "Implementation",
                dependencies=[],
                estimated_duration=30
            )
            tasks.append(task)
        
        # Calculate speedup
        sequential_time = sum(t.estimated_duration for t in tasks)
        parallel_time = max(t.estimated_duration for t in tasks)
        speedup = sequential_time / parallel_time if parallel_time > 0 else 1.0
        
        return ParallelPlan(
            can_run_parallel=True,
            task_ids=task_ids,
            tasks=tasks,
            agents_needed=matched_agents,
            parallel_groups=[list(range(len(tasks)))],  # All can run in parallel
            sequential_tasks=[],
            estimated_speedup=round(speedup, 2),
            recommendation=f"✅ Parallel execution recommended: {speedup:.1f}x speedup with {len(tasks)} agents"
        )
    
    @classmethod
    def _find_compatible_groups(cls, agents: List[str]) -> List[List[str]]:
        """Find groups of agents that can run in parallel."""
        if len(agents) <= 1:
            return []
        
        # Check all permutations
        compatible = []
        for i, agent1 in enumerate(agents):
            group = [agent1]
            for j, agent2 in enumerate(agents):
                if i != j:
                    # Check compatibility
                    if agent2 in cls.COMPATIBLE_AGENTS.get(agent1, []):
                        if agent2 not in group:
                            group.append(agent2)
                    elif agent1 in cls.COMPATIBLE_AGENTS.get(agent2, []):
                        if agent1 not in group:
                            group.append(agent1)
            
            if len(group) >= 2:
                compatible.append(group)
        
        return compatible


# ============================================================================
# PARALLEL ORACLE INTEGRATION
# ============================================================================

class ParallelOracleIntegration:
    """
    Main integration class for parallel execution with Oracle.
    
    Usage:
        oracle = ParallelOracleIntegration()
        
        # Analyze user request
        analysis = oracle.evaluate_parallel_request(user_message)
        
        if analysis["can_run_parallel"]:
            # Create parallel tasks
            result = oracle.create_parallel_tasks(analysis)
            
            # Execute with coordinator
            oracle.execute_parallel(result)
    """
    
    def __init__(self):
        self.config = ParallelConfig.load_from_project()
        self.planner = ParallelTaskPlanner()
    
    def evaluate_parallel_request(self, message: str) -> Dict[str, Any]:
        """
        Evaluate if a user request can benefit from parallel execution.
        
        Returns:
            Dict with:
            - can_run_parallel: bool
            - plan: ParallelPlan or None
            - reason: str
            - suggestion: str
        """
        # Analyze the request
        plan = self.planner.analyze(message)
        
        return {
            "can_run_parallel": plan.can_run_parallel,
            "plan": plan,
            "reason": plan.recommendation,
            "suggestion": self._get_suggestion(plan),
            "config": {
                "enabled": self.config.enabled,
                "max_agents": self.config.max_agents,
                "stall_threshold": self.config.stall_threshold
            }
        }
    
    def create_parallel_tasks(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create parallel tasks based on analysis.
        
        Args:
            analysis: Result from evaluate_parallel_request()
            
        Returns:
            Dict with task IDs and execution plan
        """
        if not analysis["can_run_parallel"]:
            return {
                "success": False,
                "reason": analysis["reason"],
                "task_ids": [],
                "execution_mode": "sequential"
            }
        
        plan = analysis["plan"]
        
        # Create context isolation folders for each task
        context_base = Path(".opencode/context/02_isolated_tasks/")
        context_base.mkdir(parents=True, exist_ok=True)
        
        created_contexts = []
        for task_id in plan.task_ids:
            task_context = context_base / task_id
            task_context.mkdir(parents=True, exist_ok=True)
            created_contexts.append(str(task_context))
        
        return {
            "success": True,
            "task_ids": plan.task_ids,
            "tasks": [t.__dict__ for t in plan.tasks],
            "execution_mode": "parallel",
            "parallel_groups": plan.parallel_groups,
            "estimated_speedup": plan.estimated_speedup,
            "context_folders": created_contexts,
            "agents_needed": plan.agents_needed
        }
    
    def execute_parallel(self, execution_plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute tasks in parallel using the coordinator.
        
        Args:
            execution_plan: Result from create_parallel_tasks()
            
        Returns:
            Execution result with status and metrics
        """
        if not execution_plan.get("success"):
            return {
                "success": False,
                "reason": execution_plan.get("reason", "Unknown error"),
                "execution_mode": "sequential"
            }
        
        # Import and use parallel coordinator
        try:
            # Try project-level import first
            # Import from co-located nso/scripts/ directory
            import importlib.util
            import os
            script_dir = os.path.dirname(os.path.abspath(__file__))
            spec = importlib.util.spec_from_file_location("parallel_coordinator", os.path.join(script_dir, "parallel_coordinator.py"))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            ParallelCoordinator = mod.ParallelCoordinator
            
            coordinator = ParallelCoordinator(
                max_agents=self.config.max_agents,
                stall_threshold=self.config.stall_threshold
            )
            
            # Create TaskAwareAgent instances
            agents = []
            for task_info in execution_plan.get("tasks", []):
                agent = coordinator.TaskAwareAgent(
                    task_id=task_info["task_id"],
                    agent_type=task_info["agent_type"],
                    task_name=task_info["description"]
                )
                agents.append(agent)
            
            # Execute in parallel
            result = coordinator.execute_parallel_tasks(agents)
            
            return {
                "success": result.success,
                "execution_mode": "parallel",
                "duration": result.duration,
                "agents_completed": result.agents_completed,
                "stall_detected": result.stall_detected,
                "result": result
            }
            
        except (ImportError, AttributeError) as e:
            # Coordinator not available - fall back to sequential
            return {
                "success": True,
                "execution_mode": "sequential_fallback",
                "reason": f"Parallel coordinator not available: {str(e)}",
                "note": "Execute tasks sequentially with standard Oracle routing"
            }
    
    def _get_suggestion(self, plan: ParallelPlan) -> str:
        """Get a human-readable suggestion based on the plan."""
        if not plan.can_run_parallel:
            return f"💡 {plan.recommendation}"
        
        return (
            f"🚀 **Parallel Execution Available**\n"
            f"   • {plan.estimated_speedup}x speedup with {len(plan.tasks)} agents\n"
            f"   • Agents: {', '.join(plan.agents_needed)}\n"
            f"   • Mode: {'Parallel' if plan.parallel_groups else 'Sequential'}\n\n"
            f"{plan.recommendation}"
        )


# ============================================================================
# ROUTER MONITOR INTEGRATION
# ============================================================================

def enhance_router_with_parallel(
    router_result: Dict[str, Any], 
    message: str
) -> Dict[str, Any]:
    """
    Enhance router monitor result with parallel execution information.
    
    Usage:
        router_result = router_monitor.should_route(message)
        enhanced = enhance_router_with_parallel(router_result, message)
        
        if enhanced["should_route_parallel"]:
            # Oracle can execute in parallel
            parallel_plan = enhanced["parallel_plan"]
    """
    # Only enhance BUILD workflows
    if router_result.get("workflow") != "BUILD":
        return {
            **router_result,
            "should_route_parallel": False,
            "parallel_plan": None,
            "parallel_suggestion": "Parallel execution only available for BUILD workflows"
        }
    
    # Check if we should consider parallel execution
    if router_result.get("confidence", 0) < 0.3:
        return {
            **router_result,
            "should_route_parallel": False,
            "parallel_plan": None,
            "parallel_suggestion": "Low confidence - using standard sequential routing"
        }
    
    # Evaluate parallel execution
    oracle = ParallelOracleIntegration()
    parallel_analysis = oracle.evaluate_parallel_request(message)
    
    return {
        **router_result,
        "should_route_parallel": parallel_analysis["can_run_parallel"],
        "parallel_plan": parallel_analysis["plan"] if parallel_analysis["can_run_parallel"] else None,
        "parallel_suggestion": parallel_analysis["suggestion"],
        "parallel_config": parallel_analysis["config"]
    }


# ============================================================================
# MAIN / CLI
# ============================================================================

def main():
    """CLI for testing parallel integration."""
    import argparse
    
    parser = argparse.ArgumentParser(description="NSO Parallel Oracle Integration")
    parser.add_argument("message", help="User message to analyze")
    parser.add_argument("--enhanced", action="store_true", help="Enhance router result")
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("🔀 NSO PARALLEL ORACLE INTEGRATION")
    print("=" * 70)
    
    # Load configuration
    config = ParallelConfig.load_from_project()
    print(f"\n📋 Configuration:")
    print(f"   Enabled: {'✅' if config.enabled else '❌'}")
    print(f"   Max Agents: {config.max_agents}")
    print(f"   Stall Threshold: {config.stall_threshold}s")
    
    # Create integration
    oracle = ParallelOracleIntegration()
    
    # Evaluate request
    print(f"\n📝 Analyzing: \"{args.message[:80]}{'...' if len(args.message) > 80 else ''}\"")
    analysis = oracle.evaluate_parallel_request(args.message)
    
    print(f"\n🔍 Analysis Result:")
    print(f"   Can Run Parallel: {'✅' if analysis['can_run_parallel'] else '❌'}")
    print(f"   Reason: {analysis['reason']}")
    print(f"   Suggestion: {analysis['suggestion']}")
    
    if analysis["can_run_parallel"]:
        plan = analysis["plan"]
        print(f"\n📊 Parallel Plan:")
        print(f"   Speedup: {plan.estimated_speedup}x")
        print(f"   Agents: {plan.agents_needed}")
        print(f"   Tasks: {len(plan.tasks)}")
        print(f"   Task IDs: {plan.task_ids}")
    
    # If enhanced mode, also show router result
    if args.enhanced:
        print(f"\n" + "=" * 70)
        print("🛡️  ENHANCED ROUTER RESULT")
        print("=" * 70)
        
        # Simulate router result
        # Import router_monitor from co-located scripts directory
        try:
            import importlib.util as _ilu
            import os as _os
            _sd = _os.path.dirname(_os.path.abspath(__file__))
            _spec = _ilu.spec_from_file_location("router_monitor", _os.path.join(_sd, "router_monitor.py"))
            _mod = _ilu.module_from_spec(_spec)
            _spec.loader.exec_module(_mod)
            should_route = _mod.should_route
            router_result = should_route(args.message)
        except ImportError:
            # Fallback to simple routing
            router_result = {
                "should_route": True,
                "workflow": "BUILD",
                "confidence": 0.5,
                "reason": "Simulated router result"
            }
        
        enhanced = enhance_router_with_parallel(router_result, args.message)
        
        print(f"\n   Should Route: {'✅' if enhanced['should_route'] else '❌'}")
        print(f"   Workflow: {enhanced['workflow']}")
        print(f"   Confidence: {enhanced['confidence']:.0%}")
        print(f"   Should Route Parallel: {'✅' if enhanced['should_route_parallel'] else '❌'}")
        print(f"   Parallel Suggestion: {enhanced['parallel_suggestion']}")
    
    print(f"\n" + "=" * 70)


if __name__ == "__main__":
    main()
