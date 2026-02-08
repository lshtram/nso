# TECHSPEC-NSO-MCP-Integration

**Technical Specification for MCP Integration**
**Version:** 1.0.0
**Date:** 2026-02-07
**Status:** Draft (Phase 2: Architecture)
**Feature ID:** MCP-INTEGRATION
**Requirements Reference:** REQ-NSO-MCP-Integration.md

---

## 1. Overview

This document defines the technical implementation of MCP (Model Context Protocol) servers for NSO agents. MCP servers provide enhanced capabilities including persistent memory, browser automation, code navigation, and technical research.

---

## 2. MCP Servers to Install

### Tier 1: Core MCPs (Essential)

| MCP Server | npm Command | Purpose |
|------------|-------------|---------|
| **Memory** | `uvx mcp-server-memory` | Persistent context across sessions |
| **Playwright MCP** | `npx @playwright/mcp` | Browser automation for testing/web scraping |
| **Chrome DevTools MCP** | `npx @google/mcp-chrome-devtools` | Debugging, performance analysis |
| **Tree-sitter MCP** | `npx mcp-server-tree-sitter` | Semantic code navigation |

### Tier 2: Research MCPs

| MCP Server | npm Command | Purpose |
|------------|-------------|---------|
| **Parallel AI** | `npm install -g parallel-search-mcp-server` | High-accuracy technical search |
| **Context7 MCP** | `npm install -g @context7ai/context7-mcp-server` | Library documentation lookup |

### Tier 3: GitHub Integration

| Tool | Install Command | Purpose |
|------|-----------------|---------|
| **gh CLI** | See https://cli.github.com/ | GitHub operations |
| **Dragons-claw MCP** | `npm install -g @dragons-claw/mcp-github` | Wrap gh CLI for agents |

---

## 3. Installation Commands

### One-Line Installation

```bash
# Tier 1: Core MCPs
uvx mcp-server-memory
npx @playwright/mcp
npx @google/mcp-chrome-devtools
npx mcp-server-tree-sitter

# Tier 2: Research MCPs
npm install -g parallel-search-mcp-server
npm install -g @context7ai/context7-mcp-server

# Tier 3: GitHub
# Install gh CLI manually from https://cli.github.com/
npm install -g @dragons-claw/mcp-github
```

### Prerequisites

```bash
# Install Playwright browsers
npx playwright install

# Install gh CLI
brew install gh  # macOS
# OR download from https://cli.github.com/
```

---

## 4. OpenCode Configuration

Add to `.opencode/opencode.json`:

```json
{
  "mcpServers": {
    "memory": {
      "command": "uvx",
      "args": ["mcp-server-memory"],
      "disabled": false
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "disabled": false
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["@google/mcp-chrome-devtools"],
      "disabled": false
    },
    "tree-sitter": {
      "command": "npx",
      "args": ["mcp-server-tree-sitter"],
      "disabled": false
    },
    "parallel": {
      "command": "npx",
      "args": ["parallel-search-mcp-server"],
      "disabled": false
    },
    "context7": {
      "command": "npx",
      "args": ["@context7ai/context7-mcp-server"],
      "disabled": false
    }
  }
}
```

---

## 5. Per-Agent MCP Access Matrix

### Default Configuration

| Agent | Memory | Playwright | Chrome DevTools | Tree-sitter | Parallel | Context7 |
|-------|--------|------------|-----------------|-------------|----------|----------|
| **Oracle** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Builder** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Janitor** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Librarian** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Designer** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Scout** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

### Native Tools (Always Available)

| Tool | All Agents |
|------|------------|
| **gh CLI** | ✅ via bash |
| **Read/Write/Edit** | ✅ Native |
| **WebSearch/WebFetch** | ✅ Native |
| **Bash/Grep/Glob** | ✅ Native |

---

## 6. MCP Tool Reference

### 6.1 Memory MCP

```python
# Save information to persistent memory
await mcp__memory__save_memory({"key": "project-decision-1", "data": {...}})

# Search memory for information
await mcp__memory__search_memory({"query": "architectural decisions"})
```

### 6.2 Playwright MCP

```python
# Navigate to URL
await mcp__playwright__navigate({"url": "https://example.com"})

# Click element
await mcp__playwright__click({"selector": "#submit-button"})

# Take screenshot
await mcp__playwright__screenshot({})

# Fill form
await mcp__playwright__fill({"selector": "#email", "value": "user@example.com"})
```

### 6.3 Chrome DevTools MCP

