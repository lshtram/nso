# Multi-Agent Orchestration: Our System vs. Industry Frameworks

> **Latest Update**: Added git worktree support with file-based messaging (2026-01-30)

A comprehensive comparison of orchestration patterns, async behavior, and context isolation across leading frameworks.

## Frameworks Compared

| Framework | Author | Primary Language | OpenCode-based |
|-----------|--------|------------------|----------------|
| **Our System** | Custom | JavaScript/Node.js | ✅ Yes |
| **Gastown** | Steve Yegge | Go | ✅ Yes (Claude Code) |
| **AutoGen** | Microsoft | Python | ❌ No (LLM-agnostic) |
| **CrewAI** | CrewAI Inc. | Python | ❌ No (LLM-agnostic) |
| **LangGraph** | LangChain | Python | ❌ No (LLM-agnostic) |

---

## 1. Async Behavior & Non-Blocking

### The Core Question
> Can the primary agent continue interacting with the user while subagents work?

### Comparison Table

| Framework | Non-Blocking Spawn | Async Result Collection | User Can Continue |
|-----------|-------------------|------------------------|-------------------|
| **Our System** | ✅ Yes (detached processes) | ✅ File-based polling | ✅ Yes |
| **Gastown** | ✅ Yes (tmux panes) | ✅ Hooks + convoy tracking | ✅ Yes |
| **AutoGen** | ✅ `asyncio.create_task()` | ✅ `asyncio.Queue` / `TaskResult` | ✅ Yes |
| **CrewAI** | ✅ `async_execution=True` | ✅ `AsyncResult.get()` | ✅ Yes |
| **LangGraph** | ✅ `await app.ainvoke()` | ✅ Shared state schema | ✅ Yes |

### Code Examples

#### Our System (File-Based Async)
```javascript
function spawnAsync(agentName, taskPrompt, outputFile) {
  const cmd = `opencode task '${JSON.stringify(taskConfig)}' > ${outputFile} 2>&1`;
  spawn('bash', ['-c', cmd], { detached: true });
  return outputFile;  // Agent continues immediately
}

// Usage - agent can respond to user
const files = [
  spawnAsync("code-review", taskA, "/tmp/result-a.json"),
  spawnAsync("code-review", taskB, "/tmp/result-b.json")
];
user.sendMessage("I've spawned 2 reviewers. Want to see progress?");
```

#### Gastown (Tmux Panes + Hooks)
```bash
# Mayor spawns agents in tmux panes - non-blocking
gt sling gt-abc12 myproject  # Agent runs in separate pane
# Mayor can immediately respond
```

#### AutoGen (Asyncio)
```python
import asyncio
from autogen_agentchat.agents import AssistantAgent

async def run_multiple():
    agent1 = AssistantAgent(name="reviewer1", model_client=client)
    agent2 = AssistantAgent(name="reviewer2", model_client=client)
    
    # Non-blocking spawn
    task1 = asyncio.create_task(agent1.run("Review file A"))
    task2 = asyncio.create_task(agent2.run("Review file B"))
    
    # Can do other work here
    
    # Collect results later
    results = await asyncio.gather(task1, task2)
    return results

# AsyncResult object for later collection
result = await crew.kickoff_async(inputs)
final_output = result.get()
```

#### LangGraph (State Graph with Async)
```python
from langgraph.graph import StateGraph

async def run_parallel():
    graph = StateGraph(State)
    graph.add_node("agent1", review_agent_1)
    graph.add_node("agent2", review_agent_2)
    graph.add_edge(START, "agent1")
    graph.add_edge(START, "agent2")
    
    app = graph.compile()
    
    # Non-blocking invoke
    result = await app.ainvoke(initial_state)
    return result
```

---

## 2. Context Isolation

### Question
> Does each subagent inherit parent context, or start with a clean slate?

### Comparison Table

| Framework | Clean Slate | Inherited Context | Isolation Method |
|-----------|-------------|-------------------|------------------|
| **Our System** | ✅ Yes | ❌ None | Separate processes |
| **Gastown** | ✅ Yes | ❌ None | Git worktree hooks |
| **AutoGen** | Configurable | Default | Runtime configuration |
| **CrewAI** | Configurable | Default | Agent creation options |
| **LangGraph** | ✅ Yes | ❌ None | Graph state immutability |

