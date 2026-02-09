# PRD: Dream News UI (DUI)

> **Status**: Approved
> **Requirement Prefix**: `REQ-UI-`

## 1. Executive Summary

The Presentation Layer implements the "Dynamic Intel" aesthetic—a bold, high-contrast interface that transitions between Deep Charcoal and Off-White to differentiate between "Intelligence" (Synthesis) and "Data" (Sources).

## 2. Multi-Perspective Audit (MPA)

Summarized in `docs/prd/MPA_CORE.md`. Major focus on **Premium Motion** and **High-Density Information Display**.

## 3. User Stories

| ID         | Actor | Action                     | Outcome                                               | Priority |
| :--------- | :---- | :------------------------- | :---------------------------------------------------- | :------- |
| `US-UI-01` | User  | Interacts with interest EQ | Immediate visual feedback on topic weights            | P0       |
| `US-UI-02` | User  | Scrolls through sections   | Background color shifts seamlessly between dark/light | P0       |
| `US-UI-03` | User  | Enters Steering Chat       | Window "envelopes" the input for a unified feel       | P1       |

## 4. UI Components & Interaction Models

### 4.1 Story Cluster Card

Each card represents a semantic cluster. Requirements:

- **Header**: Generated high-integrity title + trend indicator (Rising/Stable).
- **Body**: 1-sentence cluster narrative + "Why this matters".
- **Items**: 3-5 source icons (favicon-style) with tooltips.
- **Actions**: Open Detail, Mute Cluster, Re-rank Feedback.

### 4.2 Cluster Detail View

- **Research Pane**: Dual-layout showing original content + AI overlay.
- **Knowledge Map**: SVG-based relationship nodes for the cluster's entities.
- **Explainability Module**: Direct look at the ranking signals for this specific cluster.

### 4.3 Daily Email (The Spark)

- **Philosophy**: Skimmable < 2 mins.
- **Structure**:
  - `Must Reads`: 1-3 critical items.
  - `Narrative`: High-level summary of the day's themes.
  - `Engagement`: "30 other clusters waiting in your dashboard."

## 5. Functional Requirements

| ID           | Requirement       | Acceptance Criteria                                                                                | Verification Path           |
| :----------- | :---------------- | :------------------------------------------------------------------------------------------------- | :-------------------------- |
| `REQ-UI-001` | **Dynamic Hero**  | Top 50vh height; background transitions on scroll                                                  | `tests/ui/hero.spec.ts`     |
| `REQ-UI-002` | **2-Column Grid** | Source Room displays nodes in high-density grid with unified toggles                               | `tests/ui/grid.spec.ts`     |
| `REQ-UI-003` | **Integrated EQ** | Widget expands from hero into a full-control module (Technology, Philosophy, Geopolitics, Science) | `tests/ui/eq.spec.ts`       |
| `REQ-UI-004` | **Steering Bar**  | Persistent input for prompt-based re-ranking (Vibe Steering)                                       | `tests/ui/steering.spec.ts` |

## 6. Premium Motion Guidelines

- **Hover**: 1.02x scale + shadow-2xl (Tween: 0.2s).
- **Expansion**: Spring animation (Stiffness 300, Damping 30).
- **Enveloping Chat**: Modal wider than input (+20px both sides) with bottom overlap.
