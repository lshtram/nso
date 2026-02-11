#!/usr/bin/env python3
"""
Task ID Generator
Generates unique task IDs for parallel execution with context isolation
"""

import hashlib
import uuid
from datetime import datetime
import json
import os
from typing import Dict, Any, Optional, Optional


class TaskIDGenerator:
    """Generates unique task IDs with metadata"""
    
    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            config_path = ".opencode/config/task-isolation.yaml"
        self.config_path = config_path
        self.config = self._load_config()
        self.task_counter = self.config.get('task_id', {}).get('counter', {}).get('start', 1)
        self.max_counter = self.config.get('task_id', {}).get('counter', {}).get('max', 9999)
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        try:
            import yaml
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except (ImportError, FileNotFoundError):
            # Return defaults if config not available
            return {
                'task_id': {
                    'format': 'task_{timestamp}_{workflow}_{hash}_{counter}',
                    'timestamp_format': '%Y%m%d_%H%M%S',
                    'hash': {
                        'algorithm': 'sha256',
                        'length': 8
                    },
                    'counter': {
                        'start': 1,
                        'max': 9999
                    }
                }
            }
    
    def generate_task_id(self, workflow_type: str, user_request: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate unique task ID with metadata
        
        Args:
            workflow_type: Type of workflow (BUILD, DEBUG, REVIEW, PLAN)
            user_request: User request string for deterministic hashing
            
        Returns:
            Dictionary with task ID and metadata
        """
        # Get configuration
        task_id_format = self.config.get('task_id', {}).get('format', 
                    'task_{timestamp}_{workflow}_{hash}_{counter}')
        timestamp_format = self.config.get('task_id', {}).get('timestamp_format', 
                    '%Y%m%d_%H%M%S')
        hash_config = self.config.get('task_id', {}).get('hash', {})
        hash_algorithm = hash_config.get('algorithm', 'sha256')
        hash_length = hash_config.get('length', 8)
        
        # Generate components
        timestamp = datetime.now().strftime(timestamp_format)
        counter = self._get_next_counter()
        
        # Generate deterministic hash from request
        if user_request:
            request_hash = self._generate_hash(user_request, hash_algorithm, hash_length)
        else:
            # Fallback to random hash if no request
            request_hash = uuid.uuid4().hex[:hash_length]
        
        # Format task ID
        task_id = task_id_format.format(
            timestamp=timestamp,
            workflow=workflow_type.lower(),
            hash=request_hash,
            counter=counter
        )
        
        # Create metadata
        metadata = {
            'task_id': task_id,
            'timestamp': timestamp,
            'workflow_type': workflow_type,
            'request_hash': request_hash,
            'counter': counter,
            'full_timestamp': datetime.now().isoformat(),
            'config_source': self.config_path
        }
        
        return metadata
    
    def generate_subtask_id(self, parent_task_id: str, subtask_type: str, 
                           subtask_index: int) -> Dict[str, Any]:
        """
        Generate subtask ID linked to parent task
        
        Args:
            parent_task_id: Parent task ID
            subtask_type: Type of subtask
            subtask_index: Index of subtask
            
        Returns:
            Dictionary with subtask ID and metadata
        """
        # Extract parent components
        parent_parts = parent_task_id.split('_')
        
        # Generate subtask ID
        subtask_id = f"{parent_task_id}_{subtask_type}_{subtask_index}"
        
        metadata = {
            'subtask_id': subtask_id,
            'parent_task_id': parent_task_id,
            'subtask_type': subtask_type,
            'subtask_index': subtask_index,
            'full_timestamp': datetime.now().isoformat()
        }
        
        return metadata
    
    def _get_next_counter(self) -> int:
        """Get next counter value with wrap-around"""
        current = self.task_counter
        self.task_counter += 1
        
        # Wrap around if exceeds max
        if self.task_counter > self.max_counter:
            self.task_counter = 1
            
        return current
    
    def _generate_hash(self, data: str, algorithm: str = 'sha256', 
                      length: int = 8) -> str:
        """Generate hash from data"""
        data_bytes = data.encode('utf-8')
        
        if algorithm == 'sha256':
            hash_obj = hashlib.sha256(data_bytes)
        elif algorithm == 'md5':
            hash_obj = hashlib.md5(data_bytes)
        elif algorithm == 'sha1':
            hash_obj = hashlib.sha1(data_bytes)
        else:
            raise ValueError(f"Unsupported hash algorithm: {algorithm}")
        
        return hash_obj.hexdigest()[:length]
    
    def validate_task_id(self, task_id: str) -> bool:
        """
        Validate task ID format
        
        Args:
            task_id: Task ID to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not task_id:
            return False
            
        # Check prefix
        if not task_id.startswith('task_'):
            return False
            
        # Check parts
        parts = task_id.split('_')
        if len(parts) < 5:  # task + timestamp + workflow + hash + counter
            return False
            
        # Check timestamp format (YYYYMMDD_HHMMSS)
        timestamp_part = parts[1]
        if len(timestamp_part) != 15 or '_' not in timestamp_part:
            # Try without underscore
            if len(timestamp_part) != 14:
                return False
                
        # Check workflow type
        workflow_part = parts[2]
        valid_workflows = ['build', 'debug', 'review', 'plan']
        if workflow_part not in valid_workflows:
            return False
            
        # Check hash (hexadecimal)
        hash_part = parts[3]
        try:
            int(hash_part, 16)
        except ValueError:
            return False
            
        # Check counter (numeric)
        counter_part = parts[4]
        if not counter_part.isdigit():
            return False
            
        return True
    
    def parse_task_id(self, task_id: str) -> Dict[str, Any]:
        """
        Parse task ID into components
        
        Args:
            task_id: Task ID to parse
            
        Returns:
            Dictionary with parsed components
        """
        if not self.validate_task_id(task_id):
            raise ValueError(f"Invalid task ID format: {task_id}")
            
        parts = task_id.split('_')
        
        # Handle timestamp with or without underscore
        timestamp_part = parts[1]
        if '_' in timestamp_part:
            date_part, time_part = timestamp_part.split('_')
            timestamp = f"{date_part}_{time_part}"
        else:
            # Assume YYYYMMDDHHMMSS format
            timestamp = timestamp_part
            
        return {
            'task_id': task_id,
            'timestamp': timestamp,
            'workflow_type': parts[2],
            'hash': parts[3],
            'counter': int(parts[4]),
            'additional_parts': parts[5:] if len(parts) > 5 else []
        }


# Command-line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate task IDs for parallel execution')
    parser.add_argument('--workflow', required=True, 
                       choices=['BUILD', 'DEBUG', 'REVIEW', 'PLAN'],
                       help='Workflow type')
    parser.add_argument('--request', help='User request for deterministic hashing')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--validate', help='Validate a task ID')
    parser.add_argument('--parse', help='Parse a task ID')
    
    args = parser.parse_args()
    
    generator = TaskIDGenerator(args.config)
    
    if args.validate:
        is_valid = generator.validate_task_id(args.validate)
        print(f"Task ID '{args.validate}' is {'valid' if is_valid else 'invalid'}")
        exit(0 if is_valid else 1)
        
    elif args.parse:
        try:
            parsed = generator.parse_task_id(args.parse)
            print(json.dumps(parsed, indent=2))
        except ValueError as e:
            print(f"Error: {e}")
            exit(1)
            
    else:
        # Generate new task ID
        task_info = generator.generate_task_id(args.workflow, args.request)
        print(json.dumps(task_info, indent=2))