### Analysis

#### Our System
- **True isolation**: Spawns `opencode task "..."` as separate OS process
- No parent history, no parent MCPs, no parent state
- Each agent gets fresh session

#### Gastown
- **Hook-based persistence**: State stored in git worktrees
- Agents don't inherit Mayor's context
- Each "polecat" (worker) is ephemeral and clean

#### AutoGen
- **Hybrid**: Can configure `include_oracle=True/False`
- Default inherits conversation history
- Can pass custom system message

#### CrewAI
- **Role-based**: Each agent has its own role description
- But can share memory if configured (`share_crew_memory=True`)

#### LangGraph
- **State isolation**: Each node receives immutable state copy
- Parallel nodes wait (BSP model) but don't share state

---

## 3. Architecture Patterns

### Our System
```
User → Primary Agent → spawn() → [Subagent 1, Subagent 2, Subagent 3]
         ↓                                    ↓
   Responds to user              Write results to files
         ↓                                    ↓
   Polls for results      ←       Primary collects later
```

### Gastown
```
User → The Mayor (orchestrator) → Convoys (work tracking)
         ↓                              ↓
   Coordinates agents           Hooks (persistent storage)
         ↓                              ↓
   Spawns polecats        ←       Polecats complete work
```

### AutoGen
```
Agent1 ↔ Agent2 ↔ Agent3  (conversation-based)
         ↓
GroupChat Manager coordinates
         ↓
External collection via Queue
```

### CrewAI
```
                    Crew (orchestrator)
                         ↓
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
     Agent1          Agent2          Agent3
        ↓                ↓                ↓
     Task1           Task2           Task3
        └────────────────┼────────────────┘
                         ↓
                  AsyncResult
```

### LangGraph
```
    ┌─────────────────────────────────────┐
    │         StateGraph                  │
    │  ┌───────┐     ┌───────┐           │
    │  │Node A │ ──→ │Node B │           │
    │  └───────┘     └───────┘           │
    │      ↓               ↓              │
    │  ┌───────┐     ┌───────┐           │
    │  │Node C │ ←── │Node D │           │
    │  └───────┘     └───────┘           │
    └─────────────────────────────────────┘
              ↓
        Compiled app
        (async invoke)
```

---

## 4. Result Collection Patterns

### Our System: File-Based
```javascript
// Subagent writes to file
// /tmp/result-{session}.json

// Primary polls
async function collectResults(files) {
  const results = [];
  for (const file of files) {
    if (existsSync(file)) {
      results.push(JSON.parse(readFileSync(file)));
    }
    await sleep(1000);  // Poll interval
  }
  return results;
}
```

### Gastown: Hooks + Convoy
```bash
gt convoy create "Review" gt-abc12 gt-def34
gt sling gt-abc12 myproject
gt convoy list  # Track progress
gt hook show gt-abc12  # Get results
```

### AutoGen: Message Queue
```python
from asyncio import Queue

queue = Queue()

async def collector():
    while not queue.empty():
        result = await queue.get()
        results.append(result.value)

# Agents publish to queue
await runtime.publish_message(FinalResult("done"), DefaultTopicId())

# Collect non-blocking
collector()
```

### CrewAI: AsyncResult
```python
result = await crew.kickoff_async(inputs)

# Non-blocking - can check status
while not result.done():
    await sleep(1)

final = result.get()
```

### LangGraph: Shared State
```python
# State is passed through graph
result = await app.ainvoke({"messages": []})

# All nodes contribute to state
# Final state contains all results
print(result["final_output"])
```

---

## 5. Skill/MCP Control

### Our System
- **Explicit**: List MCPs in `agent.json`
- **Prompt-based**: Embed "YOUR MCP ACCESS" in prompt
- **Skills**: `load_skills` parameter

```json
{
  "name": "code-review",
  "mcp": ["filesystem"],
  "skills": ["security-audit", "pattern-enforcement"]
}
```