```python
# Start performance trace
await mcp__chrome_devtools__performance_start_trace()

# Stop trace and get results
await mcp__chrome_devtools__performance_stop_trace()

# Take heap snapshot
await mcp__chrome_devtools__heap_snapshot()

# Enable network tracking
await mcp__chrome_devtools__network_enable()
```

### 6.4 Tree-sitter MCP

```python
# Search code semantically
await mcp__tree_sitter__search({"query": "functions that return errors"})

# Get AST for file
await mcp__tree_sitter__parse_file({"path": "/path/to/file.py"})

# Find function callers
await mcp__tree_sitter__find_callers({"function_name": "authenticate"})

# Get dependency graph
await mcp__tree_sitter__get_dependencies({"path": "/path/to/file.py"})
```

### 6.5 Parallel AI MCP

```python
# Deep technical search
await mcp__parallel__search({
    "query": "best practices for circuit breaker pattern in Python",
    "mode": "research"  # lite, base, core
})

# Get structured results
await mcp__parallel__search({
    "query": "compare LangChain vs LlamaIndex for RAG",
    "format": "structured"
})
```

### 6.6 Context7 MCP

```python
# Find library ID
await mcp__context7__resolve_library_id({"query": "react hooks"})

# Query documentation
await mcp__context7__query_docs({
    "library_id": "/facebook/react",
    "query": "how to use useEffect"
})
```

### 6.7 gh CLI (Native via Bash)

```bash
# Search code on GitHub
gh search code "circuit breaker pattern" --language python

# Search repositories
gh search repos "autonomous agent framework" --sort stars

# View repo structure
gh repo view owner/repo --json tree

# Search PRs
gh pr search --state open --label "bug"
```

---

## 7. Agent Integration Examples

### 7.1 Oracle (Architecture Decisions)

```python
# Oracle uses Parallel AI for research
async def research_pattern(self, pattern_name: str) -> dict:
    result = await mcp__parallel__search({
        "query": f"best practices for {pattern_name} pattern",
        "mode": "research"
    })
    
    # Save to memory
    await mcp__memory__save_memory({
        "key": f"pattern-{pattern_name}",
        "data": result
    })
    
    return result
```

### 7.2 Builder (Code Development)

```python
# Builder uses Tree-sitter for code navigation
async def find_impact(self, function_name: str) -> list:
    # Find all callers
    callers = await mcp__tree_sitter__find_callers({
        "function_name": function_name
    })
    
    # Get dependency graph
    deps = await mcp__tree_sitter__get_dependencies({
        "path": self.current_file
    })
    
    return {"callers": callers, "dependencies": deps}
```

### 7.3 Janitor (Code Review)

```python
# Janitor uses Tree-sitter + Chrome DevTools
async def analyze_code(self, file_path: str) -> dict:
    # Get semantic analysis
    analysis = await mcp__tree_sitter__search({
        "query": "complex functions high cyclomatic complexity",
        "path": file_path
    })
    
    return analysis

async def debug_issue(self, url: str) -> dict:
    # Debug production issue via Chrome DevTools
    await mcp__chrome_devtools__performance_start_trace()
    await mcp__playwright__navigate({"url": url})
    
    # Take heap snapshot
    heap = await mcp__chrome_devtools__heap_snapshot()
    
    return {"heap": heap}
```

### 7.4 Scout (Research)

```python
# Scout uses Parallel AI + Context7 + gh CLI
async def research_library(self, library_name: str) -> dict:
    # Get library docs from Context7
    lib_id = await mcp__context7__resolve_library_id({
        "query": library_name
    })
    
    docs = await mcp__context7__query_docs({
        "library_id": lib_id,
        "query": "main features and use cases"
    })
    
    # Search GitHub for examples
    gh_results = await bash("gh search repos {library_name} --sort stars --limit 5")
    
    return {"docs": docs, "github_examples": gh_results}

async def technical_research(self, query: str) -> dict:
    # Deep research with Parallel AI
    result = await mcp__parallel__search({
        "query": query,
        "mode": "core"  # Deepest analysis
    })
    
    # Save findings
    await mcp__memory__save_memory({
        "key": f"research-{hash(query)}",
        "data": result
    })
    
    return result
```

### 7.5 Designer (UI/UX)

