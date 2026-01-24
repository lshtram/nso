# Wise Prompting & Vibe Consolidation

Vibe coding is fast, but prone to "Architectural Debt" if the intent isn't grounded. Use these principles to bridge the gap.

## 1. The Vibe-to-Prompt Pipeline

When you receive a loose request ("Make the dashboard cooler"):

1. **Deconstruct the Vibe**: Identify the underlying technical categories (UI/UX, Data Flow, Feedback).
2. **Apply Multi-Step Refinement**:
   - **Step A**: Draft the raw intent.
   - **Step B**: Apply a critique (e.g., "What is missing in the error state?").
   - **Step C**: Finalize as a "Wise Prompt".
3. **Wise Questions**: Before writing a single line of spec, ask the user:
   - "Is this for a 5-minute scan or a deep-dive exploration?"
   - "Should the system prioritize accuracy (slow) or speed (stale data allowed)?"
4. **Default Selection Protocol**: To maintain "vibe momentum," always provide a default path.
   - _Example_: "Should the cluster handle 404s by retrying or muting? **Rec**: Mute and log to dashboard. (Selecting by default unless changed)."

## 2. Wise Prompt Anatomy

A high-integrity requirement or prompt should contain:

- **Context Role**: "Acting as a Senior Frontend Architect..."
- **Constraint Boundaries**: "Avoid external libraries; use vanilla CSS."
- **Positive Examples**: "Design should feel like [Reference Site] or [Component X]."
- **Negative Constraints**: "DO NOT use placeholders like Lorem Ipsum."
- **Acceptance Boundary**: "Success is defined by [Testable Metric]."

## 3. The "Self-Ask" Protocol (Anti-Hallucination)

Before finalizing a PRD, the agent must ask itself:

- "Did I assume a library version exists?"
- "Did I describe a flow that contradicts the global `TECH_SPEC.md`?"
- "Is this requirement granular enough that 100 lines of code could satisfy it?"

## 4. Sequential Prompting for Logic

Complex features should not be one giant requirement. Break them into sequential "beats":

- **Beat 1: The Skeleton** (Data structure + Empty UI)
- **Beat 2: The Pulse** (Main logic + Happy Path)
- **Beat 3: The Shield** (Error handling + Security)
- **Beat 4: The Polish** (Animations + A11y)
