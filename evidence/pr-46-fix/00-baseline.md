# PR 46 Repair Baseline

Branch: `apex/dueradar/single-app-shell-telemetry`
Commit: `1bf4597`

Failing checks observed:
- Dependency Audit
- Playwright E2E smoke
- Typecheck & Test (specifically api-server tests)

Files changed by PR (based on earlier `git diff` / `git status`):
- `artifacts/frontend/src/App.tsx`
- `artifacts/frontend/src/components/layout/AppLayout.tsx`
- `artifacts/frontend/src/contexts/WorkspaceContext.tsx`
- `artifacts/frontend/src/pages/dashboard.tsx`
- `artifacts/frontend/src/pages/info-detail.tsx`
- `artifacts/frontend/src/pages/landing.tsx`
- `artifacts/frontend/src/pages/obligations.tsx`
- `test-results/.last-run.json`
- `tests/e2e/auth.setup.ts`
- `tests/e2e/unauth.spec.ts`

Exact repair plan:
Execute the 14-phase repair contract to fix the `.gitignore` safety regression, Clerk configuration, Idempotency middleware and Context regressions, Playwright test architecture, and ensure no secrets or local state leak into the repository.
