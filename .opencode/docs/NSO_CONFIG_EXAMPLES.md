# NSO Configuration Examples

**Version:** 1.0.0  
**Last Updated:** 2026-02-09

---

## Overview

This document provides configuration examples for different project types and use cases.

---

## Configuration Files

### 1. Task Isolation Config
**File:** `.opencode/config/task-isolation.yaml`

```yaml
# Task ID Generation
task_id:
  format: "task_{timestamp}_{workflow}_{hash}_{counter}"
  timestamp_format: "%Y%m%d_%H%M%S"
  hash:
    algorithm: "sha256"  # sha256, md5, sha1
    length: 8
  counter:
    start: 1
    max: 9999

# File Naming Enforcement
file_naming:
  require_task_id_prefix: true
  allowed_exceptions:
    - "contract.md"
    - "status.md"
    - "result.md"
    - "questions.md"
  
# Contamination Detection
contamination:
  enabled: true
  scan_interval_seconds: 30
  auto_quarantine: false  # Ask user before moving files

# Task Context Paths
paths:
  active_tasks: ".opencode/context/active_tasks"
  global_memory: ".opencode/context/01_memory"
  global_meta: ".opencode/context/00_meta"
```

### 2. Parallel Execution Config
**File:** `.opencode/config/parallel-config.yaml`

```yaml
# Parallel Execution Settings
parallel:
  enabled: true
  max_concurrent_tasks: 5
  max_concurrent_agents_per_task: 3
  
  # Timeouts
  timeouts:
    agent_start_seconds: 30
    agent_status_update_seconds: 300  # 5 minutes
    questions_loop_max_iterations: 3
    
  # Fallback Strategy
  fallback:
    auto_fallback_on_timeout: true
    auto_fallback_on_crash: true
    auto_fallback_on_contamination: false  # Require user decision
    notify_user: true
    
  # Resource Limits
  resources:
    max_memory_percent: 90
    max_disk_percent: 90
    pause_on_resource_exhaustion: true

# Agent Priorities (higher = more important)
agent_priorities:
  janitor: 100  # Bugs are urgent
  builder: 90
  oracle: 80
  designer: 70
  scout: 60
  librarian: 50

# Workflow Configurations
workflows:
  BUILD:
    parallel_phases: ["IMPLEMENTATION"]
    sequential_phases: ["DISCOVERY", "ARCHITECTURE", "VALIDATION", "CLOSURE"]
    estimated_speedup: 2.5
    
  DEBUG:
    parallel_phases: ["INVESTIGATION", "FIX"]
    sequential_phases: ["VALIDATION", "CLOSURE"]
    estimated_speedup: 2.0
    
  REVIEW:
    parallel_phases: ["ANALYSIS"]
    sequential_phases: ["SCOPE", "REPORT", "CLOSURE"]
    estimated_speedup: 2.0
```

---

## Example Configurations by Project Type

### Small Project (Solo Developer)
**Use Case:** Personal projects, prototypes, small apps

```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 2  # Limited resources
  max_concurrent_agents_per_task: 2  # Keep it simple
  
  timeouts:
    agent_start_seconds: 45  # Slower machine
    agent_status_update_seconds: 600  # 10 minutes (complex tasks)
    
  fallback:
    auto_fallback_on_timeout: true
    notify_user: true
    
workflows:
  BUILD:
    parallel_phases: ["IMPLEMENTATION"]  # Just Builder + Janitor
    estimated_speedup: 1.8  # Conservative
```

### Medium Project (Small Team)
**Use Case:** Startups, team projects, production apps

```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 5
  max_concurrent_agents_per_task: 3  # Builder + Janitor + Designer
  
  timeouts:
    agent_start_seconds: 30
    agent_status_update_seconds: 300
    
  fallback:
    auto_fallback_on_timeout: true
    notify_user: true
    
workflows:
  BUILD:
    parallel_phases: ["IMPLEMENTATION"]
    sequential_phases: ["DISCOVERY", "ARCHITECTURE", "VALIDATION", "CLOSURE"]
    estimated_speedup: 2.5
```

### Large Project (Enterprise)
**Use Case:** Large codebases, multiple teams, strict quality gates

```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 10  # More resources available
  max_concurrent_agents_per_task: 4  # Include Scout for research
  
  timeouts:
    agent_start_seconds: 30
    agent_status_update_seconds: 180  # Faster feedback
    questions_loop_max_iterations: 2  # Stricter (requirements should be clear)
    
  fallback:
    auto_fallback_on_timeout: true
    auto_fallback_on_contamination: true  # Auto-quarantine
    notify_user: true
    
  resources:
    max_memory_percent: 85  # Leave more headroom
    max_disk_percent: 85
    
workflows:
  BUILD:
    parallel_phases: ["IMPLEMENTATION"]
    sequential_phases: ["DISCOVERY", "ARCHITECTURE", "VALIDATION", "CLOSURE"]
    estimated_speedup: 3.0  # More agents
    
  REVIEW:
    parallel_phases: ["ANALYSIS"]
    sequential_phases: ["SCOPE", "REPORT", "CLOSURE"]
    estimated_speedup: 2.5  # Thorough reviews
```

---

## Special Use Cases

### 1. CI/CD Integration (Automated Workflows)
**Scenario:** Running NSO in CI pipeline