### Gastown
- **Runtime-based**: Each rig configures its runtime
- **Claude hooks**: `.claude/settings.json` for mail injection
- **Manual**: `gt config agent set`

```json
{
  "runtime": {
    "provider": "claude",
    "command": "claude"
  }
}
```

### AutoGen
- **Model client**: Inject specific model/endpoint
- **Tools**: Register custom tools per agent
- **Code execution**: Optional code agent config

```python
agent = AssistantAgent(
    name="code_reviewer",
    model_client=OpenAIChatCompletionClient(model="gpt-4o"),
    tools=[security_scanner, code_analyzer]
)
```

### CrewAI
- **Role description**: Defines agent's perspective
- **Backstory**: Additional context
- **Tools**: Attach task-specific tools

```python
agent = Agent(
    role="Security Auditor",
    backstory="Expert in finding vulnerabilities",
    tools=[security_scan_tool, dependency_checker]
)
```

### LangGraph
- **Node functions**: Each node is a function
- **Tool nodes**: Specialized for tool calling
- **State schema**: Defines available data

```python
def review_agent(state: State) -> State:
    # Access state.tools, state.messages
    return state
```

---

## 6. Cost Control & Concurrency

### Our System
- Manual via script logic
- No built-in limits
- Process-based (OS-level)

### Gastown
- No built-in cost controls
- Per-rig runtime configuration
- Manual agent management

### AutoGen
- Token usage tracking in `TaskResult`
- No built-in limits
- Custom implementation required

### CrewAI
- No built-in cost limits
- `max_revisions` for iterations
- `verbose` for logging costs

### LangGraph
- No built-in cost controls
- State-based token tracking possible
- Custom middleware required

### Oh-My-OpenCode (Bonus)
- Built-in concurrency limits:

```json
{
  "background_task": {
    "modelConcurrency": {
      "anthropic/claude-opus-4-5": 2,
      "google/gemini-3-flash": 10
    }
  }
}
```

---

## 7. Summary Comparison Matrix

| Feature | Our System | Gastown | AutoGen | CrewAI | LangGraph |
|---------|-----------|---------|---------|--------|-----------|
| **OpenCode-native** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **True isolation** | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| **Non-blocking** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Async results** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Visual UI** | ❌ | ✅ (tmux) | ❌ | ❌ | ❌ |
| **Cost controls** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Complexity** | Low | High | Medium | Medium | High |
| **Dependencies** | None | Go, git | Python | Python | Python |
| **Learning curve** | Low | High | Medium | Medium | High |
| **Persistence** | Files | Git hooks | Optional | Memory | State |
| **Scalability** | Manual | 20-30 agents | High | High | Very high |

---

## 8. Key Insights

### For Your Use Case (OpenCode + Minimal Context + True Isolation)

**Our System** matches best because:
1. ✅ True isolation via separate processes
2. ✅ No dependencies (just Node.js)
3. ✅ Full control over MCPs and skills
4. ✅ Simple async via file polling

### If You Need More Features

**Gastown** if:
- You want built-in work tracking (convoys, beads)
- You need tmux visualization
- You're already using Claude Code heavily

**AutoGen** if:
- You want conversation-based agent interaction
- You need Python ecosystem integration
- You're building research/prototype systems

**CrewAI** if:
- You want structured team hierarchies
- You need role-based agents
- You're comfortable with Python

**LangGraph** if:
- You need complex state machines
- You want graph-based workflows
- You're building production AI applications

---

## 9. Async Patterns Reference

### Our System Pattern
```javascript
// Spawn detached, poll files
spawnAsync(name, task, outputFile)
 → { detached: true, stdio: 'pipe' }
while (!fileExists(results[i])) sleep(1000)
readFileSync(results[i])
```

### AutoGen Pattern
```python
# asyncio-based
task = asyncio.create_task(agent.run(msg))
# Continue working
await task  # Get result
```

### CrewAI Pattern
```python
# AsyncResult pattern
result = await crew.kickoff_async(inputs)
while not result.done(): await sleep(1)
final = result.get()
```

