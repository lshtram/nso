# MCP Integration for NSO Agents

**MCP (Model Context Protocol) Integration Plan**
**Version:** 2.0.0 (Updated with Research)
**Date:** 2026-02-07
**Status:** Draft

---

## Overview

This document defines MCP (Model Context Protocol) server integration for each NSO agent. MCP servers provide external capabilities that agents can use to interact with filesystems, version control, web research, code intelligence, and browser automation.

---

## CC10X Reference

### What CC10X Uses

Based on `docs/cc10x/cc10x-features.md`:

| MCP Server | Purpose | Tools |
|------------|---------|-------|
| **Octocode MCP** | GitHub code search | githubSearchCode, githubSearchRepositories |
| **Bright Data MCP** | Web search | search_engine, scrape_as_markdown |
| **Context7 MCP** | Library documentation | resolve-library-id, query-docs |

**Note:** CC10X uses native tools (Read, Write, Edit, Bash) for file operations, NOT MCP filesystem.

---

## MCP Servers for NSO (Research-Informed)

### Tier 1: Core MCP Servers (Essential)

| MCP Server | Research Finding | Use Case |
|------------|------------------|----------|
| **Filesystem** | Native Read/Write tools work better than MCP | File operations |
| **Git/gh CLI** | Use `gh` CLI directly for GitHub operations (dragons-claw MCP available) | Version control, GitHub research |
| **Memory** | `mcp-server-memory` for persistent context | Memory persistence |
| **Playwright MCP** | microsoft/playwright-mcp for browser automation | Web interaction, testing |
| **Chrome DevTools MCP** | Official Google MCP for debugging | Performance analysis, security |

### Tier 2: Research MCP Servers (High Value)

| MCP Server | Research Finding | Use Case |
|------------|------------------|----------|
| **Parallel AI Search** | Used by Devin, highest accuracy AI search API | Technical/deep research |
| **Context7 MCP** | Best for library documentation | API reference lookup |
| **Tree-sitter / CKB** | Semantic code intelligence, call graphs, impact analysis | Code navigation |

### Tier 3: Optional MCP Servers

| MCP Server | Research Finding | Use Case |
|------------|------------------|----------|
| **GitHub MCP** | Official GitHub MCP server | Issues, PRs, repos |
| **Fetch MCP** | Native WebSearch/WebFetch sufficient | Web requests |

---

## MCP Research Summary

### 1. GitHub Research: gh CLI (Recommended)

**Research Finding:** The `gh` CLI is the most efficient tool for GitHub operations. CC10X uses Octocode MCP, but `gh` CLI provides:

```
gh search code "circuit breaker pattern"
gh search repos "langchain alternatives"
gh repo view structure
gh pr search "bug fix"
```

**MCP Option:** `@dragons-claw/mcp-github` wraps `gh` CLI for agents.

**Decision:** Use `gh` CLI directly (native bash) + optional MCP wrapper.

---

### 2. Technical Search: Parallel AI (Recommended)

**Research Finding:** Parallel AI (parallel.ai) provides:
- "Highest accuracy AI search API" (used by Devin)
- Structured deep research API
- Best performance for technical queries
- Benchmarks show superior accuracy vs. traditional search

**MCP:** `parallel-search-mcp-server`

**Decision:** Add Parallel AI for Scout's research needs.

---

### 3. Code Navigation: Tree-sitter / CKB (Recommended)

**Research Finding:** Two excellent options for semantic code understanding:

| Tool | Strength | Use Case |
|------|----------|----------|
| **mcp-server-tree-sitter** | Deep AST access, 19+ languages, tree-sitter queries | Code analysis, refactoring |
| **CKB / CodePrysm** | Graph-based, call graphs, impact analysis, risk/ownership | Dependency analysis, code intelligence |

**Decision:** Add Tree-sitter MCP for Janitor and Builder.

---

### 4. Browser Automation: Playwright + Chrome DevTools (Recommended)

**Research Finding:** Two complementary MCPs:

| Tool | Strength | Use Case |
|------|----------|----------|
| **Playwright MCP** (microsoft) | Browser automation, web scraping, testing | Web interaction |
| **Chrome DevTools MCP** (official Google) | Debugging, performance trace, security inspection | Debug production issues |

**Decision:** Add both Playwright and Chrome DevTools MCPs.

---

### 5. File Operations: Native Tools (Recommended)

**Research Finding:** CC10X and NSO use native tools (Read, Write, Edit) for file operations. MCP filesystem is redundant.

**Decision:** Use native Read/Write/Edit tools. No MCP needed.

---

## Agent → Skills + MCP Mapping

### 1. The Oracle (System Architect)

**Skills:**
- `rm-intent-clarifier`, `rm-validate-intent`, `rm-multi-perspective-audit`
- `architectural-review`, `brainstorming-bias-check`, `rm-conflict-resolver`

**MCP Tools:**
| Tool | Purpose |
|------|---------|
| **Fetch** | Fetch external documentation, RFCs |
| **Parallel AI** | Technical research for architecture decisions |
| **Memory** | Retrieve past decisions, patterns |

---

### 2. The Builder (Software Engineer)

**Skills:**
- `tdflow-unit-test`, `minimal-diff-generator`, `code-generation`

**MCP Tools:**
| Tool | Purpose |
|------|---------|
| **gh CLI** | Git operations, commit, branch |
| **Tree-sitter MCP** | Code analysis, refactoring, semantic search |
| **Parallel AI** | Look up libraries, API docs |

