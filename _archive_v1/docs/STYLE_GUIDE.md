# UI Style & Design Guidelines: Dream News

## 1. Visual Identity: "Dynamic Intel"

Representing the intersection of editorial journalism and high-performance intelligence.

### 🎨 Color Palette

| Token             | Hex       | Role                                               |
| :---------------- | :-------- | :------------------------------------------------- |
| `--charcoal`      | `#1A1A1A` | Main intelligence sections, synthesis backgrounds  |
| `--off-white`     | `#F8F9FA` | Data rooms, knowledge grids, source lists          |
| `--chrome-yellow` | `#FFCC00` | Accents, scores, steering focus, interactive icons |
| `--sage`          | `#10B981` | Positive trends, high signal integrity             |

## 2. Typography Hierarchy

- **System Font**: `Inter` (Sans-serif) for all UI levels.
- **Narrative Headline**: `font-black text-4xl tracking-tighter` (Hero/Synthesis).
- **Sub-Metadata**: `font-black text-[9px] uppercase tracking-widest` (Labels/Date).
- **Side Meta**: Rotated 90° text for secondary editorial info.

## 3. Interaction Design ("Premium Motion")

### A. Card Dynamics

- **Rest State**: Border-gray-100, zero shadow.
- **Hover Path**: `scale: 1.02`, `shadow-xl`, `border-chrome-yellow/30`.
- **Expansion**: Vertical spring animation for revealing "Why it matters".

### B. Steering & Chat

- **Atmospheric UI**: The chat window shouldn't be a modal; it should be an "envelope"—a wider container that wraps the input bar.
- **Micro-Animations**: Use "Pulse" on active knobs and "Sparkle" icons for AI generation states.

## 4. Layout Principles (Density over Spacing)

- **The Collection**: High-density 2-column grid. Prioritize scanability of the "Toggle" vs "Source Name".
- **The Hero**: Compact (50vh) to ensure the first set of Story Clusters is visible above the fold.
- **Label Rotations**: Use `rotate-90` for vertical labels to anchor large blocks of text without adding horizontal bulk.

## 5. CSS Utility Standards

Use these classes for consistent "High-Integrity" UI:

- `.section-dark`: Charcoal background + White text.
- `.section-light`: Off-white background + Dark text.
- `.card-interactive`: Base logic for hover/expansion states.
