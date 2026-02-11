#!/usr/bin/env python3
"""
Context Contamination Detector for NSO Parallel Execution System

Scans for isolation violations in parallel execution:
1. Files without task ID prefixes
2. Cross-task references
3. Global memory modifications
4. Unauthorized directory access
"""

import os
import re
import json
import sys
import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple, Optional

class ContextContaminationDetector:
    """Detects and reports contamination in parallel task execution."""
    
    def __init__(self, config_path: str = ".opencode/config/task-isolation.yaml"):
        """Initialize detector with configuration."""
        self.config_path = config_path
        self.config = self._load_config()
        self.tasks_base = Path(self.config['directories']['base']) / self.config['directories']['tasks']
        self.global_memory = Path(self.config['directories']['base']) / self.config['directories']['memory']
        self.global_meta = Path(self.config['directories']['base']) / "00_meta"
        
        # Track contamination events
        self.contamination_events = []
        self.quarantined_files = []
        
        # Compile detection patterns
        self.detection_patterns = self._compile_detection_patterns()
        
    def _load_config(self) -> Dict:
        """Load task isolation configuration."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
                return config.get('task_isolation', {})
        except FileNotFoundError:
            print(f"Warning: Config file not found: {self.config_path}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict:
        """Return default configuration if config file missing."""
        return {
            'enabled': True,
            'strict_mode': False,
            'naming': {
                'task_prefix': 'task_',
                'required_patterns': ['{task_id}_', '_{task_id}.', 'global_']
            },
            'directories': {
                'base': '.opencode/context',
                'tasks': 'tasks',
                'memory': '01_memory'
            },
            'contamination': {
                'auto_quarantine': False,
                'alert_on_detection': True
            }
        }
    
    def _compile_detection_patterns(self) -> List[Dict]:
        """Compile regex patterns for contamination detection."""
        patterns = []
        
        # Pattern 1: Missing task ID in files
        patterns.append({
            'name': 'missing_task_id',
            'pattern': re.compile(r'^(?!.*task_[0-9]+_[0-9]+_[a-z]+_[a-f0-9]+_[0-9]+).*\.(md|json|txt|py|js|ts|yaml|yml)$'),
            'severity': 'high',
            'description': 'File missing task ID prefix'
        })
        
        # Pattern 2: Task ID in wrong context (cross-task reference)
        patterns.append({
            'name': 'cross_task_reference',
            'pattern': re.compile(r'task_([0-9]+)_([0-9]+)_([a-z]+)_([a-f0-9]+)_([0-9]+)'),
            'severity': 'medium',
            'description': 'Cross-task file reference'
        })
        
        # Pattern 3: Global memory modification
        patterns.append({
            'name': 'global_memory_modification',
            'pattern': re.compile(r'.*01_memory.*'),
            'severity': 'critical',
            'description': 'Modification of global memory'
        })
        
        # Pattern 4: Forbidden file names (from config)
        forbidden_patterns = self.config.get('naming', {}).get('forbidden_patterns', [])
        for pattern in forbidden_patterns:
            patterns.append({
                'name': f'forbidden_pattern_{pattern}',
                'pattern': re.compile(pattern),
                'severity': 'high',
                'description': f'Forbidden file pattern: {pattern}'
            })
        
        return patterns
    
    def scan_task_directory(self, task_id: str) -> List[Dict]:
        """
        Scan a specific task directory for contamination.
        
        Args:
            task_id: The task ID to scan
            
        Returns:
            List of contamination events found
        """
        task_dir = self.tasks_base / task_id
        if not task_dir.exists():
            return [{
                'type': 'directory_missing',
                'severity': 'warning',
                'message': f'Task directory not found: {task_dir}',
                'task_id': task_id,
                'timestamp': datetime.now().isoformat()
            }]
        
        contamination_events = []
        
        # Scan all files in task directory
        for root, dirs, files in os.walk(task_dir):
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(self.tasks_base)
                
                # Check each detection pattern
                for pattern_info in self.detection_patterns:
                    if pattern_info['pattern'].search(str(rel_path)):
                        # Check if this is a valid self-reference
                        if pattern_info['name'] == 'cross_task_reference':
                            match = pattern_info['pattern'].search(str(rel_path))
                            if match and match.group(0) == task_id:
                                continue  # Self-reference is OK
                        
                        event = {
                            'type': pattern_info['name'],
                            'severity': pattern_info['severity'],
                            'message': f'{pattern_info["description"]}: {rel_path}',
                            'task_id': task_id,
                            'file_path': str(file_path),
                            'pattern': pattern_info['pattern'].pattern,
                            'timestamp': datetime.now().isoformat()
                        }
                        contamination_events.append(event)
                        
                        # Auto-quarantine if enabled
                        if self.config.get('contamination', {}).get('auto_quarantine', False):
                            self._quarantine_file(file_path, event)
        
        return contamination_events
    
    def scan_all_tasks(self) -> Dict[str, List[Dict]]:
        """
        Scan all task directories for contamination.
        
        Returns:
            Dictionary mapping task_id -> contamination events
        """
        all_events = {}
        
        if not self.tasks_base.exists():
            return all_events
        
        # Get all task directories
        task_dirs = [d for d in self.tasks_base.iterdir() if d.is_dir()]
        
        for task_dir in task_dirs:
            task_id = task_dir.name
            events = self.scan_task_directory(task_id)
            if events:
                all_events[task_id] = events
        
        # Also scan global memory for task-specific files (shouldn't be there)
        global_events = self._scan_global_memory()
        if global_events:
            all_events['global_memory'] = global_events
        
        return all_events
    
    def _scan_global_memory(self) -> List[Dict]:
        """Scan global memory for task-specific files that shouldn't be there."""
        if not self.global_memory.exists():
            return []
        
        events = []
        task_id_pattern = re.compile(r'task_([0-9]+)_([0-9]+)_([a-z]+)_([a-f0-9]+)_([0-9]+)')
        
        for root, dirs, files in os.walk(self.global_memory):
            for file in files:
                file_path = Path(root) / file
                
                # Check if file has task ID but is in global memory
                if task_id_pattern.search(file):
                    events.append({
                        'type': 'task_file_in_global_memory',
                        'severity': 'high',
                        'message': f'Task-specific file in global memory: {file_path.relative_to(self.global_memory)}',
                        'file_path': str(file_path),
                        'timestamp': datetime.now().isoformat()
                    })
        
        return events
    
    def _quarantine_file(self, file_path: Path, event: Dict):
        """
        Quarantine a contaminated file by moving it to quarantine directory.
        
        Args:
            file_path: Path to contaminated file
            event: Contamination event details
        """
        quarantine_dir = self.tasks_base / 'quarantine'
        quarantine_dir.mkdir(exist_ok=True)
        
        # Create unique quarantine filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        quarantined_name = f"{timestamp}_{event['type']}_{file_path.name}"
        quarantine_path = quarantine_dir / quarantined_name
        
        try:
            # Move file to quarantine
            file_path.rename(quarantine_path)
            
            # Create quarantine manifest
            manifest = {
                'original_path': str(file_path),
                'quarantine_path': str(quarantine_path),
                'event': event,
                'quarantined_at': datetime.now().isoformat()
            }
            
            manifest_path = quarantine_dir / f"{quarantined_name}.manifest.json"
            with open(manifest_path, 'w') as f:
                json.dump(manifest, f, indent=2)
            
            self.quarantined_files.append({
                'original': str(file_path),
                'quarantined': str(quarantine_path),
                'manifest': str(manifest_path)
            })
            
            print(f"Quarantined: {file_path} -> {quarantine_path}")
            
        except Exception as e:
            print(f"Failed to quarantine {file_path}: {e}")
    
    def generate_report(self, events_by_task: Dict[str, List[Dict]]) -> Dict:
        """
        Generate a comprehensive contamination report.
        
        Args:
            events_by_task: Dictionary of contamination events by task
            
        Returns:
            Report dictionary
        """
        total_events = sum(len(events) for events in events_by_task.values())
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'warning': 0}
        
        for task_id, events in events_by_task.items():
            for event in events:
                severity = event.get('severity', 'medium')
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        report = {
            'scan_timestamp': datetime.now().isoformat(),
            'config_file': self.config_path,
            'tasks_scanned': len(events_by_task),
            'total_contamination_events': total_events,
            'severity_breakdown': severity_counts,
            'quarantined_files': len(self.quarantined_files),
            'detailed_findings': events_by_task,
            'recommendations': self._generate_recommendations(events_by_task, severity_counts)
        }
        
        return report
    
    def _generate_recommendations(self, events_by_task: Dict, severity_counts: Dict) -> List[str]:
        """Generate recommendations based on contamination findings."""
        recommendations = []
        
        if severity_counts.get('critical', 0) > 0:
            recommendations.append("CRITICAL: Immediate action required. Tasks with critical contamination should be terminated.")
        
        if severity_counts.get('high', 0) > 0:
            recommendations.append("HIGH: Review contaminated tasks. Consider isolation failure and potential rollback.")
        
        if events_by_task:
            recommendations.append(f"Found contamination in {len(events_by_task)} tasks. Review detailed findings.")
        
        if self.quarantined_files:
            recommendations.append(f"Auto-quarantined {len(self.quarantined_files)} files. Review quarantine directory.")
        
        if not events_by_task:
            recommendations.append("No contamination detected. Parallel isolation appears intact.")
        
        # Config-specific recommendations
        if not self.config.get('enabled', False):
            recommendations.append("Task isolation is disabled in config. Enable for parallel execution safety.")
        
        if not self.config.get('strict_mode', False):
            recommendations.append("Strict mode is disabled. Consider enabling for stronger isolation enforcement.")
        
        return recommendations
    
    def save_report(self, report: Dict, output_path: Optional[str] = None):
        """
        Save contamination report to file.
        
        Args:
            report: Report dictionary
            output_path: Optional output path (default: timestamped in tasks base)
        """
        if output_path is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = self.tasks_base / f"contamination_report_{timestamp}.json"
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"Report saved to: {output_path}")
        return output_path
    
    def cleanup_quarantine(self, days_old: int = 7):
        """
        Clean up old quarantined files.
        
        Args:
            days_old: Delete files older than this many days
        """
        quarantine_dir = self.tasks_base / 'quarantine'
        if not quarantine_dir.exists():
            return
        
        cutoff_time = datetime.now().timestamp() - (days_old * 24 * 60 * 60)
        
        deleted_files = []
        for item in quarantine_dir.iterdir():
            if item.stat().st_mtime < cutoff_time:
                try:
                    if item.is_file():
                        item.unlink()
                        deleted_files.append(item.name)
                except Exception as e:
                    print(f"Failed to delete {item}: {e}")
        
        if deleted_files:
            print(f"Cleaned up {len(deleted_files)} old quarantined files")
    
    def validate_task_id_format(self, task_id: str) -> bool:
        """
        Validate that a task ID follows the expected format.
        
        Args:
            task_id: Task ID to validate
            
        Returns:
            True if valid format
        """
        pattern = re.compile(r'^task_\d{8}_\d{6}_[a-z]+_[a-f0-9]{8}_\d+$')
        return bool(pattern.match(task_id))

