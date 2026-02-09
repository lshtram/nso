#!/usr/bin/env python3
"""
NSO Parallel Oracle Integration Demo

Demonstrates the complete parallel execution integration with Oracle router.

Usage:
    python3 test_oracle_integration.py
"""

import sys
import json
from pathlib import Path

# Add paths for imports
sys.path.insert(0, "/Users/Shared/dev/dream-news/.opencode/scripts")
sys.path.insert(0, "/Users/opencode/.config/opencode/nso/scripts")

# Import the parallel oracle integration
try:
    from parallel_oracle_integration import (
        ParallelOracleIntegration,
        ParallelConfig,
        TaskIDGenerator,
        enhance_router_with_parallel
    )
except ImportError as e:
    print(f"❌ Error importing modules: {e}")
    print("📝 Make sure parallel_oracle_integration.py is in the scripts directory")
    sys.exit(1)


def test_parallel_detection():
    """Test parallel execution detection for various messages."""
    
    print("=" * 70)
    print("🔀 NSO PARALLEL ORACLE INTEGRATION DEMO")
    print("=" * 70)
    
    # Load configuration
    config = ParallelConfig.load_from_project()
    print(f"\n📋 Configuration:")
    print(f"   Enabled: {'✅' if config.enabled else '❌ (disabled by default)'}")
    print(f"   Max Agents: {config.max_agents}")
    print(f"   Stall Threshold: {config.stall_threshold}s")
    
    oracle = ParallelOracleIntegration()
    
    # Test messages with varying parallel potential
    test_messages = [
        # High parallel potential
        "build a new feature and then test it thoroughly",
        
        # Medium parallel potential
        "implement user authentication with full test coverage",
        
        # Low parallel potential
        "fix the login bug",
        
        # Complex multi-agent
        "build a complete feature from scratch with tests and code review",
        
        # Sequential only
        "plan the architecture for our new system"
    ]
    
    print(f"\n🧪 Testing Parallel Detection")
    print("-" * 70)
    
    results = []
    for i, message in enumerate(test_messages, 1):
        print(f"\n{i}. Message: \"{message}\"")
        
        # Evaluate parallel potential
        analysis = oracle.evaluate_parallel_request(message)
        
        print(f"   Can Run Parallel: {'✅' if analysis['can_run_parallel'] else '❌'}")
        print(f"   Reason: {analysis['reason']}")
        
        if analysis["can_run_parallel"]:
            plan = analysis["plan"]
            print(f"\n   Parallel Plan:")
            print(f"   - Speedup: {plan.estimated_speedup}x")
            print(f"   - Agents: {plan.agents_needed}")
            print(f"   - Tasks: {len(plan.tasks)}")
    
    return results


def test_enhanced_router():
    """Test enhanced router with parallel detection."""
    
    print(f"\n" + "=" * 70)
    print("🛡️  ENHANCED ROUTER INTEGRATION TEST")
    print("=" * 70)
    
    test_message = "build a new feature and test it with code review"
    
    print(f"\n📝 Message: \"{test_message}\"")
    
    # Simulate router result
    router_result = {
        "should_route": True,
        "workflow": "BUILD",
        "confidence": 0.65,
        "matched_keywords": ["build", "test"],
        "reason": "Detected BUILD intent with 65% confidence",
        "suggested_response": "I'll help you build this. Let me gather requirements first."
    }
    
    print(f"\n🔍 Router Result:")
    should_route = router_result['should_route']
    workflow = router_result['workflow']
    confidence = router_result['confidence']
    print(f"   Should Route: {'✅' if should_route else '❌'}")
    print(f"   Workflow: {workflow}")
    print(f"   Confidence: {confidence:.0%}")
    
    # Enhance with parallel detection
    enhanced = enhance_router_with_parallel(router_result, test_message)
    
    print(f"\n✨ Enhanced Result:")
    should_parallel = enhanced['should_route_parallel']
    print(f"   Should Route Parallel: {'✅' if should_parallel else '❌'}")
    print(f"   Parallel Suggestion: {enhanced['parallel_suggestion']}")
    
    return enhanced


def test_task_id_generation():
    """Test unique task ID generation."""
    
    print(f"\n" + "=" * 70)
    print("🆔 TASK ID GENERATION TEST")
    print("=" * 70)
    
    print(f"\n📝 Generating task IDs...")
    
    task_ids = []
    for i in range(5):
        task_id = TaskIDGenerator.generate(
            workflow="build",
            agent=["builder", "janitor", "designer"][i % 3]
        )
        task_ids.append(task_id)
        print(f"   {i+1}. {task_id}")
    
    # Verify uniqueness
    unique_count = len(set(task_ids))
    print(f"\n✅ Generated {len(task_ids)} unique task IDs")
    print(f"   All unique: {'✅' if unique_count == len(task_ids) else '❌'}")
    
    return task_ids


