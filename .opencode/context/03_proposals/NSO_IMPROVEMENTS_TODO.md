# NSO Improvements - To-Do List

## Overview
This document tracks improvements needed for the NSO system based on comprehensive analysis of leading agentic frameworks and identified gaps in our current implementation. We've analyzed OpenAgents Control (OAC), LangGraph, CrewAI, Agent Development Kit (ADK), and other systems to identify best practices and missing features.

## Research Methodology
1. **Literature Review**: Analysis of documentation, blog posts, and research papers on multi-agent systems
2. **Architecture Comparison**: Direct comparison of system designs, workflows, and components
3. **Feature Gap Analysis**: Identification of missing capabilities in NSO
4. **Best Practice Extraction**: Collection of proven patterns from successful frameworks

## Priority Categories

### P0 - Critical Fixes (Immediate Impact)
1. **Parallel Execution System**
   - Issue: Agents hanging and not coming back to workflows
   - Need: Robust parallel execution with timeout management
   - Solution: Implement agent execution queue with heartbeat monitoring

2. **Session Management**
   - Issue: NSO plugin not always triggering initialization
   - Need: Reliable session startup with automatic context loading
   - Solution: Enhanced session tracking and fallback initialization

### P1 - Core System Enhancements (High Impact)
3. **Memory Management Optimization**
   - Current: Basic memory files with manual updates
   - Need: Structured knowledge graph with automated learning
   - Inspiration: OpenAgents Control's MVI (Minimal Viable Information) principle

4. **Router Enhancement**
   - Current: Basic intent detection
   - Need: Multi-dimensional routing with confidence scoring
   - Inspiration: LangGraph's state-based routing

5. **Skill Development System**
   - Current: Manual skill creation
   - Need: Automated skill building with validation
   - Inspiration: OpenAgents Control's editable agents in markdown

### P2 - Advanced Features (Medium Impact)
6. **Multi-Agent Coordination**
   - Current: Sequential workflow
   - Need: Parallel agent coordination with delegation
   - Inspiration: CrewAI's task-based agent coordination

7. **External Integration**
   - Current: Limited MCP server integration
   - Need: Standardized external service connectors
   - Inspiration: Agent Development Kit's pre-built connectors

8. **Validation Framework**
   - Current: Basic verification scripts
   - Need: Comprehensive test automation with coverage tracking
   - Inspiration: OpenAgents Control's automatic testing suite

### P3 - User Experience & Documentation (Long-term)
9. **Template System Enhancement**
   - Current: Basic templates
   - Need: Interactive template wizards with context generation
   - Inspiration: OpenAgents Control's `/add-context` wizard

10. **Team Collaboration Features**
    - Current: Single-user focus
    - Need: Multi-user patterns and shared context
    - Inspiration: OpenAgents Control's team-ready context files

## Research Findings from Other Systems

### OpenAgents Control (OAC) - Primary Inspiration
**Architecture**: Plan-first development with approval-based execution
**Key Innovations**:
1. **ContextScout**: Smart pattern discovery that loads relevant context before execution
2. **MVI Principle**: Minimal Viable Information - context files <200 lines, 80% token reduction
3. **Editable Agents**: Agents are markdown files you can edit directly (no vendor lock-in)
4. **Approval Gates**: Always request approval before execution (no surprises)
5. **Team-Ready Patterns**: Shared context files commit to repo for team consistency
6. **ExternalScout**: Fetches live documentation for external libraries

**Agent Types**:
- OpenAgent (general tasks)
- OpenCoder (production development)
- SystemBuilder (custom AI systems)
- Specialized subagents (auto-delegated)

### LangGraph - State-Based Routing
**Core Concept**: Directed cyclic graphs for stateful multi-agent workflows
**Key Features**:
1. **State Persistence**: Maintain context across agent interactions
2. **Visual Debugging**: Graph visualization of agent workflows
3. **Cyclic Workflows**: Support for loops and conditional branching
4. **Tool Integration**: Seamless integration with external tools as graph nodes

