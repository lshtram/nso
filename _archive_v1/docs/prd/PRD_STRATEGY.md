# PRD: Dream News Strategy (DNS)

> **Status**: Approved
> **Requirement Prefix**: `REQ-STRAT-`

## 1. Core Principles (Non-Negotiable)

| Principle                  | Description                                                                   |
| :------------------------- | :---------------------------------------------------------------------------- |
| **Narrative First**        | Synthesis > Lists. Daily output must answer "What's going on and why?".       |
| **Aggressive Suppression** | Surfacing only the top signal. Wasting attention is the primary failure mode. |
| **Signal Explainability**  | Every item must answer "Why am I seeing this?".                               |
| **Energy Awareness**       | UX optimized for fluctuating cognitive bandwidth (5-min scan vs 60-min dive). |

## 2. Target User & Market Fit

- **User**: High curiosity, limited time. Values synthesis over novelty.
- **Constraints**: Single-user, private instance. No social/sharing features.

## 3. Success Criteria

- **Engagement Depth**: User actively interacts with cluster details.
- **Steering Frequency**: User provides prompt-based feedback to the "Brain".
- **Habit Formation**: Daily open rate of the "Daily Spark" email.

## 4. Explicit Non-Goals

- **No Social Features**: No follows, likes, or comments.
- **No Real-Time Alerts**: The system is for "Reflection", not "Reaction".
- **No Manual Tagging**: System must handle categorization automatically via LLM/embeddings.

## 5. Build Order Roadmap

1. **v1 (MVP)**: Canonical Schemas, Mock Clusters, Hero Summary, List View.
2. **v2 (Intelligence)**: Real RSS/GitHub Connectors, Embedding Clustering, Ranking.
3. **v3 (Dynamics)**: Interest EQ, Steering Bar integration, Deep Dive Research Pane.