def main():
    """Command-line interface for contamination detector."""
    import argparse
    
    parser = argparse.ArgumentParser(description='NSO Context Contamination Detector')
    parser.add_argument('--config', default='.opencode/config/task-isolation.yaml',
                       help='Path to task isolation config')
    parser.add_argument('--task', help='Scan specific task ID only')
    parser.add_argument('--all', action='store_true', help='Scan all tasks')
    parser.add_argument('--report', help='Output report file path')
    parser.add_argument('--cleanup', action='store_true', help='Clean up old quarantine files')
    parser.add_argument('--days', type=int, default=7, help='Days to keep quarantine files')
    
    args = parser.parse_args()
    
    detector = ContextContaminationDetector(args.config)
    
    if args.cleanup:
        detector.cleanup_quarantine(args.days)
        return
    
    if args.task:
        # Scan specific task
        events = detector.scan_task_directory(args.task)
        report_data = {args.task: events}
    elif args.all:
        # Scan all tasks
        report_data = detector.scan_all_tasks()
    else:
        # Default: scan all tasks
        report_data = detector.scan_all_tasks()
    
    # Generate report
    report = detector.generate_report(report_data)
    
    # Print summary
    print("\n" + "="*60)
    print("CONTAMINATION DETECTION REPORT")
    print("="*60)
    print(f"Scan Time: {report['scan_timestamp']}")
    print(f"Tasks Scanned: {report['tasks_scanned']}")
    print(f"Total Events: {report['total_contamination_events']}")
    print(f"Severity: {report['severity_breakdown']}")
    print(f"Quarantined: {report['quarantined_files']}")
    
    if report['total_contamination_events'] > 0:
        print("\n⚠️  CONTAMINATION DETECTED!")
        for task_id, events in report['detailed_findings'].items():
            if events:
                print(f"\nTask: {task_id}")
                for event in events[:5]:  # Show first 5 events per task
                    print(f"  [{event['severity'].upper()}] {event['message']}")
                if len(events) > 5:
                    print(f"  ... and {len(events) - 5} more events")
    else:
        print("\n✅ No contamination detected")
    
    print("\nRecommendations:")
    for rec in report['recommendations']:
        print(f"  • {rec}")
    
    # Save report if requested
    if args.report or report['total_contamination_events'] > 0:
        output_path = args.report or None
        saved_path = detector.save_report(report, output_path)
        print(f"\nFull report saved to: {saved_path}")
    
    # Exit with appropriate code
    if report['severity_breakdown'].get('critical', 0) > 0:
        sys.exit(2)  # Critical contamination
    elif report['total_contamination_events'] > 0:
        sys.exit(1)  # Contamination found
    else:
        sys.exit(0)  # Clean

if __name__ == '__main__':
    main()