```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 3  # Limited CI resources
  max_concurrent_agents_per_task: 2
  
  timeouts:
    agent_start_seconds: 60  # CI can be slower
    agent_status_update_seconds: 120  # Faster timeout for automation
    questions_loop_max_iterations: 1  # No user to answer, fail fast
    
  fallback:
    auto_fallback_on_timeout: true
    auto_fallback_on_crash: true
    auto_fallback_on_contamination: true
    notify_user: false  # Log only
    
workflows:
  REVIEW:  # Focus on automated code review
    parallel_phases: ["ANALYSIS"]
    sequential_phases: ["SCOPE", "REPORT"]
    estimated_speedup: 2.0
```

### 2. High-Reliability Mode (Safety First)
**Scenario:** Critical production systems, high-risk changes

```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: false  # Disable parallel (sequential only)
  
# OR keep parallel but with strict limits:
parallel:
  enabled: true
  max_concurrent_tasks: 1  # Effectively sequential
  max_concurrent_agents_per_task: 1
  
  fallback:
    auto_fallback_on_timeout: false  # Require user decision
    auto_fallback_on_crash: false
    auto_fallback_on_contamination: false
    notify_user: true

workflows:
  BUILD:
    parallel_phases: []  # All sequential
    sequential_phases: ["DISCOVERY", "ARCHITECTURE", "IMPLEMENTATION", "VALIDATION", "CLOSURE"]
    estimated_speedup: 1.0  # No speedup
```

### 3. Rapid Prototyping (Speed Prioritized)
**Scenario:** Hackathons, proof-of-concepts, experiments

```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 10  # Go fast
  max_concurrent_agents_per_task: 4  # All agents
  
  timeouts:
    agent_start_seconds: 20  # Fast fail
    agent_status_update_seconds: 180
    questions_loop_max_iterations: 1  # Don't wait
    
  fallback:
    auto_fallback_on_timeout: true  # Keep moving
    auto_fallback_on_crash: true
    auto_fallback_on_contamination: true  # Auto-fix
    notify_user: true

workflows:
  BUILD:
    parallel_phases: ["IMPLEMENTATION", "VALIDATION"]  # Even validation in parallel
    sequential_phases: ["DISCOVERY", "ARCHITECTURE"]
    estimated_speedup: 3.5  # Maximum parallelism
```

---

## Environment-Specific Configs

### Development Environment
```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 5
  
  timeouts:
    agent_start_seconds: 30
    agent_status_update_seconds: 600  # Developers may pause/debug
    
  fallback:
    notify_user: true  # Verbose feedback
    
contamination:
  enabled: true
  auto_quarantine: false  # Developer investigates
```

### Staging Environment
```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 3  # Match prod resources
  
  timeouts:
    agent_start_seconds: 30
    agent_status_update_seconds: 300
    
  fallback:
    auto_fallback_on_timeout: true
    notify_user: true
    
contamination:
  enabled: true
  auto_quarantine: true  # Automatic cleanup
```

### Production Environment
```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: false  # Safety first in production
  
# OR very conservative settings:
parallel:
  enabled: true
  max_concurrent_tasks: 1
  
  timeouts:
    agent_start_seconds: 60
    agent_status_update_seconds: 600
    questions_loop_max_iterations: 0  # No questions, fail if unclear
    
  fallback:
    auto_fallback_on_timeout: false  # Require approval
    notify_user: true
```

---

## Agent-Specific Configurations

### Enable/Disable Specific Agents
```yaml
# .opencode/config/parallel-config.yaml
agents:
  builder:
    enabled: true
    max_parallel_instances: 3
    
  janitor:
    enabled: true
    max_parallel_instances: 2
    
  designer:
    enabled: true  # Disable if no UI work
    max_parallel_instances: 1
    
  scout:
    enabled: false  # Disable if no external research needed
    max_parallel_instances: 1
    
  librarian:
    enabled: true
    max_parallel_instances: 1  # Only one memory manager
    
  oracle:
    enabled: true
    max_parallel_instances: 1  # Only one coordinator
```

---

## Configuration Validation

### Check Your Config
```bash
# Validate config files
python3 ~/.config/opencode/nso/scripts/validate_config.py

# Expected output:
✅ task-isolation.yaml valid
✅ parallel-config.yaml valid
✅ No conflicts detected
```

### Test Configuration
```bash
# Dry-run with current config
python3 ~/.config/opencode/nso/scripts/test_parallel_config.py --dry-run

# Expected output:
Config loaded:
  Max concurrent tasks: 5
  Max agents per task: 3
  Timeouts: 30s start, 300s update
  Fallback: Auto (timeout, crash)
  
Simulating workflow: BUILD
  Parallel phases: IMPLEMENTATION
  Estimated speedup: 2.5x
  
✅ Configuration valid for this workflow
```

---

## Recommended Defaults

### For Most Projects
```yaml
# .opencode/config/parallel-config.yaml
parallel:
  enabled: true
  max_concurrent_tasks: 5
  max_concurrent_agents_per_task: 3
  
  timeouts:
    agent_start_seconds: 30
    agent_status_update_seconds: 300
    questions_loop_max_iterations: 3
    
  fallback:
    auto_fallback_on_timeout: true
    auto_fallback_on_crash: true
    auto_fallback_on_contamination: false
    notify_user: true
```

**This balances:**
- ⚡ Speed (up to 3 agents in parallel)
- 🔒 Safety (automatic fallback, user notifications)
- 🎯 Reliability (reasonable timeouts, question loops)

---

## Next Steps

- **Quick Start:** [HOW_TO_USE_NSO_PARALLEL.md](./HOW_TO_USE_NSO_PARALLEL.md)
- **Troubleshooting:** [NSO_TROUBLESHOOTING.md](./NSO_TROUBLESHOOTING.md)
- **Best Practices:** [NSO_BEST_PRACTICES.md](./NSO_BEST_PRACTICES.md)
