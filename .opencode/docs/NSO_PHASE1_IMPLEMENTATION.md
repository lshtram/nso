# NSO Phase 1 Implementation: Parallel Execution Fix

**Priority:** P0 (Critical)  
**Timeline:** Week 1-2  
**Status:** READY TO IMPLEMENT  
**Based on Research:** CrewAI parallel execution patterns, OAC approval gates, LangGraph state management

## Problem Statement

### Current Issues:
1. **Agent Hanging**: Agents sometimes hang during execution without timeout
2. **No Recovery**: Lost agent sessions without notification or recovery mechanism
3. **Sequential Limitation**: NSO uses sequential workflow, missing parallel execution benefits
4. **No Health Monitoring**: No heartbeat or health checking for agent processes

### Impact:
- Reduced agent reliability (~95% completion rate)
- User frustration with "lost" agents
- Inefficient execution for complex multi-agent tasks
- Difficulty debugging agent failures

## Solution Architecture

### Target Architecture:
```
User Request → Enhanced Router → Agent Queue → Parallel Executor → 
↓
Heartbeat Monitor → Timeout Handler → Recovery System → 
↓
Progress Tracking → Validation → Memory Update
```

### Key Components:

#### 1. Agent Execution Queue
- **Priority Management**: High/Medium/Low priority tasks
- **Queue Persistence**: Store queued tasks for recovery
- **Concurrency Control**: Configurable parallel execution limits
- **Task Dependencies**: Handle agent coordination dependencies

#### 2. Heartbeat Monitoring System
- **Regular Health Checks**: Configurable intervals (default: 30s)
- **Agent Status Tracking**: Running, idle, hung, completed
- **Resource Monitoring**: CPU, memory, token usage
- **Alert System**: Notify when agents exceed thresholds

#### 3. Timeout Handler with Recovery
- **Configurable Timeouts**: Per agent type and task complexity
- **Graceful Termination**: Save state before termination
- **Automatic Recovery**: Restart hung agents with preserved context
- **Failure Analysis**: Log timeout reasons for debugging

#### 4. State Preservation System
- **Checkpoint Mechanism**: Regular state snapshots
- **Context Preservation**: Save agent context for recovery
- **Progress Tracking**: Maintain task progress across restarts
- **Resume Capability**: Continue from last checkpoint

## Implementation Details

### Component 1: Agent Queue System

```python
# Pseudo-code for Agent Queue
class AgentExecutionQueue:
    def __init__(self, max_parallel=3):
        self.max_parallel = max_parallel
        self.running_agents = []  # Currently executing
        self.pending_queue = []   # Waiting to execute
        self.completed_tasks = [] # Finished tasks
        self.failed_tasks = []    # Failed with recovery info
        
    def submit_task(self, agent_type, task_data, priority="medium"):
        # Add task to queue with priority
        task = {
            'id': generate_uuid(),
            'agent_type': agent_type,
            'task_data': task_data,
            'priority': priority,
            'status': 'pending',
            'submitted_at': datetime.now()
        }
        self.pending_queue.append(task)
        self._reorder_by_priority()
        
    def _reorder_by_priority(self):
        # Order: High → Medium → Low, then FIFO within priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        self.pending_queue.sort(key=lambda x: (
            priority_order[x['priority']], 
            x['submitted_at']
        ))
```

### Component 2: Heartbeat Monitor

```python
class HeartbeatMonitor:
    def __init__(self, check_interval=30):
        self.check_interval = check_interval  # seconds
        self.agent_heartbeats = {}  # agent_id → last_heartbeat
        self.timeout_threshold = 120  # seconds
        
    def register_agent(self, agent_id):
        self.agent_heartbeats[agent_id] = {
            'last_heartbeat': datetime.now(),
            'status': 'running',
            'check_count': 0
        }
        
    def update_heartbeat(self, agent_id):
        if agent_id in self.agent_heartbeats:
            self.agent_heartbeats[agent_id]['last_heartbeat'] = datetime.now()
            self.agent_heartbeats[agent_id]['check_count'] += 1
            
    def check_health(self):
        current_time = datetime.now()
        hung_agents = []
        
        for agent_id, data in self.agent_heartbeats.items():
            time_since_heartbeat = (current_time - data['last_heartbeat']).total_seconds()
            
            if time_since_heartbeat > self.timeout_threshold:
                hung_agents.append({
                    'agent_id': agent_id,
                    'last_heartbeat': data['last_heartbeat'],
                    'time_since': time_since_heartbeat
                })
                data['status'] = 'hung'
                
        return hung_agents
```

