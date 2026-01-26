# PRD: Dream News Core (DNC)

> **Status**: Approved
> **Requirement Prefix**: `REQ-CORE-`

## 1. Executive Summary

Dream News is a low-maintenance personal intelligence system that ingests massive volumes of heterogeneous data to synthesize a daily narrative-driven digest. It prioritizes "Signal > Noise" and "Time-to-Understanding".

## 2. Multi-Perspective Audit (MPA)

Summarized in `docs/prd/MPA_CORE.md`. Major focus on **Signal Integrity** and **Autonomic Steering**.

## 3. User Stories

| ID           | Actor | Action                | Outcome                                                   | Priority |
| :----------- | :---- | :-------------------- | :-------------------------------------------------------- | :------- |
| `US-CORE-01` | User  | Scans daily narrative | Understands the day's global themes in < 60s              | P0       |
| `US-CORE-02` | User  | Adjusts Interest EQ   | Real-time re-ranking of the dashboard content             | P0       |
| `US-CORE-03` | User  | Switches to Deep Dive | Reads original source with an AI-synthesized context pane | P1       |

## 4. Information Models

### 4.1 ContentItem (Atomic Input)

Detailed in `docs/PIPELINE_ARCHITECTURE.md`. Key fields: `id`, `sourceType`, `rawText`, `summary`, `embedding`.

### 4.2 StoryCluster (Primary Output)

Detailed in `docs/PIPELINE_ARCHITECTURE.md`. Key fields: `generatedTitle`, `narrative`, `whyItMatters`, `items[]`, `scores`.

## 5. The Steerable Intelligence Pipeline

The engine follows a strict 9-stage sequence. See **`docs/PIPELINE_ARCHITECTURE.md`** for the formal definition of Stage responsibilities.

### 5.1 Special Handling: Stage 4 (Scrutiny)

Stage 4 is the "Intelligence Gate."

- **Contradiction Detection**: LLM cross-references multiple items in a cluster to identify factual disagreements. If conflicts are found, the system generates a **Conflict Summary** to be displayed later in the Deep Dive.
- **Credibility Selection**: Instead of simple dedupe, the system selects a **Canonical Survival Item** based on source weight and content integrity (Stage 4 Scrutiny).

### 5.2 Special Handling: Stage 7 (Ranking & Decay)

- **Cluster-Level Scoring**: Ranking signals are calculated for the aggregate **StoryCluster**. Two clusters on the same topic will have different scores based on Stage 4 Scrutiny (detail, credibility).
- **Independent Dimensions**: High Momentum (Virality) does not strictly imply High Interest (Relevance). Ranking is multi-dimensional.
- **Daily Persistence**: Temporal decay ($e^{-\lambda t}$) is calculated and cached once per 24-hour window to ensure UI stability.
- **Topic Half-Life**: $\lambda$ values are default-assigned by the LLM based on topic volatility (Gossip vs. Philosophy).

### 5.4 Scalability: The Ingestion Funnel

To handle **1000+ sources** per user, the system implements a tiered funnel:

- **Bulk Discovery**: Parallel polling of metadata only.
- **Intelligent Triage**: Interests-based ranking and **Noise Suppression** (automatic removal of version tags `v1.2` and release technicalities) _before_ high-cost operations.
- **Selective Hydration**: Full scraping (Mozilla Readability) and semantic analysis only for top-ranked signals.

### 5.6 Tiered Brain Strategy (Cost-Performance Optimization)

The system implements a dual-model approach for the intelligence layer:

- **Low Brain (Gemini 1.5 Flash)**: Executes high-volume tasks including **Stage 3 Triage** and **Stage 4 Normalization**. Optimized for speed and low token cost across 1000+ items.
- **High Brain (Gemini 1.5 Pro)**: Reserved for high-stakes reasoning including **Stage 5 Scrutiny** (Contradiction detection) and **Stage 8 Synthesis** (Final Narrative generation).
- **BYOM Implementation**: Configuration driven via `GOOGLE_AI_KEY`. Pipeline fallback to `MockBrain` if keys are absent.

### 5.7 Categorization: Absolute Fit Rule

- The system MUST NOT use "best-fit" logic for categorization.
- Categories (SCIENCE, PHILOSOPHY, GEOPOLITICS) require **Absolute Fit** based on core substance.
- If a signal is ambiguous but within the tech sphere, it defaults to TECH or GENERAL.

## 6. Functional Requirements

| ID             | Requirement             | Acceptance Criteria                                           | Verification Path          |
| :------------- | :---------------------- | :------------------------------------------------------------ | :------------------------- |
| `REQ-CORE-001` | **Pipeline Strictness** | Data MUST flow through all 9 stages independently             | `tests/pipeline.test.ts`   |
| `REQ-CORE-002` | **Implicit Sync**       | Pull-to-refresh triggers JIT Tiered Ingestion                 | `tests/ui/refresh.spec.ts` |
| `REQ-CORE-003` | **Stage 4 Scrutiny**    | Contradictions are identified and flagged during dedupe phase | `tests/scrutiny.test.ts`   |
| `REQ-CORE-004` | **Daily Cache**         | Decay and Cluster calculations stored for 24h stability       | `tests/caching.test.ts`    |
| `REQ-CORE-005` | **Noise Suppression**   | Automatic exclusion of version bumps and release tags         | `verify_noise.ts`          |
| `REQ-CORE-006` | **Absolute Fit**        | Categorization requires unambiguous matching                  | `tests/brain.test.ts`      |
| `REQ-CORE-010` | **Pulse Structure**     | Deep Dive sidebar split into Brief, Summary, Key Takeaways    | UI Verification            |

## 7. Operational Constraints

- **Polling**: 6-hour cron interval for Stage 1.
- **Storage**: Smart Waste Management (48h Eager Deletion for non-favorites).
- **Images**: **On-Demand Loading**. Images are never stored locally; they are pulled from the source URL only when the user enters the Deep Dive or Dashboard viewport.
- **Hero Image Rule**: Skip hero images in Deep Dive if they are generic or not directly from the source paper.
