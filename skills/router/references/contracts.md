# Router Contract Format

## Contract Structure (YAML)

```yaml
router_contract:
  status: IN_PROGRESS | COMPLETE | BLOCKED | NEEDS_REVIEW
  workflow: BUILD | DEBUG | REVIEW | PLAN
  intent: str                           # Original user intent
  tasks:
    - id: int
      description: str
      status: PENDING | IN_PROGRESS | COMPLETE | BLOCKED
      dependencies: list[int]           # Task IDs this task depends on
  memory_notes: str                     # Notes to add to memory (if any)
  next_action: str                      # What the agent should do next
```

## Initial Contract (At Router Start)

When the router creates a contract, it sets:

```yaml
router_contract:
  status: IN_PROGRESS
  workflow: [detected workflow]
  intent: "[user request]"
  tasks:
    - id: 1
      description: [task 1]
      status: PENDING
      dependencies: []
    - id: 2
      description: [task 2]
      status: PENDING
      dependencies: []
    ...
  memory_notes: ""
  next_action: "Start with Task 1"
```

## Agent Output Contract (After Completion)

When an agent completes a workflow, it updates:

```yaml
router_contract:
  status: COMPLETE | BLOCKED | NEEDS_REVIEW
  workflow: BUILD | DEBUG | REVIEW | PLAN
  tasks_completed: int
  tasks_total: int
  evidence:
    - type: test | review | verification
      result: PASS | FAIL
      details: str
    ...
  next_action: str                      # What to do next (or "none" if done)
```

## Validation Rules

- `status` must be one of: IN_PROGRESS, COMPLETE, BLOCKED, NEEDS_REVIEW
- `workflow` must match the selected workflow
- `tasks` must be a list of task objects with id, description, status, and dependencies
- `evidence` must contain at least one item if status is COMPLETE
- `intent` must be the original user request

## Example: Complete BUILD Workflow Contract

```yaml
router_contract:
  status: COMPLETE
  workflow: BUILD
  tasks_completed: 5
  tasks_total: 5
  evidence:
    - type: test
      result: PASS
      details: All 21 unit tests pass
    - type: verification
      result: PASS
      details: Validation harness passes
  next_action: "none"
```

## Example: Blocked DEBUG Workflow Contract

```yaml
router_contract:
  status: BLOCKED
  workflow: DEBUG
  tasks_completed: 2
  tasks_total: 6
  evidence:
    - type: verification
      result: FAIL
      details: Cannot reproduce issue in test environment
  next_action: "Request additional context from user"
```
