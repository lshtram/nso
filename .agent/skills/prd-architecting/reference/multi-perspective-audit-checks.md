# The 7-Perspective Audit Checklist

Use this checklist during the `MPA` phase of feature design.

## 1. User Perspective (P0)

- [ ] Does this map to a specific user goal?
- [ ] Is the feedback loop (success/loading/error) clear to the human?
- [ ] Does it maintain design consistency (e.g., Dynamic Contrast)?

## 2. Frontend Perspective (P0)

- [ ] Are the component boundaries clear?
- [ ] Is state managed locally or globally?
- [ ] Does it use existing design tokens (`index.css`)?

## 3. Backend Perspective (P1)

- [ ] Is there a new data model?
- [ ] Does it require a migration or schema change?
- [ ] How does it handle data isolation (tenant/user levels)?

## 4. Quality Perspective (P1)

- [ ] What happens on a 404/500?
- [ ] Are there race conditions during async state updates?
- [ ] Is there input validation (types + bounds)?

## 5. Security Perspective (P1)

- [ ] Are we exposing sensitive data?
- [ ] Does the RLS (Row Level Security) cover this logic?
- [ ] Is there any risk of injection or XSS in the UI?

## 6. Performance Perspective (P2)

- [ ] Does it trigger "Render Storms" (excessive re-renders)?
- [ ] Is the data payload minimized?
- [ ] Are expensive computations offloaded or memoized?

## 7. Testing Perspective (P1)

- [ ] Can this be unit tested in isolation?
- [ ] What is the "E2E Happy Path" definition?
- [ ] Is there a clear `tests/` path for this requirement?
