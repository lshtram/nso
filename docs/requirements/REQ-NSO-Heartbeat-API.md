# Requirements Document: Heartbeat Monitoring API

| Field | Value |
|-------|-------|
| **Feature ID** | FEAT-HEARTBEAT-001 |
| **Status** | Pending Approval |
| **Created** | 2026-02-07 |
| **Triggered By** | Oracle (Discovery Phase) |

---

## 1. Business Goal

Add a standalone heartbeat monitoring endpoint to the NSO system that exposes the status of all active background agents via a REST API. This enables external monitoring tools and users to query agent health programmatically without accessing the CLI.

---

## 2. User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-001 | SRE/Monitor | Run a standalone script that starts an HTTP server | I can query agent status remotely |
| US-002 | User | Call `/api/health` to get JSON response | I can integrate with external dashboards |
| US-003 | User | See all active agents in one response | I get a complete system view at a glance |
| US-004 | User | See agent uptime, status, and last heartbeat | I can identify stalled or hanging agents |
| US-005 | User | Type `/heartbeat` to start the monitoring server | I don't need to remember the script path |

---

## 3. Functional Requirements

| ID | Requirement | Priority | Source |
|----|-------------|----------|--------|
| FR-001 | Script `scripts/heartbeat_api.py` must start an HTTP server on port 8080 | High | User Request |
| FR-002 | Endpoint `GET /api/health` must return JSON response | High | User Request |
| FR-003 | Response must include all agents from `.opencode/logs/task_status.json` | High | monitor_tasks.py |
| FR-004 | For each agent, return: `agent_id`, `status`, `current_step`, `last_heartbeat`, `uptime_seconds` | High | Extension Request |
| FR-006 | Endpoint must return HTTP 200 even if no agents are tracked | High | SRE Requirement |
| FR-007 | Script must use Python's built-in `http.server` module (no new dependencies) | High | Tech Constraint |
| FR-008 | No authentication required (public endpoint) | High | User Request |
| FR-009 | Slash command `/heartbeat` must be defined in `opencode.json` and spawn the monitoring script | High | User Request |

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Response time must be < 100ms | Performance |
| NFR-002 | Script must log startup and shutdown events | Observability |
| NFR-003 | Must handle malformed JSON in status file gracefully | Resilience |
| NFR-004 | Must follow Micro-Loop Protocol (Test → Code → Verify → Refactor) | Process |

---

## 5. API Specification

### 5.1 Request

```
GET /api/health HTTP/1.1
Host: localhost:8080
Accept: application/json
```

### 5.2 Response (Success)

```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T12:00:00Z",
  "agents": {
    "oracle": {
      "status": "running",
      "current_step": "Drafting requirements",
      "last_heartbeat": 1707312000.5,
      "uptime_seconds": 125.3
    },
    "builder-1": {
      "status": "idle",
      "current_step": "Waiting for tasks",
      "last_heartbeat": 1707311998.2,
      "uptime_seconds": 3600.0
    }
  }
}
```

### 5.3 Response (No Agents)

```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T12:00:00Z",
  "agents": {}
}
```

---

## 6. Input Source

| Source | Path | Format |
|--------|------|--------|
| Agent Heartbeats | `.opencode/logs/task_status.json` | JSON |

---

## 7. Dependencies

| Dependency | Version | Source |
|------------|---------|--------|
| Python | 3.12+ | Tech Stack |
| None (uses built-in `http.server`) | - | - |

---

## 8. Constraints & Assumptions

| ID | Constraint | Notes |
|----|------------|-------|
| C-001 | Script runs from project root | Ensures correct path to logs |
| C-002 | No auth layer | Acceptable for internal monitoring |
| C-003 | Port 8080 is available | Configurable via env var in V2 |
| C-004 | Status file is JSON valid | Graceful handling required |

---

## 9. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Status file corrupted | Medium | Low | Return empty agents with error log |
| Port 8080 in use | Low | Low | Print helpful error message |
| Public endpoint exposure | Low | N/A | Acceptable per user request - internal system |

---

## 10. Traceability Tags

| Requirement | Implementation Tag | Verification Tag |
|-------------|--------------------|-------------------|
| FR-001 | `// @implements: FR-HEARTBEAT-001` | `// @verifies: FR-HEARTBEAT-001` |
| FR-002 | `// @implements: FR-HEARTBEAT-002` | `// @verifies: FR-HEARTBEAT-002` |
| FR-003 | `// @implements: FR-HEARTBEAT-003` | `// @verifies: FR-HEARTBEAT-003` |
| FR-004 | `// @implements: FR-HEARTBEAT-004` | `// @verifies: FR-HEARTBEAT-004` |
| FR-006 | `// @implements: FR-HEARTBEAT-006` | `// @verifies: FR-HEARTBEAT-006` |
| FR-007 | `// @implements: FR-HEARTBEAT-007` | `// @verifies: FR-HEARTBEAT-007` |
| FR-008 | `// @implements: FR-HEARTBEAT-008` | `// @verifies: FR-HEARTBEAT-008` |
| FR-009 | `// @implements: FR-HEARTBEAT-009` | `// @verifies: FR-HEARTBEAT-009` |

---

## 11. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Oracle | OpenCode | Draft | 2026-02-07 |
| User | [Name] | ⬜ Pending | - |

---

**Document Version:** 1.0.0
**Next Phase:** Architecture (Phase 2) - upon user approval
