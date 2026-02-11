#!/usr/bin/env python3
"""
Parallel Coordinator for NSO Parallel Execution System

Coordinates parallel execution of tasks with isolation:
1. Manages task lifecycle (create, monitor, complete, cleanup)
2. Injects isolation rules into agent instructions
3. Monitors for contamination and handles failures
4. Orchestrates agent coordination in parallel workflows
5. Handles fallback to sequential execution
"""

import os
import json
import yaml
import time
import threading
import queue
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Callable
from enum import Enum
import signal

# Import existing components with dynamic loading to handle import errors
import importlib.util

# Helper function to dynamically import modules
def import_module(module_name, class_name):
    """Dynamically import a class from a module."""
    module_path = Path(__file__).parent / f"{module_name}.py"
    if not module_path.exists():
        return None
    
    try:
        spec = importlib.util.spec_from_file_location(module_name, str(module_path))
        if spec is None:
            return None
        module = importlib.util.module_from_spec(spec)
        if spec.loader:
            spec.loader.exec_module(module)
            return getattr(module, class_name)
        return None
    except Exception as e:
        print(f"Warning: Could not import {class_name} from {module_name}: {e}")
        return None

# Try to import components, fall back to mocks if needed
TaskIDGeneratorClass = import_module("task_id_generator", "TaskIDGenerator")
TaskScopedContextManagerClass = import_module("task_context_manager", "TaskScopedContextManager")
ContextContaminationDetectorClass = import_module("context_contamination_detector", "ContextContaminationDetector")

# Create mock classes if imports failed
if TaskIDGeneratorClass is None:
    class TaskIDGenerator:
        def generate_task_id(self, workflow_type, user_request=None):
            import hashlib
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            workflow_hash = hashlib.sha256(workflow_type.encode()).hexdigest()[:8]
            return {
                'task_id': f'task_{timestamp}_{workflow_type}_{workflow_hash}_001',
                'metadata': {'workflow': workflow_type, 'timestamp': timestamp}
            }
    TaskIDGeneratorClass = TaskIDGenerator

if TaskScopedContextManagerClass is None:
    class TaskScopedContextManager:
        def __init__(self):
            self.tasks_base = Path(".opencode/context/tasks")
        
        def create_task_context(self, task_id):
            task_dir = self.tasks_base / task_id
            task_dir.mkdir(parents=True, exist_ok=True)
            return {'context_path': str(task_dir)}
        
        def delete_task_context(self, task_id):
            task_dir = self.tasks_base / task_id
            if task_dir.exists():
                import shutil
                shutil.rmtree(task_dir)
    TaskScopedContextManagerClass = TaskScopedContextManager

if ContextContaminationDetectorClass is None:
    class ContextContaminationDetector:
        def __init__(self):
            self.config = {'contamination': {'auto_quarantine': False}}
        
        def scan_task_directory(self, task_id):
            return []
        
        def scan_all_tasks(self):
            return {}
        
        def generate_report(self, events):
            return {'scan_timestamp': 'mock', 'total_contamination_events': 0}
    ContextContaminationDetectorClass = ContextContaminationDetector


