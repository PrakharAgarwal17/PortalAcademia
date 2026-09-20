# Contributing to PortalAcademia

Welcome to PortalAcademia! This document outlines our branch strategy, pull request protocol, code standards, and engineering discipline to keep the codebase reliable, secure, and production-ready.

---

## 1. Git Workflow & Branch Strategy

We follow a structured trunk-based workflow with an active integration branch (`GOD`) and production branch (`main`).

```
main (Production)
  ▲
  │ (Pull Request / Merge after QA & verification)
GOD (Active Feature Integration Branch)
  ▲
  ├── feat/alumni-network
  ├── fix/ats-scoring-parity
  └── docs/consolidated-architecture
```

### Branch Naming Conventions
Always create feature and bugfix branches with clear, scoped prefixes:
- `feat/<feature-name>`: New stakeholder features, UI views, or services (e.g., `feat/resume-ats-upload`)
- `fix/<bug-description>`: Bugfixes, edge-case remediation, security patches (e.g., `fix/idor-application-status`)
- `docs/<doc-scope>`: Documentation updates, schema maps, setup guides (e.g., `docs/root-architecture-sync`)
- `refactor/<scope>`: Code refactoring without behavioral changes (e.g., `refactor/ats-scoring-service`)
- `chore/<scope>`: Dependency upgrades, build scripts, linter configurations

### Merging `GOD` into `main`
The `GOD` branch serves as the staging ground where multi-stakeholder features (Student, Faculty, Institution, Industry) converge.
1. Ensure all local tests and TypeScript checks pass on `GOD`:
   ```bash
   cd client && npx tsc --noEmit
   cd ../server && npx tsc --noEmit
   ```
2. Rebase or merge latest `main` into `GOD`:
   ```bash
   git checkout GOD
   git pull origin GOD
   git merge origin/main
   ```
3. Open a Pull Request from `GOD` to `main` with a detailed verification log.
4. Verify deployment and run smoke tests across all 4 stakeholder portals before closing the PR.

---

## 2. Commit Message Standards

We enforce descriptive, human-readable commit messages following the Conventional Commits format:

```
<type>(<scope>): <short imperative description>

[optional body explaining rationale and trade-offs]
```

### Types
- `feat`: A new user-facing feature or API endpoint
- `fix`: A bug fix or security remediation
- `docs`: Documentation changes only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `chore`: Changes to build process, dependencies, or tool configurations

### Examples
- `feat(auth): persist institutional email verification state across user and profile models`
- `fix(applications): enforce recruiter ownership check on status transition to prevent IDOR`
- `feat(ats): integrate deterministic 5-category scoring engine with proof-of-separation parity`
- `docs(api): consolidate API contracts into root documentation`

---

## 3. Pull Request Guidelines

Before opening a Pull Request:
1. **Scope Discipline**: One logical change per proposal. Never fold unplanned, unrelated refactoring into a bugfix.
2. **Read Before Writing**: Verify live schema shapes and caller signatures in source files rather than relying on memory.
3. **Trace Every Caller**: Grep for every import or call site when modifying shared services (e.g., `atsScoringService.ts`, `alumniResolver.ts`).
4. **Mandatory Security Checklist**:
   - [ ] Auth guard (`isloggedIn`) present on all non-public routes.
   - [ ] Role guard (`rbacMiddleware.ts`) matches the permitted `AccountType`.
   - [ ] Resource-level authorization: confirms the target entity belongs to the requester (`req.userId` / institution scope).
   - [ ] Explicit field allow-lists on writes (avoid direct `req.body` spreading into Mongoose queries).
   - [ ] No sensitive fields (`password`, OTPs) leaked in API response payloads.
5. **Fill Out the PR Description**:
   - **Summary of Changes**: Bullet points of what was added, modified, or removed.
   - **Affected Stakeholders**: Student, Faculty, Institution, or Industry.
   - **Automated Verification**: Commands executed and results (`npx tsc --noEmit`, test scripts).
   - **Manual Verification**: Click paths tested in the browser.

---

## 4. Local Verification Pre-Checks

Before submitting changes, run the automated verification suite:

```bash
# 1. Type-check client
cd client
npx tsc --noEmit

# 2. Type-check server
cd ../server
npx tsc --noEmit

# 3. Client production build check
cd ../client
npm run build
```

---

## 5. Security & Hygiene Rules

- **Never commit `.env` files**: All secrets, JWT passkeys, Cloudinary credentials, and MongoDB connection strings must remain in local `.env` files (use `.env.example` as a template).
- **Never commit `docker-compose.yml`**: Docker compose configuration is local-only and gitignored.
- **Never force-push to `main` or `GOD`**: Always use standard merges or fast-forward pulls.
- **Preserve Documentation**: Update `README.md`, `ARCHITECTURE.md`, and `API.md` whenever routes, schemas, or architectural patterns are modified.