### CrewAI - Task-Based Coordination
**Architecture**: Role-based agents with process workflows
**Strengths**:
1. **Parallel Execution**: Multiple agents work simultaneously
2. **Role Specialization**: Clear agent roles and responsibilities
3. **Task Delegation**: Hierarchical task breakdown
4. **Process Workflows**: Structured workflow definitions

### Agent Development Kit (ADK) - Google Cloud Integration
**Key Features**:
1. **Pre-built Connectors**: 100+ connectors to Google services
2. **Bidirectional Streaming**: Real-time agent conversations
3. **Gemini 2.5 Pro Integration**: Advanced reasoning capabilities
4. **Enterprise Readiness**: Built-in security and compliance

### OpenAgents (Different from OAC) - Agent Networks
**Approach**: Networked collaboration of AI agents
**Features**:
1. **Protocol Agnostic**: WebSocket/gRPC/HTTP support
2. **Shared Knowledge Base**: Agents learn from collective experience
3. **Marketplace**: Discover and trade agent services

## Research Findings from Other Systems

### OpenAgents Control (OAC) - Primary Inspiration
**Architecture**: Plan-first development with approval-based execution
**Key Innovations**:
1. **ContextScout**: Smart pattern discovery that loads relevant context before execution
2. **MVI Principle**: Minimal Viable Information - context files <200 lines, 80% token reduction
3. **Editable Agents**: Agents are markdown files you can edit directly (no vendor lock-in)
4. **Approval Gates**: Always request approval before execution (no surprises)
5. **Team-Ready Patterns**: Shared context files commit to repo for team consistency
6. **ExternalScout**: Fetches live documentation for external libraries

**Agent Types**:
- OpenAgent (general tasks)
- OpenCoder (production development)
- SystemBuilder (custom AI systems)
- Specialized subagents (auto-delegated)

### LangGraph - State-Based Routing
**Core Concept**: Directed cyclic graphs for stateful multi-agent workflows
**Key Features**:
1. **State Persistence**: Maintain context across agent interactions
2. **Visual Debugging**: Graph visualization of agent workflows
3. **Cyclic Workflows**: Support for loops and conditional branching
4. **Tool Integration**: Seamless integration with external tools as graph nodes

### CrewAI - Task-Based Coordination
**Architecture**: Role-based agents with process workflows
**Strengths**:
1. **Parallel Execution**: Multiple agents work simultaneously
2. **Role Specialization**: Clear agent roles and responsibilities
3. **Task Delegation**: Hierarchical task breakdown
4. **Process Workflows**: Structured workflow definitions

### Agent Development Kit (ADK) - Google Cloud Integration
**Key Features**:
1. **Pre-built Connectors**: 100+ connectors to Google services
2. **Bidirectional Streaming**: Real-time agent conversations
3. **Gemini 2.5 Pro Integration**: Advanced reasoning capabilities
4. **Enterprise Readiness**: Built-in security and compliance

### OpenAgents (Different from OAC) - Agent Networks
**Approach**: Networked collaboration of AI agents
**Features**:
1. **Protocol Agnostic**: WebSocket/gRPC/HTTP support
2. **Shared Knowledge Base**: Agents learn from collective experience
3. **Marketplace**: Discover and trade agent services

## Detailed Feature Analysis

### 1. Parallel Execution System (P0)

**Problem**: 
- Agents sometimes hang during execution
- No timeout or recovery mechanism
- Lost agent sessions without notification

**Requirements**:
- Heartbeat monitoring for all agent processes
- Configurable timeout settings per agent type
- Automatic recovery with session state preservation
- Execution queue with priority management

**Implementation Approach**:
```
Agent Execution Queue → Heartbeat Monitor → Timeout Handler → Recovery System
```

### 2. Memory Management Optimization (P1)

**Current Limitations**:
- Manual memory file updates
- No automated learning from successful patterns
- Limited context pruning mechanism

**Target Features**:
- MVI (Minimal Viable Information) principle
- Automated pattern extraction from successful workflows
- Smart context loading based on task type
- Memory pruning to maintain <200 line context files

