# Git & Version Control Workflow

This document details the Git flow, branch structures, commit messages, and deployment procedures for the School ERP System.

---

## 1. Branching Strategy

- **`main`**: Production-ready branch. Must always build successfully and pass linting. Direct commits are restricted.
- **`develop`**: Integration branch for upcoming releases.
- **Feature Branches (`feat/...`, `fix/...`, `refactor/...`)**: Granular branches branched from `develop` representing checkpoints or specific tasks.

---

## 2. Commit Message Guidelines

We enforce **Conventional Commits**. The commit message format should be:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Approved Types:
- `feat`: A new feature or capability.
- `fix`: A bug fix or syntax correction.
- `docs`: Documentation changes only.
- `style`: Formatting, missing semi-colons, style fixes only (no logic change).
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Build tasks, package manager configs, meta-configs.

### Scope Examples:
- `auth`, `prisma`, `env`, `logger`, `routing`, `ui-button`, `login`.

---

## 3. Checkpoint Git Loop

Future development must follow this strict cycle for each checkpoint:

1. **Start**: Checkout feature branch (e.g. `feat/academic-sessions` from `develop`).
2. **Implementation**: Code the specific changes required for the checkpoint.
3. **Verification**: Run tests, builds, and linting.
4. **Task Update**: Update `task.md` ticking off completed items.
5. **Walkthrough Update**: Update `walkthrough.md` documenting changes.
6. **Project Memory Update**: Synchronize the files in `.project/`.
7. **Commit**: Stage all files and commit with conventional messages:
   ```bash
   git add .
   git commit -m "feat(auth): complete checkpoint 2.5 route guards and login form"
   ```
8. **Push & PR**: Push to remote and open PR against `develop`.
   ```bash
   git push origin feat/academic-sessions
   ```
9. **Review & Merge**: Merge into `develop` after successful build validation.

---

## 4. Verification Guardrails
- **Never commit broken code**.
- **Never push failing builds**.
- **No warnings/errors**: Ensure `npm run lint` yields clean output prior to committing.
