# TECHSPEC-NSO-Circuit-Breaker

**Technical Specification for Circuit Breaker Pattern**
**Version:** 2.0.0 (Simplified)
**Date:** 2026-02-07
**Status:** Draft (Phase 2: Architecture)
**Feature ID:** CIRCUIT-BREAKER

---

## 1. Overview

The Circuit Breaker prevents cascading failures by stopping calls to failing services and allowing recovery time.

### State Machine (3 states)

```
CLOSED (normal) → OPEN (blocked) → HALF_OPEN (testing) → CLOSED (recovered)
```

| State | Behavior |
|-------|----------|
| **CLOSED** | Requests pass through, failures counted |
| **OPEN** | Requests blocked immediately, fallback triggered |
| **HALF_OPEN** | Limited requests allowed to test recovery |

---

## 2. Implementation (~50 lines)

```python
# File: .opencode/skills/circuit-breaker/circuit_breaker.py

import asyncio
from datetime import datetime, timedelta
from typing import Callable, Any, Optional
import json
from pathlib import Path

LOG_FILE = Path(".opencode/logs/circuit-breakers.json")


class CircuitBreaker:
    """Simple circuit breaker for agent workflows."""

    def __init__(
        self,
        name: str,
        max_failures: int = 5,
        reset_after_seconds: int = 30,
    ):
        self.name = name
        self.max_failures = max_failures
        self.reset_after = timedelta(seconds=reset_after_seconds)
        self.failures = 0
        self.last_failure: Optional[datetime] = None
        self._open = False

    @property
    def is_open(self) -> bool:
        """Check if circuit is open, auto-transition if reset time passed."""
        if self._open and self.last_failure:
            if datetime.now() - self.last_failure > self.reset_after:
                self._open = False
        return self._open

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection."""
        if self.is_open:
            self._log("rejected", {"reason": "circuit_open"})
            raise Exception(f"Circuit '{self.name}' is open")

        try:
            result = await func(*args, **kwargs)
            self.failures = 0  # Reset on success
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure = datetime.now()
            if self.failures >= self.max_failures:
                self._open = True
                self._log("opened", {"failures": self.failures})
            raise

    def _log(self, event: str, data: dict):
        """Append log entry to file."""
        entry = {
            "breaker": self.name,
            "event": event,
            "time": datetime.now().isoformat(),
        }
        entry.update(data)
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
```

---

## 3. Fallback Handling

Fallback is handled by the **caller**, not the circuit breaker:

```python
# In agent or router code:

anthropic_breaker = CircuitBreaker("anthropic", max_failures=3)
openai_breaker = CircuitBreaker("openai", max_failures=3)

async def call_llm(provider: str, prompt: str) -> str:
    """Call LLM with fallback."""
    if provider == "anthropic":
        breaker = anthropic_breaker
    else:
        breaker = openai_breaker

    try:
        return await breaker.call(llm.invoke, prompt)
    except Exception:
        # Fallback: try the other provider
        if provider == "anthropic":
            return await openai_breaker.call(fallback_llm.invoke, prompt)
        else:
            return await anthropic_breaker.call(fallback_llm.invoke, prompt)
```

---

## 4. Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max_failures` | 5 | Failures before opening circuit |
| `reset_after_seconds` | 30 | Seconds before trying again |

---

## 5. Logging

Logs appended to `.opencode/logs/circuit-breakers.json`:

```json
{"breaker": "anthropic", "event": "opened", "time": "2026-02-07T10:30:00Z", "failures": 5}
{"breaker": "anthropic", "event": "rejected", "time": "2026-02-07T10:30:05Z", "reason": "circuit_open"}
```

---

## 6. Manual Override

```python
# In agent code:
breaker = CircuitBreaker("builder")

# Force open (block all requests)
breaker._open = True

# Force close (allow all requests)
breaker._open = False
breaker.failures = 0

# Reset completely
breaker._open = False
breaker.failures = 0
breaker.last_failure = None
```

---

## 7. File Structure

```
.opencode/
└── skills/
    └── circuit-breaker/
        └── circuit_breaker.py   # One file, ~50 lines
```

---

## 8. Testing

```python
# tests/test_circuit_breaker.py

import pytest
from skills.circuit_breaker import CircuitBreaker

@pytest.mark.asyncio
async def test_opens_after_failures():
    breaker = CircuitBreaker("test", max_failures=3)
    
    call_count = 0
    async def failing_func():
        nonlocal call_count
        call_count += 1
        raise Exception("fail")
    
    # 3 failures open the circuit
    for _ in range(3):
        with pytest.raises(Exception):
            await breaker.call(failing_func)
    
    assert breaker.is_open is True
    assert call_count == 3

@pytest.mark.asyncio
async def test_rejects_when_open():
    breaker = CircuitBreaker("test", max_failures=1)
    
    async def fail():
        raise Exception("fail")
    
    await breaker.call(fail)  # First call fails, opens circuit
    
    with pytest.raises(Exception, match="is open"):
        await breaker.call(fail)  # Should be rejected

@pytest.mark.asyncio
async def test_resets_on_success():
    breaker = CircuitBreaker("test", max_failures=3)
    
    async def succeed():
        return "success"
    
    await breaker.call(succeed)
    assert breaker.failures == 0
    assert breaker.is_open is False
```

---

## 9. Integration Points

| Component | Integration |
|-----------|-------------|
| **LLM Client** | Wrap `invoke()` calls with `breaker.call()` |
| **Agent** | Wrap main execution with `breaker.call()` |
| **Router** | Wrap routing decisions with `breaker.call()` |

---

## 10. Out of Scope (Phase 2)

- Metrics dashboard
- Dynamic threshold adjustment
- Cross-agent coordination
- Distributed state (Redis)
- AI-powered failure prediction

---

## 11. Summary

| Aspect | Implementation |
|--------|----------------|
| **Code** | One class, ~50 lines |
| **Files** | 1 Python file + tests |
| **Dependencies** | Python stdlib only |
| **State** | Local (in-memory) |
| **Fallback** | Caller handles |

---

## Approval

| Phase | Status | Date |
|-------|--------|------|
| Discovery (REQ) | Approved | 2026-02-07 |
| Architecture (TECHSPEC) | **Pending** | 2026-02-07 |

---

**Document Status:** Ready for User Approval  
**Next Step:** User approves → Implementation (Builder writes ~50 lines of code)