**Implementation Approach**:
- Add learning loop to successful workflows
- Implement pattern extraction algorithm
- Create automated context file generation

### 3. Enhanced Router System (P1)

**Current State**:
- Basic keyword-based routing
- Limited confidence scoring
- No workflow adaptation

**Target Features**:
- Multi-dimensional intent analysis
- Confidence scoring with thresholds
- Dynamic workflow adaptation
- Learning from routing decisions

**Inspiration Sources**:
- LangGraph state management
- ADK's hierarchical agent delegation
- OpenAgents Control's context-aware routing

## Comparative Analysis of Other Systems

### OpenAgents Control (OAC)
- **Strengths**: Pattern control, approval gates, MVI token efficiency, editable agents
- **Weaknesses**: Sequential execution (no parallel agents), requires approval gates
- **Key Features**: ContextScout, ExternalScout, team-ready patterns

### LangGraph
- **Strengths**: State-based routing, cyclic workflows, visual debugging
- **Weaknesses**: Complex setup, Python-focused
- **Key Features**: Directed cyclic graphs, state persistence

### CrewAI
- **Strengths**: Task-based coordination, role specialization, parallel execution
- **Weaknesses**: Limited pattern control, high token usage
- **Key Features**: Agent roles, task delegation, process workflows

### Agent Development Kit (ADK)
- **Strengths**: Google Cloud integration, pre-built connectors, streaming support
- **Weaknesses**: Vendor lock-in, complex for simple tasks
- **Key Features**: Bidirectional streaming, Gemini 2.5 Pro integration

## NSO Gap Analysis - Comprehensive Comparison

| Feature Category | NSO Current | OpenAgents Control | LangGraph | CrewAI | ADK | NSO Target |
|-----------------|-------------|--------------------|-----------|---------|-----|------------|
| **Parallel Execution** | ❌ Limited | ❌ Sequential | ⚠️ State-based | ✅ Parallel | ⚠️ Streaming | ✅ Robust Parallel |
| **Memory Management** | ⚠️ Basic | ✅ MVI Principle | ✅ State Persistence | ⚠️ Task memory | ⚠️ Cloud storage | ✅ MVI + Learning |
| **Routing System** | ⚠️ Basic | ✅ Context-aware | ✅ Graph-based | ✅ Task delegation | ⚠️ Cloud routing | ✅ Multi-dimensional |
| **Skill Development** | ⚠️ Manual | ✅ Editable MD files | ⚠️ Python code | ⚠️ Role definition | ⚠️ SDK-based | ✅ Automated Builder |
| **Team Collaboration** | ❌ None | ✅ Shared context files | ❌ Single-user | ⚠️ Role sharing | ✅ Enterprise | ✅ Multi-user patterns |
| **External Integration** | ⚠️ Limited | ⚠️ ExternalScout | ✅ Tool nodes | ⚠️ Limited | ✅ 100+ connectors | ✅ Standardized MCP |
| **Validation Framework** | ⚠️ Basic | ✅ Auto testing suite | ❌ Minimal | ⚠️ Task validation | ⚠️ Cloud monitoring | ✅ Comprehensive |
| **Approval Workflow** | ❌ None | ✅ Always required | ⚠️ Optional | ❌ Auto-execute | ⚠️ Cloud gates | ✅ Smart gates |
| **Token Efficiency** | ⚠️ Average | ✅ 80% reduction | ⚠️ State overhead | ❌ High usage | ⚠️ Streaming cost | ✅ 80% MVI reduction |
| **Learning System** | ❌ None | ❌ Pattern loading | ❌ Static graphs | ❌ Fixed roles | ⚠️ Cloud learning | ✅ Automated learning |

## Critical Missing Features in NSO

### 1. **ContextScout Equivalent**
**Problem**: NSO loads full context without smart pattern discovery
**Solution**: Implement ContextScout that:
- Analyzes task requirements before execution
- Discovers relevant patterns from context files
- Ranks patterns by priority (Critical → High → Medium)
- Loads only what's needed for current task

