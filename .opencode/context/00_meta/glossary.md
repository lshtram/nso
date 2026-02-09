# Glossary

## Project Terms

- **Dream News:** AI-Powered News Aggregation Platform
- **News Aggregation:** Collecting news from multiple sources
- **AI-Powered:** Features utilizing artificial intelligence

## Technical Terms

- **Component:** Reusable React UI element
- **Hook:** React function for state/lifecycle
- **Context:** React state management pattern
- **Vite:** Build tool and dev server
- **Bun:** JavaScript runtime and package manager

## Workflow Terms

- **NSO:** Neuro-Symbolic Orchestrator - Multi-agent AI system
- **Oracle:** System Architect agent - Coordinates workflows, creates requirements and architecture
- **Builder:** Software Engineer agent - Implements features, writes code, fixes bugs
- **Janitor:** QA agent - Investigates bugs, reviews code, runs validation
- **Designer:** Frontend/UX agent - Creates UI components, mockups, ensures accessibility
- **Scout:** Research agent - Evaluates technologies, creates RFCs, Buy vs Build decisions
- **Librarian:** Knowledge Manager agent - Updates memory, handles git operations, session closure

## NSO Terms

- **Task ID:** Unique identifier for parallel tasks (format: `task_{timestamp}_{workflow}_{hash}_{counter}`)
- **Contract:** Instructions from Oracle to agent (contract.md in task directory)
- **Task Isolation:** Each agent works in isolated directory with prefixed files
- **Contamination:** File created without proper task ID prefix (safety violation)
- **Fallback:** Automatic switch from parallel to sequential execution on failure
- **Workflow:** BUILD, DEBUG, REVIEW, or PLAN - determines agent coordination pattern
- **Phase:** Workflow step (Discovery, Architecture, Implementation, Validation, Closure)
- **Parallel Phase:** Multiple agents work simultaneously (e.g., Implementation)
- **Sequential Phase:** One agent works at a time (e.g., Discovery, Architecture)
