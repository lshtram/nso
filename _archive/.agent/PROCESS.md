# AGENTIC SDLC (Strictness: S-3 High-Integrity)

You MUST follow these gates in sequence. At every [GATE], stop and wait for user approval.

0. **Workspace Setup**: Initialize the parallel environment.
   - **Action**: Use the `start_task` skill. See [PARALLEL_WORKFLOW.md](../docs/PARALLEL_WORKFLOW.md).
   - **Constraint**: Immediately switch context to `.worktrees/<feature-name>`. Do not verify or edit in the root.
1. **Requirements & PRD**: Scan relevant files; flag potential risks.
   - **Action**: Use `researching-and-browsing` for deep industry analysis or competitor research if required.
   - **Check**: Verify consistency against `docs/PRD_Core_Framework.md` (Master PRD). Feature PRDs must be a strict subset or extension, not a contradiction.
   - **Artifact**: Create `docs/PRD_<FeatureName>.md` (e.g., `PRD_FileSystem.md`). Do NOT use generic `PRD.md`.
2. **Tech Spec & Architecture**: Generate `docs/TECH_SPEC.md` (renamed from scratchpad).
   - **Fact-Check**: Use `researching-and-browsing` (Anti-Hallucination protocol) to verify API signatures and library versions.
   - **[GATE]**: User must approve the Technical Specification.
3. **UI Prototyping (Code-First)**: For any new UI, create `prototypes/<feature>.html`.
   - **Constraint**: Pure HTML/CSS (Tailwind allowed if configured). No React/Build steps yet. Faster iteration.
   - **[GATE]**: User approves layout and flow.
4. **Implementation**: Build in modular, reviewable chunks (<200 lines). Enforce patterns via `pattern-enforcement`.
5. **Static Verification**: Run `.agent/scripts/verify.py --lint --types`.
   - **Requirement**: Must be syntactically perfect before proceeding.
6. **Unit Testing**: Run `.agent/scripts/verify.py --unit`.
   - **Requirement**: TDD loop must pass 100%.
   - **[GATE]**: **Functional Check**. Verify implementation matches `docs/PRD.md`.
7. **E2E Validation**: Run `.agent/scripts/verify.py --e2e`.
8. **User QA Transfer**: Generate a concise "Review Note" for the manual vibe check.
9. **Post-Mortem & Introspection**: Analyze the task process.
   - **Action**: Use the `agent-introspecting` skill to identify friction points and operational inefficiencies.
10. **Doc Sync (CRITICAL)**:
    - **Update Requirements**: Mark relevant PRD items as ✅ (Pass) in `docs/PRD_Core_Framework.md` and feature-specific PRDs.
    - **Traceability**: Update `docs/TEST_REPORT.md` with new test files and their status.
    - **Doc Audit**: Check if architecture diagrams or API docs need updates using `doc-maintainer`.
11. **Learning Loop & Memory Update**:
    - **Knowledge Integration**: Use `knowledge-integration` to propose updates to `.agent/GUIDELINES.md` or `CODING_STYLE.md`.
    - **Skill Evolution**: Use `skill-builder` if the introspection identified a need for a new skill or a refactor of an existing one.
    - **[GATE]**: User signs off on "Agent Memory Update."
