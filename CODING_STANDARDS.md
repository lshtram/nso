# Coding Standards & Guidelines

| Version | Date | Status |
|---------|------|--------|
| 1.0.0 | 2026-02-07 | Baseline |

## 1. General Principles
-   **Neuro-Symbolic Compatible:** Code should be easy for both humans and LLMs to understand.
-   **Validation First:** No code is written without a corresponding validation step (test, compile check, or lint).
-   **Atomic Units:** Functions and classes should be small, single-purpose, and testable.

## 2. Style Guide (Polyglot)

### Python
-   **Typing:** Strict type hints (`mypy` strict mode).
-   **Docstrings:** Google-style docstrings for all public methods.
-   **Error Handling:** Use custom exceptions; avoid bare `try/except`.
-   **Dependencies:** Managed via `uv` or `poetry`.

### TypeScript / JavaScript
-   **Strict Mode:** `strict: true` in `tsconfig.json`.
-   **Functional:** Prefer functional patterns (map/reduce/filter) over loops.
-   **Immutability:** Use `const` everywhere possible.
-   **Async:** Always handle rejected promises.

## 3. The "Micro-Loop" Protocol
All Builders must adhere to this cycle:
1.  **Plan:** State the change and the verification method.
2.  **Test:** Create/Update a failing test.
3.  **Implement:** Write the code.
4.  **Verify:** Run the test.
5.  **Refactor:** Cleanup if successful.

## 4. Documentation Standards
-   **Context Engine:** Updates to the tech stack or patterns must be logged in `.opencode/context`.
-   **ADR:** Architectural Decisions Records must be created for significant changes.
