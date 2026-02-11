#!/usr/bin/env python3
"""
Task-Scoped Context Manager
Creates isolated context folders for parallel task execution
"""

import os
import shutil
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import yaml


class TaskScopedContextManager:
    """Manages isolated context folders for parallel tasks"""
    
    def __init__(self, base_path: str = None, config_path: str = None):
        """
        Initialize context manager
        
        Args:
            base_path: Base path for context directories
            config_path: Path to configuration file
        """
        self.base_path = base_path or ".opencode/context"
        self.config_path = config_path or ".opencode/config/task-isolation.yaml"
        self.config = self._load_config()
        
        # Initialize directories
        self._ensure_directories()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            # Return defaults if config not available
            return {
                'directories': {
                    'tasks': 'tasks',
                    'global': '00_meta',
                    'workspace': 'workspace',
                    'artifacts': 'artifacts',
                    'memory': '01_memory',
                    'requirements': 'requirements'
                }
            }
    
    def _ensure_directories(self):
        """Ensure required directories exist"""
        directories = self.config.get('directories', {})
        
        # Base directories
        dirs_to_create = [
            self.base_path,
            os.path.join(self.base_path, directories.get('tasks', 'tasks')),
            os.path.join(self.base_path, directories.get('global', '00_meta'))
        ]
        
        for directory in dirs_to_create:
            os.makedirs(directory, exist_ok=True)
    
    def create_task_context(self, task_id: str, workflow_type: str = None) -> str:
        """
        Create isolated context folder for task
        
        Args:
            task_id: Unique task ID
            workflow_type: Type of workflow (optional)
            
        Returns:
            Path to task context directory
        """
        # Get directory configuration
        directories = self.config.get('directories', {})
        tasks_dir = directories.get('tasks', 'tasks')
        
        # Create task context path
        task_context_path = os.path.join(self.base_path, tasks_dir, task_id)
        
        # Create directory structure
        self._create_task_directory_structure(task_context_path, task_id, workflow_type)
        
        # Copy base templates (READ-ONLY)
        self._copy_base_templates(task_context_path, task_id)
        
        # Create task-specific memory files
        self._create_task_memory_files(task_context_path, task_id, workflow_type)
        
        # Create task metadata
        self._create_task_metadata(task_context_path, task_id, workflow_type)
        
        return task_context_path
    
    def _create_task_directory_structure(self, task_path: str, task_id: str, 
                                        workflow_type: str = None):
        """Create directory structure for task"""
        directories = self.config.get('directories', {})
        
        # List of directories to create
        dirs_to_create = [
            task_path,
            os.path.join(task_path, directories.get('memory', '01_memory')),
            os.path.join(task_path, directories.get('requirements', 'requirements')),
            os.path.join(task_path, directories.get('workspace', 'workspace')),
            os.path.join(task_path, directories.get('artifacts', 'artifacts')),
            os.path.join(task_path, 'status'),
            os.path.join(task_path, 'checkpoints'),
            os.path.join(task_path, 'logs')
        ]
        
        for directory in dirs_to_create:
            os.makedirs(directory, exist_ok=True)
            
        # Create README in each directory
        for directory in dirs_to_create[1:]:  # Skip base task_path
            readme_path = os.path.join(directory, 'README.md')
            if not os.path.exists(readme_path):
                with open(readme_path, 'w') as f:
                    f.write(f"""# Directory: {os.path.basename(directory)}

## Task: {task_id}
## Created: {datetime.now().isoformat()}

## Purpose
This directory is part of the isolated context for task {task_id}.

## Isolation Rules
- Only files related to task {task_id} should be here
- All files should be prefixed with `{task_id}_`
- Do not modify files from other tasks
""")
    
    def _copy_base_templates(self, task_path: str, task_id: str):
        """Copy read-only base templates to task context"""
        directories = self.config.get('directories', {})
        global_dir = directories.get('global', '00_meta')
        global_path = os.path.join(self.base_path, global_dir)
        
        if not os.path.exists(global_path):
            return
            
        # Files to copy as read-only templates
        templates_to_copy = [
            ('tech-stack.md', 'tech-stack.md'),
            ('patterns.md', 'patterns.md'),
            ('glossary.md', 'glossary.md')
        ]
        
        for source_file, dest_file in templates_to_copy:
            source_path = os.path.join(global_path, source_file)
            dest_path = os.path.join(task_path, dest_file)
            
            if os.path.exists(source_path):
                with open(source_path, 'r') as src:
                    content = src.read()
                    
                # Add isolation header
                isolated_content = f"""<!-- COPIED FROM GLOBAL CONTEXT - READ ONLY -->
<!-- Task: {task_id} | Copied: {datetime.now().isoformat()} -->
<!-- DO NOT MODIFY - This is a read-only copy from global context -->

{content}
"""
                
                with open(dest_path, 'w') as dst:
                    dst.write(isolated_content)
    
    def _create_task_memory_files(self, task_path: str, task_id: str, 
                                 workflow_type: str = None):
        """Create task-specific memory files"""
        directories = self.config.get('directories', {})
        memory_dir = directories.get('memory', '01_memory')
        memory_path = os.path.join(task_path, memory_dir)
        
        # Active Context
        active_context = f"""# Active Context - Task {task_id}

## Task Identification
- **Task ID:** {task_id}
- **Workflow:** {workflow_type or 'Unknown'}
- **Created:** {datetime.now().isoformat()}
- **Status:** INITIALIZED

## Task Scope
This context is isolated to task {task_id}. All operations should reference this task ID.

## Isolation Rules
1. Only read/write to files in this task's context folder: {task_path}
2. Prefix all file operations with task ID: `{task_id}_`
3. Do not modify files from other tasks
4. Report any context contamination immediately

## Current Focus
- Initializing task context
- Awaiting task assignment

## Task Context Path
```
{task_path}
```

## File Naming Convention
All files must follow this pattern:
- ✅ CORRECT: `{task_id}_filename.ext`
- ❌ WRONG: `filename.ext` (missing task ID)

## Communication Protocol
- Status updates: `{task_path}/status/{task_id}_status.md`
- Results: `{task_path}/artifacts/{task_id}_results.json`
- Logs: `{task_path}/logs/{task_id}_log.txt`
"""

        active_context_path = os.path.join(memory_path, f"active_context_{task_id}.md")
        with open(active_context_path, 'w') as f:
            f.write(active_context)
        
        # Progress File
        progress_content = f"""# Progress - Task {task_id}

## Task Information
- **Task ID:** {task_id}
- **Workflow:** {workflow_type or 'Unknown'}
- **Created:** {datetime.now().isoformat()}

## Status Timeline
| Timestamp | Status | Details |
|-----------|--------|---------|
| {datetime.now().isoformat()} | INITIALIZED | Task context created |

## Current Milestones
- [ ] Task context initialized
- [ ] Requirements loaded
- [ ] Agents assigned
- [ ] Execution started
- [ ] Results collected
- [ ] Task completed

## Validation Status
- [ ] Context isolation validated
- [ ] File naming verified
- [ ] No contamination detected

## Notes
This file tracks progress for task {task_id} only.
"""

        progress_path = os.path.join(memory_path, f"progress_{task_id}.md")
        with open(progress_path, 'w') as f:
            f.write(progress_content)
        
        # Patterns File
        patterns_content = f"""# Patterns - Task {task_id}

## Task-Specific Patterns

### File Naming Patterns
| Pattern | Purpose | Example |
|---------|---------|---------|
| `{task_id}_*.md` | Task-specific markdown files | `{task_id}_requirements.md` |
| `{task_id}_*.json` | Task-specific JSON data | `{task_id}_config.json` |
| `{task_id}_*.tsx` | Task-specific React components | `{task_id}_component.tsx` |

### Directory Usage Patterns
| Directory | Purpose | Files |
|-----------|---------|-------|
| workspace/ | Working files | `{task_id}_draft.md`, `{task_id}_code.tsx` |
| artifacts/ | Final outputs | `{task_id}_results.json`, `{task_id}_report.md` |
| status/ | Status updates | `{task_id}_status.md`, `{task_id}_heartbeat.json` |
| checkpoints/ | State snapshots | `{task_id}_checkpoint_001.json` |

### Isolation Enforcement Patterns
1. **Prefix Validation**: All files must start with `{task_id}_`
2. **Path Validation**: All operations must be within `{task_path}`
3. **Contamination Check**: Regular scanning for non-prefixed files
4. **Error Handling**: Stop immediately on contamination detection
"""

        patterns_path = os.path.join(memory_path, f"patterns_{task_id}.md")
        with open(patterns_path, 'w') as f:
            f.write(patterns_content)
    
    def _create_task_metadata(self, task_path: str, task_id: str, 
                             workflow_type: str = None):
        """Create task metadata file"""
        metadata = {
            'task_id': task_id,
            'workflow_type': workflow_type,
            'created_at': datetime.now().isoformat(),
            'context_path': task_path,
            'isolation_enabled': True,
            'strict_mode': self.config.get('task_isolation', {}).get('strict_mode', True),
            'config_source': self.config_path,
            'directory_structure': {
                'base': task_path,
                'memory': os.path.join(task_path, self.config.get('directories', {}).get('memory', '01_memory')),
                'requirements': os.path.join(task_path, self.config.get('directories', {}).get('requirements', 'requirements')),
                'workspace': os.path.join(task_path, self.config.get('directories', {}).get('workspace', 'workspace')),
                'artifacts': os.path.join(task_path, self.config.get('directories', {}).get('artifacts', 'artifacts'))
            }
        }
        
        metadata_path = os.path.join(task_path, f"{task_id}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def get_task_context(self, task_id: str) -> Optional[str]:
        """
        Get path to task context directory
        
        Args:
            task_id: Task ID
            
        Returns:
            Path to task context directory, or None if not found
        """
        directories = self.config.get('directories', {})
        tasks_dir = directories.get('tasks', 'tasks')
        task_path = os.path.join(self.base_path, tasks_dir, task_id)
        
        return task_path if os.path.exists(task_path) else None
    
    def list_tasks(self, status_filter: str = None) -> List[Dict[str, Any]]:
        """
        List all tasks
        
        Args:
            status_filter: Filter by status (initialized, running, completed, failed)
            
        Returns:
            List of task metadata
        """
        directories = self.config.get('directories', {})
        tasks_dir = directories.get('tasks', 'tasks')
        tasks_path = os.path.join(self.base_path, tasks_dir)
        
        if not os.path.exists(tasks_path):
            return []
        
        tasks = []
        for task_id in os.listdir(tasks_path):
            task_path = os.path.join(tasks_path, task_id)
            
            # Check if it's a directory (not a file)
            if not os.path.isdir(task_path):
                continue
            
            # Try to load metadata
            metadata_path = os.path.join(task_path, f"{task_id}_metadata.json")
            if os.path.exists(metadata_path):
                try:
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                        
                    # Apply filter if specified
                    if status_filter:
                        task_status = self._get_task_status(task_path, task_id)
                        if task_status != status_filter:
                            continue
                    
                    tasks.append(metadata)
                except (json.JSONDecodeError, IOError):
                    # Skip if metadata can't be read
                    continue
        
        return tasks
    
    def _get_task_status(self, task_path: str, task_id: str) -> str:
        """Get task status from progress file"""
        progress_path = os.path.join(task_path, '01_memory', f'progress_{task_id}.md')
        
        if not os.path.exists(progress_path):
            return 'unknown'
        
        try:
            with open(progress_path, 'r') as f:
                content = f.read()
                
            # Simple status extraction
            if 'Status: COMPLETED' in content:
                return 'completed'
            elif 'Status: FAILED' in content:
                return 'failed'
            elif 'Status: RUNNING' in content:
                return 'running'
            else:
                return 'initialized'
        except IOError:
            return 'unknown'
    
    def cleanup_old_tasks(self, max_age_days: int = None, 
                         keep_min_tasks: int = None) -> List[str]:
        """
        Clean up old task contexts
        
        Args:
            max_age_days: Maximum age in days (from config if None)
            keep_min_tasks: Minimum tasks to keep (from config if None)
            
        Returns:
            List of cleaned up task IDs
        """
        # Get cleanup config
        cleanup_config = self.config.get('cleanup', {})
        max_age = max_age_days or cleanup_config.get('keep_completed_tasks', 7)
        keep_min = keep_min_tasks or 10
        
        # Get all tasks
        all_tasks = self.list_tasks()
        
        # Sort by creation date
        all_tasks.sort(key=lambda x: x.get('created_at', ''))
        
        # Identify tasks to cleanup
        tasks_to_cleanup = []
        current_time = datetime.now()
        
        for task in all_tasks:
            task_id = task.get('task_id')
            created_at_str = task.get('created_at')
            
            if not task_id or not created_at_str:
                continue
            
            try:
                created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                age_days = (current_time - created_at).days
                
                # Check if should be cleaned up
                if age_days > max_age:
                    tasks_to_cleanup.append(task_id)
            except ValueError:
                # Skip if date can't be parsed
                continue
        
        # Ensure we keep minimum number of tasks
        if len(all_tasks) - len(tasks_to_cleanup) < keep_min:
            # Keep more recent tasks
            tasks_to_keep = all_tasks[-keep_min:]
            tasks_to_cleanup = [t.get('task_id') for t in all_tasks 
                              if t not in tasks_to_keep]
        
        # Perform cleanup
        cleaned_up = []
        for task_id in tasks_to_cleanup:
            if self.delete_task_context(task_id):
                cleaned_up.append(task_id)
        
        return cleaned_up
    
    def delete_task_context(self, task_id: str) -> bool:
        """
        Delete task context directory
        
        Args:
            task_id: Task ID to delete
            
        Returns:
            True if deleted, False otherwise
        """
        task_path = self.get_task_context(task_id)
        
        if not task_path:
            return False
        
        try:
            shutil.rmtree(task_path)
            return True
        except (OSError, IOError):
            return False


# Command-line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Manage task-scoped contexts for parallel execution')
    parser.add_argument('--create', help='Create context for task ID')
    parser.add_argument('--workflow', help='Workflow type for new task')
    parser.add_argument('--list', action='store_true', help='List all tasks')
    parser.add_argument('--status', help='Filter tasks by status')
    parser.add_argument('--cleanup', action='store_true', help='Clean up old tasks')
    parser.add_argument('--max-age', type=int, help='Maximum age in days for cleanup')
    parser.add_argument('--keep-min', type=int, help='Minimum tasks to keep')
    parser.add_argument('--delete', help='Delete task context')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--base-path', help='Base path for context directories')
    
    args = parser.parse_args()
    
    manager = TaskScopedContextManager(
        base_path=args.base_path,
        config_path=args.config
    )
    
    if args.create:
        context_path = manager.create_task_context(args.create, args.workflow)
        print(f"Created task context: {context_path}")
        
    elif args.list:
        tasks = manager.list_tasks(args.status)
        print(f"Found {len(tasks)} tasks:")
        for task in tasks:
            print(f"  - {task['task_id']} ({task.get('workflow_type', 'unknown')})")
            print(f"    Created: {task.get('created_at')}")
            print(f"    Path: {task.get('context_path')}")
            
    elif args.cleanup:
        cleaned = manager.cleanup_old_tasks(args.max_age, args.keep_min)
        print(f"Cleaned up {len(cleaned)} tasks: {', '.join(cleaned)}")
        
    elif args.delete:
        success = manager.delete_task_context(args.delete)
        if success:
            print(f"Deleted task context: {args.delete}")
        else:
            print(f"Failed to delete task context: {args.delete}")
            exit(1)
            
    else:
        parser.print_help()