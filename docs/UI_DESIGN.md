# UI Design Specification: Dream News

## 1. Visual Identity (The "Dynamic Intel" Aesthetic)

The design follows a "World-Class News Portal" aesthetic—bold, high-contrast, and energetic yet sophisticated.

- **Theme**: **Dynamic Contrast** (Alternating Deep Charcoal sections with clean, spacious Off-White sections).
- **Primary Color**: **Chrome Yellow** (#FFCC00) or **Vibrant Indigo** for priority markers and highlights.
- **Typography**:
  - **Display**: Bold, geometric sans-serif (e.g., Montserrat/Gilroy) for narrative headlines.
  - **Substance**: Premium editorial sans (e.g., Inter) for body and metadata.
- **Aesthetic**: Edge-to-edge layouts, sharp modular cards, large imagery/visuals, and fluid typography.
- **Unity**: A shared grid system where the background shifts between dark and light to define context.

## 2. Core Components

### A. The Dashboard (The Dynamic Board)

- **Hero Intelligence Summary (Dark Section)**:
  - **Background**: Deep Charcoal (#1A1A1A).
  - **Narrative Overlay**: A substantial 3-4 paragraph "State of the World" summary using bold, vibrant typography (Chrome Yellow/White).
  - **Integrated Links**: Underlined entity links that jump down to relevant Story Cards.
  - **Visual**: A large, abstract "Global Intel Map" or metadata visualization.
- **The Intelligence Streams (Light Section)**:
  - **Background**: Clean Off-White / Light Gray.
  - **Topic Headers**: Bold, oversized labels: [TECH], [POLITICS], [CULTURE], [COOKING].
  - **Modular Source Cards**:
    - **Hierarchy**: High-priority items use wide cards with featured images. Lower priority use compact 3-column grid.
    - **Content**: Explicit source label (e.g. "Nate Jones - YouTube") + Bold summary title + 2-line "Synthesis".
    - **Interactions**: Hover scales the card and reveals "Action: Save to Deep Dive".

### B. The "Brain Command" (Persistent Steering)

- **Concept**: Direct access to the LLM Brain.
- **Design**: Clean, understated top or bottom search-style bar.
- **Aesthetic**: Matches the "Paper" theme. Minimalist.
- **Direct Output**: Can trigger re-ordering of the dashboard or discovery of new sources.

### C. The Collection (Source Room - Dynamic)

- **Strategy & Search Header (Dark Section)**:
  - **Background**: Deep Charcoal.
  - **Search**: Centered, high-end search bar with Chrome Yellow focus states.
  - **Filters**: Vibrant, colored pills for [YouTube], [RSS], [Medium].
- **The Collection Grid (Light Section)**:
  - **Background**: Off-White.
  - **Specific Source Cards**:
    - **Branding**: High-quality logo of the entity (e.g. Nate Jones).
    - **Identity**: "Nate Jones" (Entity) — "YouTube Channel" (Type).
    - **Status**: Sleek toggle, "High Signal" badge.
  - **Global Action**: Sharp "Add New Source" primary button.

### D. The Deep Dive (Dynamic Article Explorer)

- **Intelligence Overlay Header (Dark Section)**:
  - **Background**: Deep Charcoal.
  - **Content**: Massive editorial headline + 2-3 paragraph "Core Intelligence" synthesis.
  - **Style**: Bold white/yellow typography with high-impact pull quotes.
- **The Research Pane (Light Section)**:
  - **Background**: Off-White.
  - **Layout**: Dual-pane.
    - **Left**: Original source (architectural, clean text).
    - **Right**: "AI Analyst" module with node-graph "Knowledge Map" and entity pills.

### E. The Gateway Email (The Spark)

- **Minimalist Delivery**: Driven by the "Must Read" philosophy.
- **Visuals**: Clean typography, 1-3 "Must Read" cards, link to Terminal.

## 3. Interaction Flow

1. **Email Arrival**: User scans "Must Reads" in < 2 mins.
2. **Dashboard Landing**: User reads the comprehensive "Daily Summary" and follows links.
3. **Brain Interaction**: User types a command to evolve the model (e.g. "Focus on Jazz this week").
4. **Deep Dive**: User engages with a specific source to read original content + AI overlay.
5. **Collection Management**: User navigates to 'The Collection' to manage specific entities and filters.