def demonstrate_parallel_workflow():
    """Demonstrate complete parallel workflow."""
    
    print(f"\n" + "=" * 70)
    print("🚀 COMPLETE PARALLEL WORKFLOW DEMONSTRATION")
    print("=" * 70)
    
    oracle = ParallelOracleIntegration()
    
    # Complex user request
    user_request = "build a complete user authentication feature with tests and code review"
    
    print(f"\n👤 User Request:")
    print(f"   \"{user_request}\"")
    
    # Step 1: Evaluate parallel potential
    print(f"\n📊 Step 1: Evaluate Parallel Potential")
    analysis = oracle.evaluate_parallel_request(user_request)
    
    print(f"   Can Run Parallel: {'✅' if analysis['can_run_parallel'] else '❌'}")
    print(f"   Recommendation: {analysis['reason']}")
    
    if analysis["can_run_parallel"]:
        plan = analysis["plan"]
        print(f"\n   Parallel Plan:")
        print(f"   - Speedup: {plan.estimated_speedup}x")
        print(f"   - Agents: {plan.agents_needed}")
        print(f"   - Tasks: {len(plan.tasks)}")
        
        # Step 2: Create parallel tasks
        print(f"\n📋 Step 2: Create Parallel Tasks")
        execution_plan = oracle.create_parallel_tasks(analysis)
        
        print(f"   Status: {'✅' if execution_plan['success'] else '❌'}")
        print(f"   Execution Mode: {execution_plan['execution_mode']}")
        print(f"   Task IDs: {execution_plan['task_ids']}")
        print(f"   Context Folders: {len(execution_plan.get('context_folders', []))}")
        
        # Step 3: Note about execution
        print(f"\n⚡ Step 3: Parallel Execution")
        print(f"   📝 Note: Real parallel execution requires NSO agent integration")
        print(f"   📝 For demo purposes, this shows the planning and task creation")
        print(f"   📝 In production, execute_parallel() would coordinate actual agents")
        
        return {
            "request": user_request,
            "can_parallel": analysis["can_run_parallel"],
            "plan": analysis["plan"],
            "execution_plan": execution_plan
        }
    else:
        print(f"\n⚠️  Sequential execution recommended")
        print(f"   Reason: {analysis['reason']}")
        
        return {
            "request": user_request,
            "can_parallel": False,
            "reason": analysis["reason"]
        }


def main():
    """Run all tests and demonstrations."""
    
    print("\n🚀 Starting NSO Parallel Oracle Integration Demo\n")
    
    # Run all tests
    parallel_results = test_parallel_detection()
    enhanced_result = test_enhanced_router()
    task_ids = test_task_id_generation()
    workflow_result = demonstrate_parallel_workflow()
    
    # Summary
    print(f"\n" + "=" * 70)
    print("📊 DEMO SUMMARY")
    print("=" * 70)
    
    parallel_count = sum(1 for r in parallel_results if r["can_parallel"])
    
    print(f"\n📈 Parallel Detection Results:")
    print(f"   - Messages tested: {len(parallel_results)}")
    print(f"   - Parallel-capable: {parallel_count}")
    print(f"   - Sequential-only: {len(parallel_results) - parallel_count}")
    
    if task_ids:
        print(f"\n🆔 Task ID Generation:")
        print(f"   - IDs generated: {len(task_ids)}")
        print(f"   - Format: project_workflow_timestamp_hash_counter")
    
    if enhanced_result.get("should_route_parallel"):
        print(f"\n✨ Enhanced Router:")
        print(f"   - Parallel routing available")
        print(f"   - Oracle can coordinate multiple agents")
    
    if workflow_result.get("can_parallel"):
        print(f"\n🚀 Complete Workflow:")
        print(f"   - Parallel execution planned")
        print(f"   - Estimated speedup: {workflow_result['plan'].estimated_speedup}x")
    
    print(f"\n" + "=" * 70)
    print("✅ Demo Complete!")
    print("=" * 70)
    
    # Return results for programmatic use
    return {
        "parallel_detection": parallel_results,
        "enhanced_router": enhanced_result,
        "task_ids": task_ids,
        "workflow": workflow_result
    }


if __name__ == "__main__":
    results = main()
    
    # Output JSON for programmatic use
    print("\n📊 JSON Output:")
    print("-" * 70)
    print(json.dumps(results, indent=2, default=str))
