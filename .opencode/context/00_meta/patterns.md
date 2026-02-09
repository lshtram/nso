# Patterns & Conventions

## Code Style

### JavaScript/React
- Use functional components with hooks
- Prefer const over let
- Use arrow functions for callbacks
- Use template literals for string interpolation

### File Naming
- Components: PascalCase (e.g., `NewsCard.jsx`)
- Hooks: camelCase with "use" prefix (e.g., `useNews.js`)
- Utilities: camelCase (e.g., `apiClient.js`)

### Component Structure
```jsx
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Export default
```

## Git Workflow

- **Feature branches:** `feature/description`
- **Bug fixes:** `fix/description`
- **Commits:** Conventional commits (feat, fix, docs, etc.)

## State Management

- Use React built-in hooks for local state
- Use context for global state when needed

## API Integration

- RESTful API patterns
- Async/await for async operations
- Error handling with try/catch

## NSO Multi-Agent Patterns

### Parallel Execution
- Oracle coordinates all workflows (Discovery → Architecture → Implementation → Validation → Closure)
- Parallel phases: Builder + Janitor + Designer work simultaneously during Implementation
- Sequential phases: Discovery, Architecture, Validation, Closure (require coordination)

### Task Isolation
- All files during parallel execution must have `{{task_id}}_` prefix
- Each agent works in isolated directory: `.opencode/context/active_tasks/{{task_id}}/`
- Contract system: contract.md → agent work → status.md → result.md
- Question protocol: agent writes questions.md and STOPS if unclear

### Fallback Mechanisms
- Agent timeout (>5 min) → Sequential fallback + user notification
- Questions loop (>3 iterations) → Escalate to user
- Contamination detected → Quarantine files + notify
- Resource exhaustion → Pause parallel execution
- Always notify user on fallback (reliability > speed)

### Workflow Triggers
- **BUILD:** "build", "implement", "create", "develop", "add"
- **DEBUG:** "fix", "debug", "investigate", "troubleshoot"
- **REVIEW:** "review", "audit", "analyze", "check", "validate"
- **PLAN:** "plan", "design", "research", "evaluate"

### Best Practices
- Be explicit in requests (mention code, tests, UI, docs separately)
- Complete one workflow before starting another
- Approve architecture before implementation
- Let Oracle coordinate (don't micromanage agents)
- Trust fallback mechanisms (they ensure reliability)