### Component 3: Timeout Handler & Recovery

```python
class TimeoutHandler:
    def __init__(self, queue, heartbeat_monitor):
        self.queue = queue
        self.heartbeat_monitor = heartbeat_monitor
        self.recovery_attempts = {}  # agent_id → attempt_count
        
    def handle_timeout(self, hung_agent):
        agent_id = hung_agent['agent_id']
        
        # Check recovery attempts
        attempts = self.recovery_attempts.get(agent_id, 0)
        if attempts >= 3:  # Max 3 recovery attempts
            self._mark_permanent_failure(agent_id)
            return
            
        # Save current state for recovery
        state = self._capture_agent_state(agent_id)
        
        # Terminate hung agent
        self._terminate_agent(agent_id)
        
        # Restart with saved state
        self._restart_agent(agent_id, state)
        
        # Update recovery attempts
        self.recovery_attempts[agent_id] = attempts + 1
        
    def _capture_agent_state(self, agent_id):
        # Capture agent context, progress, and intermediate results
        return {
            'agent_id': agent_id,
            'captured_at': datetime.now(),
            'context': get_agent_context(agent_id),
            'progress': get_agent_progress(agent_id),
            'intermediate_results': get_intermediate_results(agent_id)
        }
```

### Component 4: State Preservation

```python
class StatePreservationSystem:
    def __init__(self, checkpoint_interval=60):
        self.checkpoint_interval = checkpoint_interval  # seconds
        self.checkpoints = {}  # agent_id → list of checkpoints
        self.max_checkpoints = 10  # Keep last 10 checkpoints
        
    def create_checkpoint(self, agent_id, state_data):
        checkpoint = {
            'id': generate_uuid(),
            'agent_id': agent_id,
            'timestamp': datetime.now(),
            'state': state_data,
            'sequence': len(self.checkpoints.get(agent_id, []))
        }
        
        # Initialize if needed
        if agent_id not in self.checkpoints:
            self.checkpoints[agent_id] = []
            
        # Add checkpoint
        self.checkpoints[agent_id].append(checkpoint)
        
        # Maintain max checkpoints
        if len(self.checkpoints[agent_id]) > self.max_checkpoints:
            self.checkpoints[agent_id] = self.checkpoints[agent_id][-self.max_checkpoints:]
            
        return checkpoint['id']
        
    def get_latest_checkpoint(self, agent_id):
        if agent_id in self.checkpoints and self.checkpoints[agent_id]:
            return self.checkpoints[agent_id][-1]
        return None
```

## Integration with Existing NSO

### 1. Modified Oracle Workflow:

```yaml
Current: User → Oracle → Router → Workflow → Agent → Tools
Target:  User → Oracle → Enhanced Router → Approval → Agent Queue → Parallel Agents
```

### 2. Enhanced Router Changes:
- Add parallel execution detection
- Determine optimal agent concurrency
- Queue management integration
- Progress tracking hooks

### 3. Agent Interface Updates:
```python
class EnhancedAgent:
    def __init__(self, agent_id):
        self.agent_id = agent_id
        self.heartbeat_monitor = None
        self.state_preservation = None
        
    def execute(self, task):
        # Register with heartbeat monitor
        self.heartbeat_monitor.register_agent(self.agent_id)
        
        # Create initial checkpoint
        self.state_preservation.create_checkpoint(self.agent_id, {
            'task': task,
            'start_time': datetime.now()
        })
        
        # Execute with regular heartbeats
        try:
            result = self._execute_with_heartbeats(task)
            
            # Final checkpoint
            self.state_preservation.create_checkpoint(self.agent_id, {
                'task': task,
                'result': result,
                'end_time': datetime.now(),
                'status': 'completed'
            })
            
            return result
            
        except Exception as e:
            # Error checkpoint
            self.state_preservation.create_checkpoint(self.agent_id, {
                'task': task,
                'error': str(e),
                'end_time': datetime.now(),
                'status': 'failed'
            })
            raise
            
    def _execute_with_heartbeats(self, task):
        # Implementation with regular heartbeat updates
        for step in task_steps:
            # Update heartbeat
            self.heartbeat_monitor.update_heartbeat(self.agent_id)
            
            # Create checkpoint at major steps
            if step.is_major:
                self.state_preservation.create_checkpoint(self.agent_id, {
                    'step': step.name,
                    'progress': step.progress
                })
                
            # Execute step
            step.execute()
```

