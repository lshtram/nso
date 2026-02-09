# Multi-Perspective Audit (MPA): Dream News Core

## 1. User Perspective

- **Goal**: Personal "World Model" update in < 5 mins.
- **Value**: High signal-to-noise ratio; prevents attention fatigue.
- **Vibe**: Sophisticated, "Always On" intelligence assistant.

## 2. Frontend Perspective

- **Architecture**: Next.js 14 App Router (Server Components for data, Client Components for steering).
- **Design Tokens**: Defined in `globals.css` (Chrome Yellow, Deep Charcoal).
- **Interactions**: Framer Motion for steering transitions and card expansions.

## 3. Backend Perspective

- **Architecture**: Modular Connector Pattern (RSS, GitHub, YT).
- **Data Flow**: Normalizer -> Clustering -> Ranking -> Synthesis.
- **Persistence**: JSON (current) / Supabase (target).

## 4. Quality Perspective

- **Signal Integrity**: Every story must have a "Why Ranked" and "Integrity Score".
- **Deduplication**: Aggressive embedding-based cleanup is critical for user trust.

## 5. Security Perspective

- **Isolation**: Single-user instance, but RLS required for future-proofing personal data.
- **Provider Choice**: Configurable LLM choice (cost vs. quality tier).

## 6. Performance Perspective

- **Ingestion**: Async edge workers to prevent main thread blocking during large batch ingestion.
- **Rendering**: Heavy use of partial prerendering (PPR) for the static narrative + dynamic widgets.

## 7. Testing Perspective

- **Architecture**: Connectivity tests for each source. Logic tests for clustering heuristics.
- **Path**: `tests/core/`
