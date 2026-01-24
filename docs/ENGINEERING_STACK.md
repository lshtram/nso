# Engineering Stack: The "Why" and "How"

This guide explains the advanced tools in our high-integrity environment.

## 1. Storybook ("The UI Workbench")
> **Analogy**: A photographer's studio where you take pictures of a product against a white background, before putting it in the catalog.

- **What**: A tool to build UI components (Buttons, Headers, Cards) in complete isolation from your app.
- **Why**:
    -   **Isolation**: No need to run the whole backend just to check if a button's hover state works.
    -   **Documentation**: It generates a visual catalog of all your components.
    -   **Edge Cases**: You can create "Stories" for every state (e.g., `Button (Loading)`, `Button (Disabled)`, `Button (Super Long Text)`).
- **Workflow**:
    1.  Create `MyComponent.tsx`.
    2.  Create `MyComponent.stories.tsx`.
    3.  Run `npm run storybook` to view it.
- **Resources**: [Learn Storybook](https://storybook.js.org/tutorials/intro-to-storybook/react/en/get-started/)

## 2. MSW (Mock Service Worker) ("The API Simulator")
> **Analogy**: A stunt double for your backend server.

- **What**: A library that intercepts network requests at the browser level and returns fake (mocked) data.
- **Why**:
    -   **Interface-First**: Frontend devs can build the *entire* UI before the backend even exists.
    -   **Deterministic Testing**: You can force the API to return a "500 Error" to test how your app handles crashes (hard to do with a real server).
- **Workflow**:
    1.  Define a "Handler" (e.g., "When GET /user, return { name: 'Alice' }").
    2.  Start MSW.
    3.  Your app behaves exactly as if the real server replied.
- **Resources**: [MSW Docs](https://mswjs.io/docs/getting-started)

## 3. Plop.js ("The Scaffolder")
> **Analogy**: A cookie cutter for your code files.

- **What**: A "micro-generator" framework.
- **Why**:
    -   **Consistency**: A new component *always* includes a test file, a CSS module, and a Storybook file. No more "forgetting to add tests."
    -   **Velocity**: One command creates 4 files and fills in the boilerplate.
- **How to use**:
    -   Run `npx plop`.
    -   Follow the prompts (e.g., "Component Name?").

## 4. Husky ("The Enforcer")
> **Analogy**: The bouncer at the club door.

- **What**: A tool that runs scripts *automatically* when you try to commit code to Git.
- **Why**:
    -   **Quality Gate**: It prevents "bad code" (failing tests, messy formatting) from ever entering the codebase.
    -   **Automation**: You don't have to remember to run `npm test` before pushing; Husky does it for you.
- **Workflow**:
    -   Just run `git commit`. Husky runs the checks. If they fail, the commit is blocked.