### 2. **Editable Agent System**
**Problem**: NSO agents are fixed prompts, not editable files
**Solution**: Convert agents to markdown files with:
- YAML frontmatter for configuration
- Editable behavior in plain text
- Version control integration
- Hot-reload capability

### 3. **Approval Gates**
**Problem**: NSO executes without user confirmation
**Solution**: Implement approval workflow:
- Agent proposes plan before execution
- User reviews and approves/rejects
- Optional auto-approval for trusted patterns
- Approval history tracking

### 4. **MVI Principle Implementation**
**Problem**: NSO context files can become bloated
**Solution**: Apply MVI (Minimal Viable Information):
- Keep context files <200 lines
- Lazy loading of only needed patterns
- 80% reduction target for token usage
- Smart context pruning algorithm

### 5. **ExternalScout Equivalent**
**Problem**: NSO lacks live documentation fetching
**Solution**: Implement ExternalScout that:
- Fetches current documentation from official sources
- Supports npm packages, APIs, frameworks
- Automatically triggered when agents detect external dependencies
- Caches results for efficiency

### 6. **Team-Ready Patterns**
**Problem**: NSO patterns are per-user, not team-shared
**Solution**: Implement team pattern system:
- Store patterns in project `.opencode/context/project/`
- Commit to repository for team sharing
- Inherit patterns automatically for new team members
- Version control for pattern evolution

## Implementation Roadmap with MCP Integration

### Phase 0: Setup Research Tools (Immediate)
1. **GH Grep MCP Setup**: For analyzing GitHub repositories
   - Use to examine OpenAgents Control structure
   - Analyze other frameworks' code patterns
   - Extract best practices automatically

2. **Parallel MCP Setup**: For concurrent research
   - Run multiple analysis tasks simultaneously
   - Compare frameworks in parallel
   - Speed up research process

3. **Filesystem MCP**: For local file analysis
   - Examine existing NSO structure
   - Identify architectural patterns
   - Map current capabilities

### Phase 1: Parallel Execution Fix (Week 1-2)
**Tools Needed**: Task queue system, heartbeat monitor
**Steps**:
1. Implement agent execution queue with priority levels
2. Add heartbeat monitoring for all agent processes
3. Create timeout handler with configurable settings
4. Build recovery system with state preservation
5. Add logging and alerting for hung agents

### Phase 2: MVI Memory System (Week 3-4)
**Inspiration**: OpenAgents Control MVI principle
**Steps**:
1. Analyze current context usage patterns
2. Implement ContextScout pattern discovery
3. Create smart context loading system
4. Add automated context pruning
5. Implement lazy loading for efficiency

### Phase 3: Editable Agents (Week 5-6)
**Inspiration**: OAC's editable markdown agents
**Steps**:
1. Convert existing agents to markdown format
2. Add YAML frontmatter for configuration
3. Create hot-reload capability
4. Implement version control integration
5. Add agent editing UI/workflow

### Phase 4: Approval Gates & Routing (Week 7-8)
**Inspiration**: OAC approval gates + LangGraph routing
**Steps**:
1. Implement approval workflow system
2. Add multi-dimensional router with confidence scoring
3. Create state-based workflow adaptation
4. Add learning from routing decisions
5. Implement optional auto-approval for trusted patterns

### Phase 5: Team & External Features (Week 9-10)
**Steps**:
1. Implement team pattern sharing system
2. Create ExternalScout for live documentation
3. Standardize MCP server integration
4. Add comprehensive validation framework
5. Create skill auto-builder system

## Technical Architecture Changes

### Current NSO Architecture
```
User → Oracle → Router → Workflow → Agent → Tools
```

### Target Architecture with Improvements
```
User → Oracle → Enhanced Router → Approval Gate → ContextScout → 
↓
Agent Queue → Heartbeat Monitor → Parallel Agents → 
↓
Memory (MVI) → Learning System → Pattern Extraction →
↓
ExternalScout → Team Patterns → Validation Framework
```

