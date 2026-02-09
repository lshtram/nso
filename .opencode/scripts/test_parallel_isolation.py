#!/usr/bin/env python3
"""
Test script for parallel execution with task isolation.
Simulates multiple agents working in parallel without contamination.
"""

import os
import json
import time
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

class MockAgent:
    """Mock agent that simulates work with task isolation."""
    
    def __init__(self, task_id, context_path, agent_type):
        self.task_id = task_id
        self.context_path = Path(context_path)
        self.agent_type = agent_type
        
    def work_with_isolation(self):
        """Simulate work with proper isolation."""
        print(f"[{self.task_id}] {self.agent_type}: Starting work with isolation...")
        
        # Create task-specific files with proper prefix
        files_created = []
        
        # Create requirements file
        req_file = self.context_path / f"{self.task_id}_requirements.md"
        req_file.write_text(f"# Requirements for Task {self.task_id}\n\nCreated by {self.agent_type}")
        files_created.append(req_file.name)
        
        # Create implementation file
        if self.agent_type == "builder":
            impl_file = self.context_path / f"{self.task_id}_implementation.py"
            impl_file.write_text(f"# Implementation for Task {self.task_id}\n\ndef feature():\n    return 'result'")
            files_created.append(impl_file.name)
        
        # Create tests
        test_file = self.context_path / f"{self.task_id}_tests.py"
        test_file.write_text(f"# Tests for Task {self.task_id}\n\ndef test_feature():\n    assert True")
        files_created.append(test_file.name)
        
        # Create task memory
        memory_file = self.context_path / f"{self.task_id}_active_context.md"
        memory_file.write_text(f"# Active Context - Task {self.task_id}\n\nStatus: Working")
        files_created.append(memory_file.name)
        
        # Simulate some work
        time.sleep(2)
        
        # Create completion file
        completion_file = self.context_path / f"{self.task_id}_task_complete.json"
        completion_data = {
            "task_id": self.task_id,
            "status": "completed",
            "agent": self.agent_type,
            "files_created": files_created,
            "completion_time": datetime.now().isoformat()
        }
        completion_file.write_text(json.dumps(completion_data, indent=2))
        
        print(f"[{self.task_id}] {self.agent_type}: Work complete. Created {len(files_created)} files.")
        return True
    
    def work_without_isolation(self):
        """Simulate work WITHOUT isolation (causing contamination)."""
        print(f"[{self.task_id}] {self.agent_type}: Starting work WITHOUT isolation (BAD!)...")
        
        # Create files WITHOUT task ID prefix (contamination)
        req_file = self.context_path / "requirements.md"  # ❌ Missing task ID
        req_file.write_text("# Global requirements (contaminated)")
        
        # Try to access global memory directly
        global_memory = Path(".opencode/context/01_memory/active_context.md")
        if global_memory.exists():
            print(f"[{self.task_id}] WARNING: Accessing global memory!")
        
        # Create completion file with wrong name
        completion_file = self.context_path / "task_complete.json"  # ❌ Missing task ID
        completion_data = {"status": "completed"}
        completion_file.write_text(json.dumps(completion_data))
        
        print(f"[{self.task_id}] {self.agent_type}: Work complete (but contaminated!).")
        return False

class ContaminationDetector:
    """Simple contamination detector for testing."""
    
    @staticmethod
    def scan_directory(directory):
        """Scan directory for files without task ID prefix."""
        dir_path = Path(directory)
        contamination = []
        
        for file_path in dir_path.rglob("*"):
            if file_path.is_file():
                filename = file_path.name
                # Check if file has a task ID prefix (task_XXXXXXXX_...)
                if not filename.startswith("task_") and filename not in [".", ".."]:
                    # Check if it's a common file that should have task ID
                    if filename.endswith(('.md', '.py', '.json', '.txt')):
                        contamination.append(str(file_path.relative_to(dir_path)))
        
        return contamination
    
    @staticmethod
    def scan_all_tasks(tasks_base):
        """Scan all task directories."""
        tasks_base = Path(tasks_base)
        results = {}
        
        if not tasks_base.exists():
            return results
        
        for task_dir in tasks_base.iterdir():
            if task_dir.is_dir():
                contamination = ContaminationDetector.scan_directory(task_dir)
                if contamination:
                    results[task_dir.name] = contamination
        
        return results

