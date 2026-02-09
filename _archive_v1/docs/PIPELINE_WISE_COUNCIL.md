# 🏛️ The Wise Council: Pipeline Architecture Review

**Date**: 2026-01-25
**Subject**: `IngestionOrchestrator` Refactor & `PipelineStage` Interface
**Status**: ACtive Debate

## 🎭 The Council Members

1.  **FE-Arch**: Frontend/Consumer Architect (Focus: UI Consumption)
2.  **Sys-Arch**: Senior Systems Architect (Focus: Modularity & Scale)
3.  **DB-Eng**: Senior Database Engineer (Focus: Persistence & Data Integrity)
4.  **QA-Eng**: Quality & Test Engineer (Focus: Verification)

---

## 🗣️ Round 1: The Opening Statements

### 1. The Systems Architect (Sys-Arch)

"I've reviewed the proposed `PipelineStage` interface and the 'Funnel' model. It's a massive improvement over the current monolithic script. The `PipelineControlParams` injection is critical for the 'Brain-Driven' requirement.
**Approval**: Strong.
**Concern**: The `PipelineContext` is a bit weak. It just holds `telemetry` and `repository`. How do we handle **cancellation**? If the user changes their mind mid-scrape, do we have an `AbortSignal` in there? The current definition misses it."

### 2. The Frontend Architect (FE-Arch)

"I'm looking at the `StoryCluster` and `HydratedItem` types.
**Critique**: You have `summary: string` in `ContentItem`. Is that raw text? Markdown? HTML? The UI needs to know. Also, `StoryCluster` has `narrative` and `whyItMatters`.
**Major Concern**: The 'Funnel' implies we wait until the end to see _anything_. The UI needs **Progressive Disclosure**. Can the `PipelineContext` emit _partial results_ to the UI via Server Sent Events (SSE) or a websocket? The current `onProgress` string callback in the old code was primitive. The new `PipelineContext` doesn't explicitly support streaming _data_, only telemetry."

### 3. The Database Engineer (DB-Eng)

"I see `IngestionRepository` has `persistRawItems` and `saveClusters`.
**Critique**: This is too naive.

1.  **Concurrency**: What happens if two pipelines run at once? We need `upsert` semantics, not just `persist`.
2.  **Versioning**: The `ContentItem` has an ID. If I re-scrape it with a better 'Brain' model, do I overwrite the old one? Or do I keep a history of 'Interpretations'?
3.  **The 'Seen' Set**: `getSeenUrls(windowMs)` returns a `Set<string>`. This works for 1,000 items. It fails for 1,000,000. We need a `checkSeen(urls: string[]): Promise<boolean[]>` batch check, not loading the whole set into memory."

### 4. The QA Engineer (QA-Eng)

"The `PipelineControlParams` is great for testing! I can inject `noiseThreshold: 1.0` to force-fail everything and test empty states.
**Concern**: The `PipelineStage` interface is generic: `run(input, controls, context)`.
How do I type-check that Stage 2 _actually_ outputs what Stage 3 inputs?
In TypeScript, `PipelineStage<Input, Output>` helps, but at runtime, if I chain them dynamically in a JSON array, I lose safety.
**Requirement**: We need a 'Pipeline Manifest' or 'Registry' that strictly enforces: 'Triage Stage OUTPUT = Hydration Stage INPUT'."

---

## ⚔️ Round 2: The Debate (Synthesis)

**Sys-Arch to FE-Arch**: "Good point on Progressive Disclosure. The `PipelineContext` should probably expose an `events` emitter, not just a static repository."

**DB-Eng to Sys-Arch**: "And regarding the `AbortSignal`. If we are scraping 50 pages and the user clicks 'Stop', we need to kill those Puppeteer instances immediately. `context.signal` is mandatory."

**FE-Arch to DB-Eng**: "About Versioning - The user UI just wants the latest 'best' version. I don't want to query a history table. Just give me the current truth. Overwrite is fine for MVP."

**DB-Eng**: "Fair, but the generic `getSeenUrls` loading everything into RAM is a ticking time bomb. I insist on changing that to a batch query."

---

## 📜 The Verdict: Required Changes

The Council has reached a consensus. The proposal is **APPROVED** with the following **MANDATORY AMENDMENTS**:

### 1. `PipelineContext` must include `AbortSignal`

To safely stop heavy hydration tasks.

### 2. `IngestionRepository` Scaling Fix

**Change**: `getSeenUrls(windowMs)` -> `checkSeen(urls: string[])`.
**Reason**: Prevent O(N) memory usage in the Orchestrator.

### 3. `PipelineContext` needs an Event Bus

**Add**: `emit(event: string, payload: any)` to the Context.
**Reason**: To support real-time UI updates (Progressive Disclosure) beyond just text logs.

### 4. Explicit Content Formats

**Update**: Comment/Type definitions for `summary` and `narrative` must specify `Markdown` or `Plaintext`.

### 5. Upsert Semantics

**Update**: `persistRawItems` must explicitly handle conflicts (e.g., `onConflict: 'update'`).

---

## 🚀 Action Plan

1.  **Update `src/lib/pipeline/types.ts`** to reflect the Council's amendments.
2.  **Proceed with Orchestrator Refactor** using the hardened interfaces.
