# Technical Specification: Dream News

## 1. System Architecture

The system is designed with a **Modular Separation of Concerns** to ensure that any component (Ingestion, Brain, UI) can be evolved or replaced independently.

```mermaid
flowchart TD
    subgraph Ingestion["Ingestion Layer"]
        RSS["RSS Connector"]
        GH["GitHub Connector"]
        YT["YouTube Connector"]
        MD["Medium Connector"]
    end

    subgraph Intelligence["Intelligence Layer (The Brain)"]
        Norm["Normalizer"]
        Clust["Clustering Engine"]
        Rank["Ranking Model"]
        Synth["Synthesis Engine"]
    end

    subgraph Presentation["Presentation Layer (UI)"]
        Dashboard["Dynamic Dashboard"]
        Collection["Source Room"]
        DeepDive["Deep Dive View"]
        Terminal["Brain Command Bar"]
    end

    Ingestion -->|Raw Data| Norm
    Norm -->|ContentItems| Clust
    Clust -->|StoryClusters| Rank
    Rank -->|Ranked Data| Synth
    Synth -->|Intel Output| Presentation
    Terminal -->|Steering Prompts| Rank
    Terminal -->|Config| Ingestion
```

## 2. Component Breakdown

### A. Ingestion Architecture (Connector Pattern)

Every source implements a standard Interface:

```typescript
interface Connector {
  discover(): Promise<RawItem[]>;
  hydrate(id: string): Promise<FullContent>;
  normalize(raw: RawItem): ContentItem;
}
```

- **RSS**: Standard XML parser.
- **YouTube**: Transcript fetcher.
- **Medium/Dev.to**: Scraping or API-based fetcher.

### B. Canonical Intelligence Pipeline (Steerable & Interchangeable)

The system processes data in strictly ordered stages. Each stage is an interchangeable module implementing a **Steerable Interface**:

```typescript
interface SteerableComponent<TInput, TOutput> {
  process(input: TInput, context: SteeringContext): Promise<TOutput>;
}

interface SteeringContext {
  globalStrategy: string; // Current focus (e.g., "Deep tech priority")
  componentPrompts?: string[]; // Specific overrides for this stage
  parameters: Record<string, any>; // Numeric weights/thresholds
}
```

#### Pipeline Stages:

The system processes data in 11 strictly ordered modular stages. Every stage is a standalone component verified by dedicated integration tests.

1.  **Discovery**: Collect raw pointers via Connector `discover()`. [Test: `01_discovery.integration.test.ts`]
2.  **Deduplication (URL)**: Filter out previously seen URLs using a scalable batch check. [Test: `02_deduplication.integration.test.ts`]
3.  **Noise Filter**: Heuristic removal of low-signal content (sponsored, roundups). [Test: `03_noise_filter.integration.test.ts`]
4.  **Triage**: Neural ranking of discovered items to prioritize heavy scraping. [Test: `04_triage.integration.test.ts`]
5.  **Hydration**: Full content extraction/scraping of prioritized leads. [Test: `05_hydration.integration.test.ts`]
6.  **Embedding**: Generation of semantic vector representations. [Test: `06_embedding.integration.test.ts`]
7.  **Semantic Deduplication**: Near-duplicate resolution via vector similarity (>0.95). [Test: `07_semantic_deduplication.integration.test.ts`]
8.  **Clustering**: Grouping survivors into narrative story clusters. [Test: `08_clustering.integration.test.ts`]
9.  **Synthesis**: LLM generation of narratives and "Why It Matters". [Test: `09_synthesis.integration.test.ts`]
10. **Scoring**: Final weighted ranking including temporal decay ($\lambda$). [Test: `10_scoring.integration.test.ts`]
11. **Persistence**: Commitment of final state to the repository. [Test: `11_persistence.integration.test.ts`]

### C. The “Brain” Orchestrator

The Brain acts as the **System Conductor**. It translates high-level user prompts (from the Steering Bar) into specific `SteeringContext` for each pipeline stage.

- **Example**: If the user says _"I'm in a hurry, give me just the facts"_, the Brain adjusts:
  - **Summarize Stage**: Pass prompt "Use extremely concise bullet points".
  - **Score Stage**: Boost "Read Time" weight to favor short items.
  - **Dedupe Stage**: Tighten similarity threshold to minimize repetition.

The Brain also produces the primary outputs:

- **Daily Narrative**: The "Macro" summary of the day.
- **Top Clusters & Canonical Items**: The primary ranked output.
- **“Edge” Items**: Content intentionally selected to probe boundaries.

### D. Output Renderers

- **Email Renderer**: Optimized for mobile, short, and scannable snippets.
- **Dashboard Renderer**: Dynamic high-contrast cards, clusters, and ranking explanations.

### C. UI Framework (The Terminal)

- **Framework**: Next.js 15 (App Router).
- **Styles**: Tailwind CSS + Framer Motion (for dynamic transitions).
- **State Management**: React Context or Zustand for "Steering" states.
- **The "Dynamic View"**: A layout that swaps section themes (Charcoal/White) as the user scrolls.

## 3. Data Flow

- **Ingestion**: Daily cron job or serverless function.
- **Storage**: JSON-based (V1) or Supabase (V2).
- **Feedback Loop**: Steering prompts from the UI affect the `Ranking Model` weights in real-time.

## 4. UI Compartmentalization

Each UI section is a self-contained component:

- `<IntelSummary />`: The Dark Hero component.
- `<TopicStream category="TECH" />`: The Light Body modular grid.
- `<SourceCollection />`: The grid of Source Entity cards.
- `<KnowledgeGraph />`: The SVG-based node visualizer.