def simulate_parallel_execution(num_tasks=3, with_isolation=True):
    """Simulate parallel execution with multiple tasks."""
    print(f"\n{'='*60}")
    print(f"SIMULATING PARALLEL EXECUTION ({num_tasks} tasks)")
    print(f"Isolation: {'ENABLED' if with_isolation else 'DISABLED (contamination risk)'}")
    print(f"{'='*60}")
    
    # Create temporary test directory
    test_dir = Path(tempfile.mkdtemp(prefix="nso_test_"))
    tasks_base = test_dir / "tasks"
    tasks_base.mkdir(exist_ok=True)
    
    print(f"Test directory: {test_dir}")
    
    # Create mock tasks
    tasks = []
    for i in range(num_tasks):
        task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i:03d}"
        context_path = tasks_base / task_id
        context_path.mkdir(exist_ok=True)
        
        agent_type = "builder" if i % 2 == 0 else "janitor"
        agent = MockAgent(task_id, context_path, agent_type)
        tasks.append((task_id, agent))
    
    # Simulate parallel work
    import threading
    
    def run_agent(task_id, agent):
        if with_isolation:
            return agent.work_with_isolation()
        else:
            return agent.work_without_isolation()
    
    # Start threads to simulate parallel execution
    threads = []
    results = {}
    
    for task_id, agent in tasks:
        thread = threading.Thread(
            target=lambda tid=task_id, ag=agent: results.update({tid: run_agent(tid, ag)}),
            name=f"Task-{task_id}"
        )
        threads.append(thread)
        thread.start()
    
    # Wait for all threads
    for thread in threads:
        thread.join()
    
    # Check for contamination
    print(f"\n{'='*60}")
    print("CONTAMINATION SCAN RESULTS")
    print(f"{'='*60}")
    
    contamination_results = ContaminationDetector.scan_all_tasks(tasks_base)
    
    if contamination_results:
        print(f"❌ CONTAMINATION DETECTED in {len(contamination_results)} tasks!")
        for task_id, files in contamination_results.items():
            print(f"  Task {task_id}:")
            for file in files[:5]:  # Show first 5 contaminated files
                print(f"    - {file}")
            if len(files) > 5:
                print(f"    ... and {len(files) - 5} more")
    else:
        print("✅ NO CONTAMINATION DETECTED")
        print("   All files properly prefixed with task IDs")
    
    # Cleanup
    print(f"\nCleaning up test directory: {test_dir}")
    shutil.rmtree(test_dir)
    
    return len(contamination_results) == 0

def test_isolation_enforcement():
    """Test that isolation rules are properly enforced."""
    print(f"\n{'='*60}")
    print("ISOLATION ENFORCEMENT TEST")
    print(f"{'='*60}")
    
    test_dir = Path(tempfile.mkdtemp(prefix="nso_isolation_test_"))
    
    # Test 1: Agent with proper isolation
    print("\nTest 1: Agent with proper isolation")
    task_id = "task_test_001"
    context_path = test_dir / task_id
    context_path.mkdir(exist_ok=True)
    
    good_agent = MockAgent(task_id, context_path, "builder")
    good_agent.work_with_isolation()
    
    contamination = ContaminationDetector.scan_directory(context_path)
    if not contamination:
        print("  ✅ PASS: No contamination with proper isolation")
    else:
        print(f"  ❌ FAIL: Contamination found: {contamination}")
    
    # Test 2: Agent without isolation
    print("\nTest 2: Agent without isolation (should cause contamination)")
    task_id2 = "task_test_002"
    context_path2 = test_dir / task_id2
    context_path2.mkdir(exist_ok=True)
    
    bad_agent = MockAgent(task_id2, context_path2, "builder")
    bad_agent.work_without_isolation()
    
    contamination2 = ContaminationDetector.scan_directory(context_path2)
    if contamination2:
        print(f"  ✅ PASS: Contamination correctly detected: {len(contamination2)} files")
    else:
        print("  ❌ FAIL: Contamination not detected (but should have been)")
    
    # Cleanup
    shutil.rmtree(test_dir)
    
    return len(contamination) == 0 and len(contamination2) > 0

def main():
    """Run all tests."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test parallel execution isolation')
    parser.add_argument('--test-isolation', action='store_true', help='Test isolation enforcement')
    parser.add_argument('--simulate-parallel', action='store_true', help='Simulate parallel execution')
    parser.add_argument('--num-tasks', type=int, default=3, help='Number of tasks to simulate')
    parser.add_argument('--no-isolation', action='store_true', help='Simulate WITHOUT isolation (to see contamination)')
    
    args = parser.parse_args()
    
    if args.test_isolation:
        success = test_isolation_enforcement()
        if success:
            print(f"\n{'='*60}")
            print("✅ ALL ISOLATION TESTS PASSED")
            print(f"{'='*60}")
        else:
            print(f"\n{'='*60}")
            print("❌ ISOLATION TESTS FAILED")
            print(f"{'='*60}")
    
    if args.simulate_parallel:
        with_isolation = not args.no_isolation
        success = simulate_parallel_execution(args.num_tasks, with_isolation)
        
        if success:
            print(f"\n{'='*60}")
            print("✅ PARALLEL EXECUTION TEST PASSED")
            print("   Task isolation successfully prevented contamination")
            print(f"{'='*60}")
        else:
            print(f"\n{'='*60}")
            print("❌ PARALLEL EXECUTION TEST FAILED")
            print("   Contamination detected - isolation failed")
            print(f"{'='*60}")
    
    if not args.test_isolation and not args.simulate_parallel:
        # Run default test suite
        print("Running default test suite...")
        
        print("\n1. Testing isolation enforcement:")
        isolation_ok = test_isolation_enforcement()
        
        print("\n2. Simulating parallel execution WITH isolation:")
        parallel_ok = simulate_parallel_execution(3, True)
        
        print("\n3. Simulating parallel execution WITHOUT isolation (expected to fail):")
        parallel_bad = not simulate_parallel_execution(2, False)  # Should have contamination
        
        if isolation_ok and parallel_ok and parallel_bad:
            print(f"\n{'='*60}")
            print("✅ ALL TESTS PASSED!")
            print("Task isolation system is working correctly.")
            print(f"{'='*60}")
        else:
            print(f"\n{'='*60}")
            print("❌ SOME TESTS FAILED")
            print(f"Isolation: {'PASS' if isolation_ok else 'FAIL'}")
            print(f"Parallel with isolation: {'PASS' if parallel_ok else 'FAIL'}")
            print(f"Parallel without isolation detected contamination: {'YES' if parallel_bad else 'NO (should have)'}")
            print(f"{'='*60}")

if __name__ == '__main__':
    main()