### LangGraph Pattern
```python
# State passing
result = await app.ainvoke(initial_state)
# State contains all node outputs
return result
```

---

## 10. Git Worktree Integration (Optional)

We support **optional git worktree isolation** - orchestrator decides per task.

### Design: Orchestrator Decides

```
Task arrives
    ↓
Orchestrator checks: need worktree?
    ↓
   Yes ──→ Create worktree, spawn agent there (isolated, version-controlled)
    ↓
   No  ──→ Spawn direct (fast, no overhead)
```

### Decision Logic (Default)

| Agent Type | Worktree? | Reason |
|------------|-----------|--------|
| `code-review` | ❌ No | Read-only analysis |
| `security-audit` | ❌ No | Read-only investigation |
| `test-run` | ❌ No | No file modification |
| `build` | ❌ No | Safe, output-only |
| `debug` | ❌ No | Investigation only |
| `code-modify` | ✅ Yes | Will modify files |
| `refactor` | ✅ Yes | Changes code |
| `write-file` | ✅ Yes | Creates files |

**Override per task:**
```javascript
await orchestrate({
  agentType: 'code-review',
  prompt: 'Review this',
  useWorktree: true  // Force worktree for this task
});
```

### Worktree Manager API (Optional)

```javascript
import {
  createWorktree,      // Create isolated worktree
  spawnInWorktree,     // Spawn agent in worktree
  writeResult,         // Write and commit result
  readResult,          // Read result from worktree
  collectFromWorktrees // Collect from multiple
} from './worktree-manager.js'

// Only when needed
await createWorktree('review-1');
spawnInWorktree('review-1', 'Review src/app/page.tsx');
const results = await collectFromWorktrees(['review-1']);
```

### Main Orchestrator API

```javascript
import { orchestrate, orchestrateParallel } from './orchestrator.js'

// Single task - orchestrator decides
await orchestrate({
  agentType: 'code-review',  // → direct spawn (fast)
  prompt: 'Review this code'
})

await orchestrate({
  agentType: 'code-modify',  // → worktree (safe)
  prompt: 'Fix this bug',
  useWorktree: true          // Or force override
})

// Parallel with mixed strategies
await orchestrateParallel([
  { agentType: 'code-review', prompt: 'Review A' },
  { agentType: 'refactor', prompt: 'Refactor B' },  // Gets worktree
  { agentType: 'security-audit', prompt: 'Audit C' }
])
```

### Why Optional Worktrees?

| Factor | Direct Spawn | Worktree Spawn |
|--------|-------------|----------------|
| **Speed** | Instant | ~500ms setup |
| **Isolation** | Process-level | Filesystem-level |
| **Version control** | No | Yes (auto-commit) |
| **Cost** | Free | Git + filesystem |
| **Use case** | Quick read-only tasks | Modifications |

### Best Practices

- Use **direct spawn** for: reviews, audits, debug, tests
- Use **worktree** for: code changes, refactors, new files
- Let orchestrator decide by default
- Override with `useWorktree: true/false` when needed

---

## 11. Conclusion

| Priority | Best Choice |
|----------|-------------|
| **Minimal context per agent** | Our System ✅ |
| **True isolation** | Our System, Gastown, LangGraph |
| **Async non-blocking** | All frameworks |
| **Ease of setup** | Our System |
| **Production features** | Gastown, AutoGen, LangGraph |
| **OpenCode integration** | Our System, Gastown |
| **Visual feedback** | Gastown (tmux) |
| **Scalability** | LangGraph, AutoGen |
| **Git worktree support** | Our System ✅, Gastown |

Our current implementation with **worktree support** is optimal for your stated goals:
- ✅ Clean context per agent (worktree isolation)
- ✅ True isolation (separate processes + filesystem)
- ✅ Simple async via file polling
- ✅ No extra dependencies (just git + Node.js)
- ✅ Full MCP/skill control via `agent.json`
- ✅ All work version-controlled automatically

The trade-off: We don't have visual tmux panes, built-in cost controls, or sophisticated work tracking. These can be added later if needed.