class TaskStatus(Enum):
    """Status of a parallel task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CONTAMINATED = "contaminated"
    TIMEOUT = "timeout"


class AgentType(Enum):
    """Types of agents that can run in parallel."""
    BUILDER = "builder"
    JANITOR = "janitor"
    DESIGNER = "designer"
    SCOUT = "scout"
    LIBRARIAN = "librarian"
    ORACLE = "oracle"  # Task-specific Oracle, not coordinator


class ParallelCoordinator:
    """
    Main coordinator for parallel task execution with isolation.
    """
    
    def __init__(self, config_path: str = ".opencode/config/parallel-config.yaml"):
        """
        Initialize parallel coordinator.
        
        Args:
            config_path: Path to parallel execution configuration
        """
        self.config_path = config_path
        self.config = self._load_config()
        
        # Initialize components
        self.task_id_gen = TaskIDGeneratorClass()
        self.context_manager = TaskScopedContextManagerClass()
        self.contamination_detector = ContextContaminationDetectorClass()
        
        # Task tracking
        self.active_tasks: Dict[str, Dict] = {}  # task_id -> task_info
        self.task_queue = queue.PriorityQueue()  # (priority, task_id, task_info)
        self.completed_tasks: Dict[str, Dict] = {}
        
        # Monitoring
        self.monitor_thread = None
        self.shutdown_flag = threading.Event()
        
        # Statistics
        self.stats = {
            'tasks_started': 0,
            'tasks_completed': 0,
            'tasks_failed': 0,
            'contamination_events': 0,
            'fallback_events': 0,
            'total_execution_time': 0
        }
        
        # Track uptime
        self.start_time = datetime.now()
        
        # Agent instruction templates
        self.agent_templates = self._load_agent_templates()
        
    def _load_config(self) -> Dict:
        """Load parallel execution configuration."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
                return config.get('parallel_execution', {})
        except FileNotFoundError:
            print(f"Warning: Config file not found: {self.config_path}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict:
        """Return default configuration."""
        return {
            'enabled': False,  # Safe default - sequential execution
            'mode': 'hybrid',
            'concurrency': {
                'max_parallel_agents': 3,
                'max_queue_length': 10
            },
            'timeouts': {
                'agent_heartbeat_interval': 30,
                'agent_response_timeout': 120,
                'task_completion_timeout': 300
            },
            'agent_opt_out': {
                'builder': False,
                'janitor': False,
                'designer': False,
                'scout': False,
                'librarian': False
            }
        }
    
    def _load_agent_templates(self) -> Dict:
        """Load agent instruction templates."""
        templates_dir = Path(".opencode/agent_templates")
        templates = {}
        
        if not templates_dir.exists():
            print(f"Warning: Agent templates directory not found: {templates_dir}")
            return {}
        
        # Load isolation templates
        isolation_templates = {}
        for template_file in templates_dir.glob("task_isolation_*.md"):
            template_name = template_file.stem.replace("task_isolation_", "")
            with open(template_file, 'r') as f:
                isolation_templates[template_name] = f.read()
        
        # Load agent-specific templates
        agent_templates = {}
        for template_file in templates_dir.glob("task_aware_*.md"):
            agent_type = template_file.stem.replace("task_aware_", "").replace(".md", "")
            with open(template_file, 'r') as f:
                agent_templates[agent_type] = f.read()
        
        return {
            'isolation': isolation_templates,
            'agents': agent_templates
        }
    
    def should_parallelize(self, workflow_type: str, complexity: str = "medium") -> bool:
        """
        Determine if a task should be parallelized.
        
        Args:
            workflow_type: Type of workflow (BUILD, DEBUG, REVIEW, PLAN)
            complexity: Task complexity (low, medium, high)
            
        Returns:
            True if task should be parallelized
        """
        # Check if parallel execution is enabled
        if not self.config.get('enabled', False):
            return False
        
        # Check workflow restrictions
        disable_for = self.config.get('hybrid_rules', {}).get('disable_for_workflows', [])
        if workflow_type in disable_for:
            return False
        
        # Check agent opt-out
        if workflow_type.upper() == "BUILD":
            if self.config.get('agent_opt_out', {}).get('builder', False):
                return False
        
        # Check complexity threshold
        min_complexity = self.config.get('hybrid_rules', {}).get('min_task_complexity', 'medium')
        complexity_map = {'low': 1, 'medium': 2, 'high': 3}
        if complexity_map.get(complexity, 2) < complexity_map.get(min_complexity, 2):
            return False
        
        # Check concurrency limits
        active_count = len([t for t in self.active_tasks.values() 
                           if t.get('status') == TaskStatus.RUNNING])
        max_parallel = self.config.get('concurrency', {}).get('max_parallel_agents', 3)
        
        if active_count >= max_parallel:
            return False
        
        return True
    
    def create_parallel_task(self, 
                           workflow_type: str,
                           agent_type: AgentType,
                           user_request: str,
                           priority: int = 5) -> Tuple[str, Dict]:
        """
        Create a new parallel task with isolation.
        
        Args:
            workflow_type: Type of workflow
            agent_type: Type of agent to execute
            user_request: User request/instructions
            priority: Task priority (1=highest, 10=lowest)
            
        Returns:
            Tuple of (task_id, task_info)
        """
        # Generate task ID
        task_id_info = self.task_id_gen.generate_task_id(workflow_type, user_request)
        task_id = task_id_info['task_id']
        
        # Create task context
        context_info = self.context_manager.create_task_context(task_id)
        
        # Prepare task information
        task_info = {
            'task_id': task_id,
            'workflow_type': workflow_type,
            'agent_type': agent_type,
            'status': TaskStatus.PENDING,
            'priority': priority,
            'created_at': datetime.now().isoformat(),
            'context_path': context_info['context_path'],
            'user_request': user_request,
            'metadata': task_id_info,
            'heartbeat': datetime.now().isoformat(),
            'retry_count': 0,
            'max_retries': 3
        }
        
        # Inject isolation rules into agent instructions
        agent_instructions = self._inject_isolation_rules(
            agent_type, task_info, user_request
        )
        task_info['agent_instructions'] = agent_instructions
        
        # Save task configuration
        task_config_path = Path(context_info['context_path']) / f"{task_id}_task_config.json"
        with open(task_config_path, 'w') as f:
            json.dump(task_info, f, indent=2)
        
        # Add to queue
        self.task_queue.put((priority, datetime.now().timestamp(), task_id, task_info))
        self.active_tasks[task_id] = task_info
        self.stats['tasks_started'] += 1
        
        print(f"Created parallel task: {task_id} ({agent_type.value})")
        return task_id, task_info
    
    def _inject_isolation_rules(self, 
                              agent_type: AgentType, 
                              task_info: Dict, 
                              base_instructions: str) -> str:
        """
        Inject task isolation rules into agent instructions.
        
        Args:
            agent_type: Type of agent
            task_info: Task information
            base_instructions: Base agent instructions
            
        Returns:
            Instructions with isolation rules injected
        """
        task_id = task_info['task_id']
        context_path = task_info['context_path']
        
        # Get template for this agent type
        agent_template = self.agent_templates['agents'].get(agent_type.value, "")
        
        if not agent_template:
            # Fallback: inject basic isolation rules
            isolation_header = self.agent_templates['isolation'].get('header', "")
            isolation_rules = self.agent_templates['isolation'].get('rules', "")
            isolation_examples = self.agent_templates['isolation'].get('examples', "")
            
            # Replace template variables
            template_vars = {
                '{{task_id}}': task_id,
                '{{task_context_path}}': context_path,
                '{{task_type}}': task_info['workflow_type'],
                '{{agent_role}}': agent_type.value
            }
            
            for var, value in template_vars.items():
                isolation_header = isolation_header.replace(var, value)
                isolation_rules = isolation_rules.replace(var, value)
                isolation_examples = isolation_examples.replace(var, value)
            
            # Combine
            return f"{isolation_header}\n\n{base_instructions}\n\n{isolation_rules}\n\n{isolation_examples}"
        
        else:
            # Use agent-specific template
            template_vars = {
                '{{task_id}}': task_id,
                '{{task_context_path}}': context_path,
                '{{task_type}}': task_info['workflow_type'],
                '{{agent_role}}': agent_type.value
            }
            
            for var, value in template_vars.items():
                agent_template = agent_template.replace(var, value)
            
            return agent_template
    
    def start_task_execution(self, task_id: str) -> bool:
        """
        Start execution of a parallel task.
        
        Args:
            task_id: ID of task to start
            
        Returns:
            True if task started successfully
        """
        if task_id not in self.active_tasks:
            print(f"Error: Task not found: {task_id}")
            return False
        
        task_info = self.active_tasks[task_id]
        
        # Check for contamination before starting
        contamination_events = self.contamination_detector.scan_task_directory(task_id)
        if contamination_events:
            print(f"Contamination detected in task {task_id} before start")
            task_info['status'] = TaskStatus.CONTAMINATED
            task_info['contamination_events'] = contamination_events
            self._handle_contamination(task_id, contamination_events)
            return False
        
        # Update task status
        task_info['status'] = TaskStatus.RUNNING
        task_info['started_at'] = datetime.now().isoformat()
        task_info['heartbeat'] = datetime.now().isoformat()
        
        # In a real implementation, this would launch the agent process
        # For now, we'll simulate by creating a start marker
        context_path = task_info['context_path']
        start_marker = Path(context_path) / f"{task_id}_STARTED"
        start_marker.touch()
        
        # Save agent instructions to file
        instructions_file = Path(context_path) / f"{task_id}_agent_instructions.md"
        with open(instructions_file, 'w') as f:
            f.write(task_info['agent_instructions'])
        
        print(f"Started task execution: {task_id}")
        return True
    
    def monitor_tasks(self):
        """Monitor active tasks for completion, timeouts, and issues."""
        print("Starting task monitor...")
        
        while not self.shutdown_flag.is_set():
            try:
                current_time = datetime.now()
                
                # Check each active task
                for task_id, task_info in list(self.active_tasks.items()):
                    if task_info['status'] == TaskStatus.RUNNING:
                        self._check_task_health(task_id, task_info, current_time)
                    
                    # Check for completion
                    self._check_task_completion(task_id, task_info)
                
                # Clean up completed/failed tasks
                self._cleanup_old_tasks()
                
                # Run contamination scan periodically
                if int(current_time.timestamp()) % 300 == 0:  # Every 5 minutes
                    self._run_contamination_scan()
                
                # Save monitoring state
                self._save_monitoring_state()
                
                time.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                print(f"Error in task monitor: {e}")
                time.sleep(30)  # Back off on error
    
    def _check_task_health(self, task_id: str, task_info: Dict, current_time: datetime):
        """Check health of a running task."""
        # Check heartbeat
        heartbeat_str = task_info.get('heartbeat')
        if heartbeat_str:
            try:
                heartbeat = datetime.fromisoformat(heartbeat_str)
                heartbeat_interval = self.config.get('timeouts', {}).get('agent_heartbeat_interval', 30)
                
                if (current_time - heartbeat).total_seconds() > heartbeat_interval:
                    print(f"Warning: Task {task_id} heartbeat stale")
                    
                    # Check for timeout
                    response_timeout = self.config.get('timeouts', {}).get('agent_response_timeout', 120)
                    if (current_time - heartbeat).total_seconds() > response_timeout:
                        print(f"Task {task_id} timed out")
                        task_info['status'] = TaskStatus.TIMEOUT
                        self._handle_task_timeout(task_id, task_info)
            except ValueError:
                pass
        
        # Check task completion timeout
        started_str = task_info.get('started_at')
        if started_str:
            try:
                started = datetime.fromisoformat(started_str)
                completion_timeout = self.config.get('timeouts', {}).get('task_completion_timeout', 300)
                
                if (current_time - started).total_seconds() > completion_timeout:
                    print(f"Task {task_id} exceeded completion timeout")
                    task_info['status'] = TaskStatus.TIMEOUT
                    self._handle_task_timeout(task_id, task_info)
            except ValueError:
                pass
    
    def _check_task_completion(self, task_id: str, task_info: Dict):
        """Check if a task has completed."""
        context_path = task_info['context_path']
        completion_file = Path(context_path) / f"{task_id}_task_complete.json"
        
        if completion_file.exists():
            try:
                with open(completion_file, 'r') as f:
                    completion_data = json.load(f)
                
                task_info['status'] = TaskStatus.COMPLETED
                task_info['completed_at'] = datetime.now().isoformat()
                task_info['completion_data'] = completion_data
                
                # Move to completed tasks
                self.completed_tasks[task_id] = task_info
                if task_id in self.active_tasks:
                    del self.active_tasks[task_id]
                
                self.stats['tasks_completed'] += 1
                
                print(f"Task completed: {task_id}")
                
                # Run final contamination check
                self._final_contamination_check(task_id)
                
                # Process task results
                self._process_task_results(task_id, completion_data)
                
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error reading completion file for {task_id}: {e}")
    
    def _handle_task_timeout(self, task_id: str, task_info: Dict):
        """Handle a task timeout."""
        print(f"Handling timeout for task {task_id}")
        
        # Check retry count
        retry_count = task_info.get('retry_count', 0)
        max_retries = task_info.get('max_retries', 3)
        
        if retry_count < max_retries:
            # Retry the task
            task_info['retry_count'] = retry_count + 1
            task_info['status'] = TaskStatus.PENDING
            task_info['heartbeat'] = datetime.now().isoformat()
            
            # Re-add to queue with higher priority
            priority = task_info.get('priority', 5) - 1  # Higher priority
            self.task_queue.put((priority, datetime.now().timestamp(), task_id, task_info))
            
            print(f"Retrying task {task_id} (attempt {retry_count + 1}/{max_retries})")
        else:
            # Mark as failed
            task_info['status'] = TaskStatus.FAILED
            task_info['failed_at'] = datetime.now().isoformat()
            self.stats['tasks_failed'] += 1
            
            # Check if we should fall back to sequential
            self._check_fallback_condition(task_id, "timeout")
            
            print(f"Task {task_id} failed after {max_retries} retries")
    
    def _handle_contamination(self, task_id: str, contamination_events: List[Dict]):
        """Handle contamination in a task."""
        print(f"Handling contamination for task {task_id}")
        
        task_info = self.active_tasks.get(task_id)
        if task_info:
            task_info['status'] = TaskStatus.CONTAMINATED
            task_info['contamination_events'] = contamination_events
            task_info['contaminated_at'] = datetime.now().isoformat()
        
        self.stats['contamination_events'] += 1
        
        # Check auto-quarantine setting
        config = self.contamination_detector.config
        if config.get('contamination', {}).get('auto_quarantine', False):
            print(f"Auto-quarantining task {task_id}")
            # In real implementation, would quarantine task files
        
        # Check if we should fall back to sequential
        self._check_fallback_condition(task_id, "contamination")
    
    def _check_fallback_condition(self, task_id: str, reason: str):
        """
        Check if we should fall back to sequential execution.
        
        Args:
            task_id: Task that triggered the check
            reason: Reason for fallback check
        """
        fallback_config = self.config.get('fallback', {})
        conditions = fallback_config.get('conditions', [])
        
        should_fallback = False
        
        if 'contamination_detected' in str(conditions) and reason == "contamination":
            should_fallback = True
        elif 'multiple_failures' in str(conditions) and self.stats['tasks_failed'] > 2:
            should_fallback = True
        elif 'resource_exceeded' in str(conditions):
            # Check resource usage (simplified)
            if len(self.active_tasks) > self.config.get('concurrency', {}).get('max_parallel_agents', 3) * 2:
                should_fallback = True
        
        if should_fallback:
            self._initiate_fallback(task_id, reason)
    
    def _initiate_fallback(self, task_id: str, reason: str):
        """Initiate fallback to sequential execution."""
        print(f"⚠️  INITIATING FALLBACK TO SEQUENTIAL EXECUTION")
        print(f"   Reason: {reason}")
        print(f"   Triggering task: {task_id}")
        
        self.stats['fallback_events'] += 1
        
        # Stop accepting new parallel tasks
        self.config['enabled'] = False
        
        # Complete or cancel existing tasks
        for t_id, task_info in list(self.active_tasks.items()):
            if task_info['status'] == TaskStatus.RUNNING:
                # Try to gracefully complete
                task_info['status'] = TaskStatus.FAILED
                task_info['fallback_reason'] = reason
        
        # Save fallback event
        fallback_record = {
            'timestamp': datetime.now().isoformat(),
            'reason': reason,
            'triggering_task': task_id,
            'active_tasks_at_fallback': len(self.active_tasks),
            'stats': self.stats.copy()
        }
        
        fallback_file = Path(".opencode/context") / "parallel_fallback.json"
        with open(fallback_file, 'w') as f:
            json.dump(fallback_record, f, indent=2)
        
        print(f"Fallback complete. Parallel execution disabled.")
    
    def _run_contamination_scan(self):
        """Run periodic contamination scan."""
        print("Running periodic contamination scan...")
        
        events_by_task = self.contamination_detector.scan_all_tasks()
        
        if events_by_task:
            print(f"Contamination detected in {len(events_by_task)} tasks")
            
            # Generate report
            report = self.contamination_detector.generate_report(events_by_task)
            
            # Save report
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            report_path = Path(self.context_manager.tasks_base) / f"contamination_scan_{timestamp}.json"
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            # Alert on contamination
            for task_id, events in events_by_task.items():
                if task_id in self.active_tasks:
                    self._handle_contamination(task_id, events)
    
    def _final_contamination_check(self, task_id: str):
        """Run final contamination check on completed task."""
        events = self.contamination_detector.scan_task_directory(task_id)
        
        if events:
            print(f"⚠️  Contamination found in completed task {task_id}")
            
            # Mark task as contaminated even though completed
            if task_id in self.completed_tasks:
                self.completed_tasks[task_id]['contamination_found_post_completion'] = True
                self.completed_tasks[task_id]['post_completion_contamination'] = events
    
    def _process_task_results(self, task_id: str, completion_data: Dict):
        """Process results from a completed task."""
        # This would integrate with the main NSO system
        # For example, updating global memory, notifying users, etc.
        
        # Save results
        results_file = Path(".opencode/context/tasks") / f"{task_id}_final_results.json"
        with open(results_file, 'w') as f:
            json.dump(completion_data, f, indent=2)
        
        print(f"Processed results for task {task_id}")
    
    def _cleanup_old_tasks(self):
        """Clean up old completed/failed tasks."""
        cleanup_config = self.config.get('task_isolation', {}).get('cleanup', {})
        keep_completed = cleanup_config.get('keep_completed_tasks', 7)
        keep_failed = cleanup_config.get('keep_failed_tasks', 1)
        
        cutoff_completed = datetime.now() - timedelta(days=keep_completed)
        cutoff_failed = datetime.now() - timedelta(days=keep_failed)
        
        tasks_to_remove = []
        
        for task_id, task_info in self.completed_tasks.items():
            completed_str = task_info.get('completed_at')
            if completed_str:
                try:
                    completed = datetime.fromisoformat(completed_str)
                    
                    if task_info.get('status') == TaskStatus.COMPLETED:
                        if completed < cutoff_completed:
                            tasks_to_remove.append(task_id)
                    elif task_info.get('status') in [TaskStatus.FAILED, TaskStatus.CONTAMINATED]:
                        if completed < cutoff_failed:
                            tasks_to_remove.append(task_id)
                except ValueError:
                    pass
        
        # Remove old tasks
        for task_id in tasks_to_remove:
            if task_id in self.completed_tasks:
                del self.completed_tasks[task_id]
            
            # Clean up task directory
            self.context_manager.delete_task_context(task_id)
    
    def _save_monitoring_state(self):
        """Save current monitoring state to file."""
        state = {
            'timestamp': datetime.now().isoformat(),
            'active_tasks': len(self.active_tasks),
            'completed_tasks': len(self.completed_tasks),
            'stats': self.stats,
            'config_enabled': self.config.get('enabled', False)
        }
        
        state_file = Path(".opencode/context") / "parallel_coordinator_state.json"
        with open(state_file, 'w') as f:
            json.dump(state, f, indent=2)
    
    def start_monitoring(self):
        """Start the task monitoring thread."""
        if self.monitor_thread is None or not self.monitor_thread.is_alive():
            self.shutdown_flag.clear()
            self.monitor_thread = threading.Thread(
                target=self.monitor_tasks,
                daemon=True,
                name="ParallelCoordinatorMonitor"
            )
            self.monitor_thread.start()
            print("Task monitoring started")
    
    def stop_monitoring(self):
        """Stop the task monitoring thread."""
        self.shutdown_flag.set()
        if self.monitor_thread:
            self.monitor_thread.join(timeout=30)
            print("Task monitoring stopped")
    
    def get_status(self) -> Dict:
        """Get current coordinator status."""
        return {
            'config_enabled': self.config.get('enabled', False),
            'mode': self.config.get('mode', 'hybrid'),
            'active_tasks': len(self.active_tasks),
            'completed_tasks': len(self.completed_tasks),
            'queue_size': self.task_queue.qsize(),
            'stats': self.stats,
            'uptime': self._get_uptime() if hasattr(self, 'start_time') else 'unknown'
        }
    
    def _get_uptime(self) -> str:
        """Get coordinator uptime."""
        if hasattr(self, 'start_time'):
            uptime = datetime.now() - self.start_time
            return str(uptime).split('.')[0]  # Remove microseconds
        return 'unknown'


# Command-line interface
def main():
    """Command-line interface for parallel coordinator."""
    import argparse
    
    parser = argparse.ArgumentParser(description='NSO Parallel Execution Coordinator')
    parser.add_argument('--config', default='.opencode/config/parallel-config.yaml',
                       help='Path to parallel config')
    parser.add_argument('--status', action='store_true', help='Show coordinator status')
    parser.add_argument('--start-monitor', action='store_true', help='Start task monitoring')
    parser.add_argument('--stop-monitor', action='store_true', help='Stop task monitoring')
    parser.add_argument('--create-task', help='Create test task (format: workflow:agent:description)')
    parser.add_argument('--scan', action='store_true', help='Run contamination scan')
    parser.add_argument('--cleanup', action='store_true', help='Clean up old tasks')
    
    args = parser.parse_args()
    
    coordinator = ParallelCoordinator(args.config)
    
    if args.status:
        status = coordinator.get_status()
        print(json.dumps(status, indent=2))
    
    elif args.start_monitor:
        coordinator.start_monitoring()
        print("Monitoring started. Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            coordinator.stop_monitoring()
    
    elif args.stop_monitor:
        coordinator.stop_monitoring()
    
    elif args.create_task:
        # Parse task creation args
        parts = args.create_task.split(':', 2)
        if len(parts) != 3:
            print("Error: Use format workflow:agent:description")
            sys.exit(1)
        
        workflow, agent_str, description = parts
        try:
            agent_type = AgentType(agent_str.lower())
        except ValueError:
            print(f"Error: Invalid agent type. Valid: {[a.value for a in AgentType]}")
            sys.exit(1)
        
        task_id, task_info = coordinator.create_parallel_task(
            workflow, agent_type, description
        )
        print(f"Created task: {task_id}")
        print(f"Context: {task_info['context_path']}")
    
    elif args.scan:
        detector = ContextContaminationDetector()
        events = detector.scan_all_tasks()
        report = detector.generate_report(events)
        print(json.dumps(report, indent=2))
    
    elif args.cleanup:
        coordinator._cleanup_old_tasks()
        print("Cleanup completed")
    
    else:
        parser.print_help()


if __name__ == '__main__':
    main()