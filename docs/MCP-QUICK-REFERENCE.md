# MCP Quick Reference Guide

**Last Updated:** 2026-02-07

---

## Configured MCP Servers

| MCP | Type | Command/URL | Purpose |
|-----|------|-------------|---------|
| **Memory** | Local | `@modelcontextprotocol/server-memory` | Persistent memory |
| **Playwright** | Local | `@playwright/mcp` | Browser automation |
| **Chrome DevTools** | Local | `chrome-devtools-mcp@latest` | Debugging/performance |
| **Filesystem** | Local | `@modelcontextprotocol/server-filesystem` | File access (Shared/dev + liorshtram/dev) |
| **Parallel Search** | Remote | `https://search-mcp.parallel.ai/mcp` | Technical search |
| **Tavily** | Remote | `https://mcp.tavily.com/mcp` | Web search |
| **Context7** | Remote | `https://mcp.context7.com/mcp` | Library documentation |

---

## Per-Agent MCP Access

| Agent | MCP Tools Available |
|-------|---------------------|
| **Oracle** | Memory, Parallel, Context7 |
| **Builder** | Memory, Tree-sitter, Parallel, Context7 |
| **Janitor** | Memory, Tree-sitter, Chrome DevTools, Parallel |
| **Librarian** | Memory, Parallel |
| **Designer** | Memory, Playwright, Chrome DevTools, Parallel |
| **Scout** | Memory, Playwright, Parallel, Context7 |

---

## Usage Examples

### Memory MCP

```
mcp__memory__save_memory({"key": "test-key", "data": {"example": "data"}})
mcp__memory__search_memory({"query": "test-key"})
```

### Parallel Search MCP

```
mcp__parallel__search({"query": "circuit breaker pattern python", "mode": "research"})
```

### Context7 MCP

```
mcp__context7__resolve_library_id({"query": "react hooks"})
mcp__context7__query_docs({"library_id": "/facebook/react", "query": "useEffect usage"})
```

### Tavily MCP

```
mcp__tavily__search({"query": "best practices for API design"})
```

### Playwright MCP

```
mcp__playwright__navigate({"url": "https://example.com"})
mcp__playwright__screenshot({})
```

### Chrome DevTools MCP

```
mcp__chrome_devtools__performance_start_trace({})
mcp__chrome_devtools__performance_stop_trace({})
```

### Filesystem MCP

```
mcp__filesystem__read_file({"path": "/Users/Shared/dev/high-reliability-framework/.opencode/opencode.json"})
mcp__filesystem__write_file({"path": "/tmp/test.txt", "content": "Hello World"})
```

---

## Native Tools (Always Available)

| Tool | Usage |
|------|-------|
| **gh CLI** | `gh search code "pattern" --language python` |
| **Read/Write/Edit** | Native file operations |
| **WebSearch** | `web_search` tool |
| **WebFetch** | `web_fetch` tool |

---

## Testing Commands

```bash
# Run MCP test suite
python3 .opencode/scripts/test_mcps.py

# Test gh CLI (native)
gh search code "circuit breaker pattern" --limit 1
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP not responding | Restart OpenCode |
| API errors | Check API keys in opencode.json |
| Timeout errors | Increase timeout in config |
| Permission denied | Check file/folder permissions |

---

## Files

- **Config:** `opencode.json` (mcpServers section)
- **Agent Mapping:** `.opencode/config/mcp-agents.json`
- **Tests:** `.opencode/scripts/test_mcps.py`