---

### 3. The Janitor (Quality Assurance)

**Skills:**
- `bug-investigator`, `code-reviewer`, `silent-failure-hunter`, `traceability-linker`

**MCP Tools:**
| Tool | Purpose |
|------|---------|
| **Tree-sitter MCP** | Code analysis, impact analysis, hotspots |
| **gh CLI** | Git history, blame, diff |
| **Chrome DevTools MCP** | Debug production issues, performance analysis |
| **Parallel AI** | Look up CVEs, security advisories |

---

### 4. The Librarian (Knowledge Manager)

**Skills:**
- `memory-update`, `context-manager`, `doc-updater`

**MCP Tools:**
| Tool | Purpose |
|------|---------|
| **Memory MCP** | Persistent context |
| **gh CLI** | Git operations for docs |
| **Parallel AI** | Research best practices |

---

### 5. The Designer (Frontend/UX)

**Skills:**
- `ui-component-gen`, `accessibility-audit`

**MCP Tools:**
| Tool | Purpose |
|------|---------|
| **Playwright MCP** | Browser testing, component verification |
| **Chrome DevTools MCP** | Debug UI issues, performance analysis |
| **gh CLI** | Design system repo operations |

---

### 6. The Scout (Research & Evolution)

**Skills:**
- `tech-radar-scan`, `rfc-generator`

**MCP Tools:**
| Tool | Purpose |
|------|---------|
| **Parallel AI** | Deep technical research |
| **gh CLI** | GitHub code and repo research |
| **Context7 MCP** | Library documentation lookup |
| **Memory MCP** | Save research findings |

---

## Complete MCP List for NSO

### Tier 1: Core (Install First)

| MCP Server | Command | Purpose |
|------------|---------|---------|
| **Memory** | `uvx mcp-server-memory` | Persistent context |
| **Playwright MCP** | `npx @playwright/mcp` | Browser automation |
| **Chrome DevTools MCP** | `npx @google/mcp-chrome-devtools` | Debugging, performance |
| **Tree-sitter MCP** | `npx mcp-server-tree-sitter` | Code navigation |

### Tier 2: Research (Install Second)

| MCP Server | Command | Purpose |
|------------|---------|---------|
| **Parallel AI** | `npx parallel-search-mcp-server` | Technical search |
| **Context7 MCP** | `npx @context7ai/context7-mcp-server` | Library docs |

### Tier 3: GitHub (Install Third)

| MCP Server | Command | Purpose |
|------------|---------|---------|
| **gh CLI** | Native (install separately) | GitHub operations |
| **Dragons-claw MCP** | `npx @dragons-claw/mcp-github` | Wrap gh CLI |

---

## Configuration

### Installation Commands

```bash
# Tier 1: Core
uvx mcp-server-memory
npx @playwright/mcp
npx @google/mcp-chrome-devtools
npx mcp-server-tree-sitter

# Tier 2: Research
npm install -g parallel-search-mcp-server
npm install -g @context7ai/context7-mcp-server

# Tier 3: GitHub
# Install gh CLI from https://cli.github.com/
npm install -g @dragons-claw/mcp-github
```

### OpenCode Configuration

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

## Per-Agent MCP Access

### Default: All Agents Have Access to Core MCPs

| Agent | Memory | Playwright | Chrome DevTools | Tree-sitter | Parallel | Context7 |
|-------|--------|------------|-----------------|-------------|----------|----------|
| **Oracle** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Builder** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Janitor** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Librarian** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Designer** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Scout** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

---

## Testing Plan

| Test | Agent | Expected Result |
|------|-------|-----------------|
| Save memory | Librarian | Memory persisted |
| Browser navigate | Designer | Page loaded |
| Performance trace | Janitor | Trace collected |
| Code semantic search | Builder | Relevant code found |
| Technical research | Scout | Research results |
| Library docs | Oracle | API reference |

---

## Comparison: CC10X vs NSO

| Aspect | CC10X | NSO (Research-Informed) |
|--------|-------|-------------------------|
| **GitHub Research** | Octocode MCP | gh CLI (native) |
| **Web Search** | Bright Data MCP | Parallel AI (higher accuracy) |
| **Library Docs** | Context7 MCP | Context7 MCP ✅ |
| **File Operations** | MCP | Native tools ✅ |
| **Browser** | Not used | Playwright + Chrome DevTools ✅ |
| **Code Navigation** | Not used | Tree-sitter MCP ✅ |

**Key Differences:**
- NSO uses `gh` CLI (no MCP) for GitHub - more efficient
- NSO uses Parallel AI instead of Bright Data - higher accuracy
- NSO adds browser automation (Playwright + Chrome DevTools)
- NSO adds semantic code navigation (Tree-sitter)

---

## Files to Create

| File | Purpose |
|------|---------|
| `docs/requirements/REQ-NSO-MCP-Integration.md` | This document |
| `docs/architecture/TECHSPEC-NSO-MCP-Integration.md` | Tech spec |
| `.opencode/config/mcp-agents.json` | Per-agent MCP mapping |

---

## Approval

| Phase | Approver | Status | Date |
|-------|----------|--------|------|
| Requirements | User | Pending | 2026-02-07 |

---

**Next Step:** User approves → Create tech spec with full configuration