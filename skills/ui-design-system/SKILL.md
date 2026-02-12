---
name: ui-design-system
description: Comprehensive UI/UX design system skill — component generation, design tokens, accessibility, and responsive design.
agents: [Designer]
workflows: [BUILD]
---

# UI Design System — Component Generation & Quality Skill

**Agent:** Designer
**Phase:** Discovery (mockups) and Implementation (component specs)
**Priority:** Load when UI work is involved

---

## IRON LAW

**Every component MUST be accessible, responsive, and token-based. No exceptions.**

If you can't make it accessible, use a headless primitive (Radix UI, React Aria, Reka UI).

---

## Decision Framework: Before Creating Any Component

```
1. Does it already exist in the project's components/ui/?
   → YES: Use it. Compose it. Don't rebuild.
   → NO: Continue.

2. Can existing atoms be composed to achieve this?
   → YES: Compose. Don't abstract.
   → NO: Continue.

3. Will it be used ≥ 3 times?
   → NO: Build inline. Don't abstract prematurely.
   → YES: Continue.

4. Can you define clear variant/size props?
   → NO: It's too complex. Break it down.
   → YES: Create the component.
```

---

## Component Architecture Standard

### The Canonical Component Skeleton (CVA + forwardRef)

This is the **de facto standard** across shadcn/ui, v0.dev, and modern React design systems:

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const componentVariants = cva(
  // Base classes — always applied
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

interface ComponentProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof componentVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ComponentProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(componentVariants({ variant, size }), className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";
```

### Key Rules
- **Always** `forwardRef` — parents need DOM access
- **Always** extend native HTML props (`ComponentPropsWithoutRef<"element">`)
- **Always** use `cn()` to merge classNames — never override
- **Always** set `displayName` for DevTools
- **Composition over configuration** — use `children` and sub-components, not config props

### Compound Component Pattern (Preferred for Complex Components)

```tsx
// GOOD: Composition
<Card>
  <Card.Header><Card.Title>Title</Card.Title></Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>

// BAD: Prop explosion
<Card title="Title" content="Content" footerContent="Actions" />
```

---

## Design Tokens Architecture (Three-Tier)

| Tier | Purpose | Example |
|------|---------|---------|
| **Primitive** | Raw values | `blue-500: #3b82f6` |
| **Semantic** | Contextual meaning | `--color-primary: var(--blue-600)` |
| **Component** | Scoped usage | `--button-bg: var(--color-primary)` |

### Critical Token Rules
- ✅ Name tokens by **purpose**, not appearance (`text-primary` not `text-dark`)
- ✅ Use CSS variables for runtime theming (`var(--color-primary)`)
- ✅ Use `clamp()` for fluid typography: `font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem)`
- ✅ 4px/8px grid spacing system
- ❌ Never hardcode hex values in components — always use semantic tokens
- ❌ Never use arbitrary magic numbers — always reference tokens

### Spacing Scale
```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-24: 6rem;    /* 96px */
```

---

## Accessibility Checklist (Diff-First)

**Audit only what changed.** Don't re-audit the entire app on every PR.

### Semantics and Structure
- [ ] Headings follow order and are not skipped (`h1` → `h2` → `h3`)
- [ ] Interactive elements are `<button>` or `<a>`, not `<div onClick>`
- [ ] Landmarks present for new regions (`main`, `nav`, `header`, `footer`, `aside`)
- [ ] Lists and tables use correct semantic elements

### Labels and Names
- [ ] All inputs have labels (`<label htmlFor>`, `aria-label`, or `aria-labelledby`)
- [ ] Icon-only controls have accessible names (`aria-label`)
- [ ] Helper text connected via `aria-describedby`

### Keyboard and Focus
- [ ] All interactive elements are keyboard reachable and operable
- [ ] Focus order follows DOM order (avoid `tabIndex > 0`)
- [ ] Dialogs/menus trap focus and return focus to trigger on close
- [ ] Custom focus rings: `≥2px` thick, `≥3:1` contrast ratio

### ARIA Correctness
- [ ] ARIA used only when native semantics are insufficient
- [ ] `aria-expanded`/`aria-controls`/`aria-pressed` reflect actual state
- [ ] `role` is correct and not redundant with native element

### Visual and Motion
- [ ] Text contrast: `≥4.5:1` (normal text), `≥3:1` (large text)
- [ ] UI component contrast: `≥3:1`
- [ ] Color is not the only indicator of state
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Interactive targets: `≥24x24` CSS pixels (WCAG 2.5.8)

### Quick Fix Patterns

| Issue | Fix |
|-------|-----|
| Icon-only button | Add `aria-label` |
| Clickable `<div>` | Convert to `<button>` |
| Missing form label | Add `<label htmlFor>` or `aria-labelledby` |
| Disclosure/accordion | Toggle uses `aria-expanded` + `aria-controls` |
| Dialog | `role="dialog"`, `aria-modal`, label by heading, return focus on close |

---

## Responsive Design Strategy

### Priority Order
1. **Container Queries** (`@container`) for component-level responsiveness
2. **Fluid tokens** (`clamp()`) for typography and spacing
3. **Media queries** only for layout-level breakpoints

### Container Query Pattern
```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card { grid-template-columns: 1fr 1fr; }
}
```

### Mobile-First Breakpoints
```css
/* Default: mobile */
/* sm: 640px */
/* md: 768px */
/* lg: 1024px */
/* xl: 1280px */
/* 2xl: 1536px */
```

---

## Interaction Design Timing

| Duration | Use Case |
|----------|----------|
| 100-150ms | Micro-feedback (hovers, button presses) |
| 200-300ms | Small transitions (toggles, dropdowns) |
| 300-500ms | Medium transitions (modals, page changes) |
| 500ms+ | Complex choreographed animations |

### Required: Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Anti-Slop Rules

These patterns are **FORBIDDEN** — they are hallmarks of lazy AI-generated UI:

- ❌ Excessive centered layouts (not everything centers)
- ❌ Purple/gradient backgrounds on everything
- ❌ Uniform border-radius on every element
- ❌ "Inter" font as the only choice without consideration
- ❌ Oversized hero sections with no content
- ❌ Emoji as visual design (icons exist)
- ❌ Placeholder text left in production mockups

Instead:
- ✅ Left-align by default, center intentionally
- ✅ Use the project's actual color palette
- ✅ Vary border-radius by component purpose
- ✅ Choose typography intentionally for the project's voice
- ✅ Density-appropriate layouts (don't waste space)

---

## Component Documentation Template

Every new component should be documented with:

1. **Purpose** — What it does (1-2 sentences)
2. **Usage** — Import + minimal code example
3. **Variants** — All visual variants with descriptions
4. **Props** — Complete table (name, type, default, description)
5. **Accessibility** — Keyboard support, ARIA, screen reader behavior
6. **Examples** — Real usage scenarios (loading, disabled, controlled, etc.)

---

## Testing Patterns

- **Always** use semantic queries: `getByRole`, `getByLabelText`, `getByText`
- **Never** rely on `data-testid` as the primary query
- Test keyboard navigation for every interactive component
- Test `prefers-reduced-motion` with mocked media query
- Test all variants render correctly

---

## File Organization

```
src/
  components/
    ui/               # Design system atoms (Button, Input, Card, etc.)
    [feature]/        # Feature-specific compositions
  hooks/              # Custom React hooks
  lib/
    utils.ts          # cn() and utility functions
  styles/
    globals.css       # CSS variables, @theme, base styles
```

---

## Integration

- **Triggered by:** Oracle during BUILD when UI work is detected
- **Input:** REQ document with UI requirements
- **Output:** Component specs, mockup descriptions, accessibility requirements
- **Feeds into:** Builder's implementation contract
