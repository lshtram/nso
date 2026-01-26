# 🏗️ Ingestion Pipeline Architecture Review (V2)

**Date**: 2026-01-25
**Scope**: `src/lib/pipeline` and `src/lib/brain`

## 🚨 Critical Architecture Update (Response to Audit)

The user correctly identified that a "Generic Pipeline" (`Input -> Output`) is insufficient and potentially dangerous for this application. The data volume and compute cost varies drastically between stages.

**The Pipeline must be a "Funnel", not a "Loop".**

### Funnel Metrics

1.  **Stage 1: Discovery** (Wide)
    - **Input**: ~50 Source Feeds.
    - **Volume**: ~1,000 TITLES (Lightweight).
    - **Cost**: Low (HTTP HEAD/XML parsing).
    - **Output**: `DiscoveredItem[]`.
2.  **Stage 2: Triage** (Filter)
    - **Input**: ~1,000 Titles.
    - **Action**: LLM "Quick Scan" (Batch Ranking).
    - **Reduction**: 95% Drop rate.
    - **Output**: ~50 Highest-Signal Items.
3.  **Stage 3: Hydration** (Deep)
    - **Input**: ~50 Items.
    - **Action**: Full page scraping (Headless Browser/Puppeteer).
    - **Cost**: VERY HIGH (Time & Bandwidth).
    - **Output**: `HydratedItem[]` (Full Text).
4.  **Stage 4: Synthesis** (Complex)
    - **Input**: `HydratedItem[]`
    - **Action**: O(N^2) Clustering & Summarization.
    - **Output**: ~10 `StoryCluster[]`.

---

## 1. The New "Typed Contract"

We have established strict contracts in `src/lib/pipeline/types.ts`.

### A. The "Brain Control Plane"

The `PipelineControlParams` interfaces allows the brain to tune specific bottlenecks dynamically:

```json
{
  "triage": {
    "noiseThreshold": 0.4,
    "maxHydrationLimit": 30
  },
  "clustering": {
    "algorithm": "hierarchical",
    "epsilon": 0.75
  }
}
```

This JSON moves `const` magic numbers out of the code and into the Brain's reasoning context.

### B. The Database Abstraction (`IngestionRepository`)

Since the app currently uses "snapshots" (flat files), we have defined an `IngestionRepository` interface. This allows us to swap the current file-system hack with a real **PostgreSQL/VectorDB** implementation later without changing the pipeline logic.

---

## 2. Immediate Refactoring Plan

We will now refactor `orchestrator.ts` to enforce this Typed Funnel.

### Step 1: Implement `PipelineStage` wrappers

We will wrap the existing helper classes (`deduplicator.ts`, `clusterer.ts`) into standard stages that accept `PipelineControlParams`.

### Step 2: Invert Control in Orchestrator

The Orchestrator will no longer instantiate `new Clusterer()`. Instead, it will look like this:

```typescript
// The layout of the pipeline is explicit and hard-typed
const results = await this.discoveryMap.run(sources, controls, ctx);
const triage = await this.triageFilter.run(results, controls, ctx); // 1000 -> 50
const full = await this.hydrator.run(triage, controls, ctx); // Light -> Heavy
const stories = await this.synthesizer.run(full, controls, ctx);
```

This preserves the **Types** (checking that we don't accidentally pass heavy data to a light function) while allowing **Parameter Injection**.

---

## 3. Verification

- [x] Defined `PipelineControlParams` Schema.
- [x] Defined `DiscoveredItem` vs `HydratedItem` types.
- [ ] Refactor `Orchestrator` to using injected params.