## Configuration Settings

### Agent Configuration File:
```yaml
# .opencode/config/agent-config.yaml
parallel_execution:
  max_parallel_agents: 3
  default_priority: medium
  
heartbeat_monitoring:
  check_interval: 30  # seconds
  timeout_threshold: 120  # seconds
  max_recovery_attempts: 3
  
state_preservation:
  checkpoint_interval: 60  # seconds
  max_checkpoints_per_agent: 10
  preserve_on_failure: true
  
logging:
  health_check_logs: true
  timeout_details: true
  recovery_attempts: true
  
performance:
  enable_resource_monitoring: true
  cpu_threshold: 80  # percent
  memory_threshold: 512  # MB
```

## Testing Strategy

### Unit Tests:
1. **Queue Management Tests**: Priority ordering, concurrency limits
2. **Heartbeat Tests**: Health checking, timeout detection
3. **Recovery Tests**: State capture, agent restart
4. **State Preservation Tests**: Checkpoint creation, retrieval

### Integration Tests:
1. **Multi-Agent Workflow**: Parallel execution of BUILD workflow
2. **Timeout Recovery**: Simulate agent hang, verify recovery
3. **Resource Exhaustion**: Test with limited resources
4. **Complex Dependencies**: Agent coordination with dependencies

### Performance Tests:
1. **Scalability**: Varying numbers of parallel agents
2. **Resource Usage**: CPU/memory monitoring accuracy
3. **Recovery Time**: Time to detect and recover from failures
4. **Throughput**: Tasks completed per hour

## Success Metrics

### Phase 1 Success Criteria:
- **Agent Completion Rate**: ≥99.9% (from current ~95%)
- **Timeout Detection**: <60 seconds to detect hung agents
- **Recovery Success**: ≥95% successful agent recovery
- **Parallel Speed**: 2x faster for multi-agent workflows
- **Memory Overhead**: <10% additional memory usage

### Monitoring Dashboard:
```yaml
metrics_to_track:
  - agent_completion_rate
  - average_execution_time
  - timeout_events_count
  - recovery_success_rate
  - parallel_utilization
  - resource_usage_cpu
  - resource_usage_memory
```

## Rollout Plan

### Week 1: Core Implementation
1. **Day 1-2**: Agent Queue System implementation
2. **Day 3-4**: Heartbeat Monitoring implementation
3. **Day 5**: Basic integration testing

### Week 2: Enhanced Features
4. **Day 6-7**: Timeout Handler & Recovery System
5. **Day 8-9**: State Preservation System
6. **Day 10**: Comprehensive testing and validation

### Week 3: Integration & Optimization
7. **Day 11-12**: Integration with existing NSO workflows
8. **Day 13-14**: Performance optimization and tuning
9. **Day 15**: Final validation and deployment

## Risk Mitigation

### Technical Risks:
1. **Increased Complexity**: Start with minimal viable implementation
2. **Resource Overhead**: Monitor and optimize resource usage
3. **Integration Issues**: Test incrementally with existing workflows
4. **State Corruption**: Implement validation for preserved state

### Mitigation Strategies:
- **Incremental Rollout**: Deploy to test environment first
- **Feature Flags**: Enable/disable features via configuration
- **Rollback Plan**: Quick reversion to sequential mode if needed
- **Monitoring**: Extensive logging and alerting

## Next Steps

1. **Immediate Action**: Begin implementation of Agent Queue System
2. **Parallel Task**: Create test suite for parallel execution
3. **Documentation**: Update agent developer guide with new patterns
4. **Training**: Create guide for using enhanced parallel features

## References

1. **CrewAI Parallel Patterns**: Role-based agent coordination
2. **OAC Approval Gates**: Plan presentation before execution  
3. **LangGraph State Management**: Checkpoint and recovery mechanisms
4. **NSO Current Architecture**: Integration requirements

**Status**: READY FOR IMPLEMENTATION
**Assigned To**: Builder agent with Oracle oversight
**Start Date**: Immediate