```python
# Designer uses Playwright for testing
async def test_component(self, url: str, component_selector: str) -> dict:
    await mcp__playwright__navigate({"url": url})
    
    # Check if component exists
    component = await mcp__playwright__get_element({
        "selector": component_selector
    })
    
    # Take screenshot
    screenshot = await mcp__playwright__screenshot({
        "selector": component_selector
    })
    
    return {"component": component, "screenshot": screenshot}

async def analyze_performance(self, url: str) -> dict:
    await mcp__chrome_devtools__performance_start_trace()
    await mcp__playwright__navigate({"url": url})
    
    trace = await mcp__chrome_devtools__performance_stop_trace()
    
    return trace
```

### 7.6 Librarian (Memory Management)

```python
# Librarian manages memory
async def save_decision(self, key: str, decision: dict) -> None:
    await mcp__memory__save_memory({
        "key": key,
        "data": decision
    })

async def search_context(self, query: str) -> list:
    results = await mcp__memory__search_memory({
        "query": query
    })
    return results
```

---

## 8. Testing Plan

### Unit Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| `test_memory_save_load` | Save and retrieve memory | Data matches |
| `test_playwright_navigate` | Navigate to URL | Page loads |
| `test_tree_sitter_parse` | Parse Python file | AST returned |
| `test_parallel_search` | Search query | Results returned |
| `test_context7_resolve` | Resolve library ID | Library found |
| `test_gh_cli` | Run gh search | Results returned |

### Integration Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| `test_oracle_research` | Oracle uses Parallel + Memory | Research saved |
| `test_builder_impact` | Builder finds function callers | Callers found |
| `test_janitor_review` | Janitor analyzes code | Analysis complete |
| `test_scout_research` | Scout researches library | Docs + examples |
| `test_designer_test` | Designer tests component | Screenshot captured |

---

## 9. File Structure

```
.opencode/
├── config/
│   └── mcp-agents.json          # Per-agent MCP mapping
├── docs/
│   ├── requirements/
│   │   └── REQ-NSO-MCP-Integration.md
│   └── architecture/
│       └── TECHSPEC-NSO-MCP-Integration.md  # This file
└── mcp_config.json              # MCP server configurations
```

---

## 10. Security Considerations

### MCP Server Security

| MCP | Consideration |
|-----|---------------|
| **Memory** | Ensure memory data is not sensitive |
| **Playwright** | Sandbox browser sessions |
| **Chrome DevTools** | Limit access to production URLs |
| **Tree-sitter** | Safe for code analysis |
| **Parallel AI** | API key required |
| **Context7** | Safe, read-only docs access |
| **gh CLI** | Use minimal permissions tokens |

### Best Practices

1. Use read-only modes where possible
2. Limit filesystem access to project directory
3. Use minimal GitHub tokens with limited scopes
4. Don't save sensitive data to memory MCP
5. Sandbox browser sessions for testing

---

## 11. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| MCP server not starting | Check npm installation |
| Timeout errors | Increase timeout in config |
| Permission denied | Check file/folder permissions |
| Token expired | Refresh GitHub token |
| Browser not launching | Run `npx playwright install` |

### Log Locations

| MCP | Log Location |
|-----|--------------|
| **Memory** | stdout |
| **Playwright** | stdout |
| **Chrome DevTools** | stdout |
| **Tree-sitter** | stdout |
| **Parallel AI** | stdout (API errors) |
| **Context7** | stdout |

---

## 12. Approval

| Phase | Approver | Status | Date |
|-------|----------|--------|------|
| Discovery (REQ) | User | ✅ Approved | 2026-02-07 |
| Architecture (TECHSPEC) | User | **Pending** | 2026-02-07 |

---

## 13. Quick Reference

### Installation (Copy-Paste)

```bash
# Core MCPs
uvx mcp-server-memory
npx @playwright/mcp
npx @google/mcp-chrome-devtools
npx mcp-server-tree-sitter

# Research MCPs
npm install -g parallel-search-mcp-server
npm install -g @context7ai/context7-mcp-server

# GitHub (manual)
# Install gh CLI from https://cli.github.com/
npm install -g @dragons-claw/mcp-github
```

### Per-Agent Quick Reference

| Agent | Key MCPs |
|-------|----------|
| **Oracle** | Memory, Parallel, Context7 |
| **Builder** | Memory, Tree-sitter, Parallel, Context7, gh |
| **Janitor** | Memory, Tree-sitter, Chrome DevTools, Parallel, gh |
| **Librarian** | Memory, Parallel, gh |
| **Designer** | Memory, Playwright, Chrome DevTools, Parallel |
| **Scout** | Memory, Playwright, Parallel, Context7, gh |

---

**Document Status:** Ready for User Approval  
**Next Step:** User approves → Implementation (Install MCPs, Configure, Test)