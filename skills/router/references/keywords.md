# Router Trigger Keywords

## BUILD Workflow (Default)
**Keywords:** build, implement, create, make, write, add, develop, code, feature, component, app, application

**Default:** If no other keywords match, default to BUILD.

**Example Requests:**
- "build a new feature"
- "implement a REST API"
- "create a component"
- "make a web app"
- "write unit tests"
- "add authentication"
- "develop an API"
- "code a new module"

## DEBUG Workflow
**Keywords:** debug, fix, error, bug, broken, troubleshoot, issue, problem, doesn't work, failure

**Example Requests:**
- "debug the login issue"
- "fix the memory leak"
- "error in production"
- "bug in the code"
- "broken build"
- "troubleshoot connection"
- "issue with API"
- "problem with data"
- "doesn't work properly"
- "system failure"

## REVIEW Workflow
**Keywords:** review, audit, check, analyze, assess, "what do you think", "is this good", evaluate

**Example Requests:**
- "review the code"
- "audit the security"
- "check performance"
- "analyze the design"
- "assess the architecture"
- "what do you think about this"
- "is this good code"
- "evaluate the solution"

## PLAN Workflow
**Keywords:** plan, design, architect, roadmap, strategy, spec, "before we build", "how should we"

**Example Requests:**
- "plan the implementation"
- "design the architecture"
- "architect a solution"
- "roadmap for Q1"
- "strategy for scaling"
- "create a spec"
- "before we build the feature"
- "how should we approach this"

## Priority Order
DEBUG > REVIEW > PLAN > BUILD (most specific to least specific)

If a request matches keywords from multiple workflows, the higher priority workflow is selected.