### Key Components to Build
1. **ContextScout**: Pattern discovery and loading
2. **Agent Queue**: Parallel execution management  
3. **Heartbeat Monitor**: Agent health tracking
4. **Approval Gate**: User confirmation system
5. **Enhanced Router**: Multi-dimensional intent analysis
6. **ExternalScout**: Live documentation fetcher
7. **Learning System**: Automated pattern extraction
8. **Team Pattern Manager**: Shared context coordination

## MCP Tool Integration Plan

### Required MCP Servers
1. **gh_grep**: GitHub repository analysis
2. **parallel**: Concurrent task execution
3. **filesystem**: Local file structure analysis
4. **supabase-mcp**: Database for pattern storage
5. **context7**: Documentation research
6. **websearch**: External framework research

### Integration Approach
- Use MCP servers for research phase
- Extract patterns and best practices
- Implement extracted features in NSO
- Create standardized MCP connector system

## Success Validation Criteria

### Technical Metrics
- **Agent Completion Rate**: ≥99.9% (from current ~95%)
- **Token Efficiency**: 80% reduction (MVI target)
- **Routing Accuracy**: ≥90% confidence score
- **Parallel Speed**: 3x faster execution
- **Memory Footprint**: 50% reduction in context size

### User Experience Metrics
- **Approval Time**: <30 seconds for plan review
- **Pattern Discovery**: Automatic relevant pattern loading
- **Team Onboarding**: 80% faster with shared patterns
- **Skill Creation**: 50% reduction in manual effort
- **External Integration**: 90% success rate for API/library use

## Implementation Timeline (Updated)

### Phase 0: Setup & Research (Current - 2 days)
1. Configure GH Grep MCP for repository analysis
2. Set up Parallel MCP for concurrent research
3. Analyze OpenAgents Control architecture
4. Extract key patterns and best practices
5. Document architectural insights

### Phase 1: Parallel Execution Fix (Week 1-2)
1. Implement agent execution queue system
2. Add heartbeat monitoring with configurable intervals
3. Create timeout handler with recovery mechanisms
4. Build logging and alerting for agent health
5. Test with complex multi-agent workflows

### Phase 2: MVI Memory System (Week 3-4)
1. Analyze current context usage and identify bloat
2. Implement ContextScout pattern discovery engine
3. Create smart context loading with lazy evaluation
4. Add automated context pruning algorithm
5. Validate 80% token reduction target

### Phase 3: Editable Agents & Approval (Week 5-6)
1. Convert Oracle, Builder, Janitor agents to markdown
2. Implement YAML configuration with hot-reload
3. Create approval workflow with plan presentation
4. Add approval history and pattern learning
5. Test with user feedback loop

### Phase 4: Enhanced Routing (Week 7-8)
1. Implement multi-dimensional router with confidence scoring
2. Add state-based workflow adaptation
3. Create learning system from routing decisions
4. Integrate with approval gates
5. Validate ≥90% routing accuracy

### Phase 5: Team & External Features (Week 9-10)
1. Implement team pattern sharing in `.opencode/context/project/`
2. Create ExternalScout for live documentation fetching
3. Standardize MCP server integration patterns
4. Build comprehensive validation framework
5. Create automated skill builder system

### Phase 6: Integration & Optimization (Week 11-12)
1. Integrate all components into cohesive system
2. Optimize performance and resource usage
3. Create comprehensive test suite
4. Document new architecture and APIs
5. Release improved NSO system

## Success Metrics
- **Parallel Execution**: 99.9% agent completion rate
- **Memory Efficiency**: 80% reduction in context token usage
- **Routing Accuracy**: ≥90% confidence on correct workflow detection
- **Skill Development**: 50% reduction in manual skill creation time

## References
1. OpenAgents Control: https://github.com/darrenhinde/OpenAgentsControl
2. LangGraph: https://github.com/langchain-ai/langgraph
3. CrewAI: https://github.com/joaomdmoura/crewai
4. Agent Development Kit: https://github.com/google/agent-development-kit
5. OpenAgents: https://github.com/openagents-org/openagents

---
**Last Updated**: 2026-02-08
**Status**: Active
**Priority**: P0-P3 items identified