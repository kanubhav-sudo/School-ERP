# AI Workflow Context & Guidelines

Welcome to the School ERP project. This document serves as the primary instructions for all AI development sessions. Always consult this file first.

## AI Execution Rules

1. **Read & Sync**: Before starting any task, read every file in `/.project/` to understand the rules and status.
2. **Consult task.md**: Review the current milestone checklist in the root `task.md`.
3. **Inspect Before Action**: Never recreate existing files or restart implementation. Scan directories and code first.
4. **Preserve Architecture**: Do not modify folders or architecture without explicit design reviews.
5. **No Code Duplication**: Always look for existing middleware, services, constants, and utils. If reusable, import it; do not duplicate.

## Memory Maintenance Workflow

Update the `.project/` directory when:
- Architectural decisions are made or updated → `ARCHITECTURE_DECISIONS.md`
- New engineering rules are added → `ENGINEERING_RULES.md`
- Business logic rules change → `BUSINESS_RULES.md`
- A milestone finishes or progresses → `CURRENT_PROGRESS.md` & `FUTURE_MILESTONES.md`
- Session finishes → `SESSION_MEMORY.md`
- Bugs are discovered → `KNOWN_ISSUES.md`
- Code changes are introduced → `CHANGE_LOG_AI.md`
