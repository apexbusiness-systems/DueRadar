# DueRadar Release Gate User Validation Evaluation Report

**Certification Status:** **BLOCKED**
**Date:** 2026-06-28

This report certifies that DueRadar's release gate verification is currently **BLOCKED** due to external platform security constraints.

---

## 1. Blocker Description

- **Blocker**: Cloudflare Turnstile Bot Protection is active on the Clerk development instance (`blessed-spider-59.clerk.accounts.dev`) sign-up endpoint.
- **Impact**: Headless and automated browser runs (Playwright) are flagged as bots by Cloudflare, presenting an interactive Turnstile captcha ("Verify you are human") that prevents the automated signup setup flow from completing.
- **Unblock Action**: 
  1. **Option A**: Temporarily disable **Bot Detection / Turnstile** in the Clerk Dashboard under **Security -> Bot Detection** for the development instance.
  2. **Option B**: Pre-create the user `test+clerk_test@example.com` in the Clerk dashboard with password `testpassword123` so the test runner can use the sign-in flow (which does not trigger the Turnstile challenge).

---

## 2. Release Decisions Checklist

- [ ] **Chrome E2E Path Verified**: **BLOCKED** (Cannot bypass Cloudflare Turnstile automated signup captcha).
- [x] **No Bypass Auth**: Enforces Clerk authentication in the final E2E test runs. Bypasses are turned off (`VITE_TEST_BYPASS_AUTH=false`).
- [x] **Dynamic Live Metrics**: StatusBar and navigation badge counts are fully dynamic, querying the active database state.
- [x] **New User Seeding Safe**: If `DEMO_DATA_MODE=false`, the system does not seed misleading fake records for new users.
- [x] **Demo Mode Labeling**: When demo data is visible, the UI displays a clear Sandbox notice banner.
- [x] **Composite-Key Idempotency**: Idempotency middleware is scoped by user ID, validates body hashes, and caches 204 No Content correctly.
- [x] **Command Gates**: 100% typecheck and clean ESLint compliance with no warnings or errors.

---

## 3. Git Metadata

- **Commit SHA**: `44e916d6f4b91e2766e8e5d3d1d1cf54e337f55a`
- **Git Status**:
  ```
  ## fix-fly-healthcheck
   M .gitignore
   M artifacts/api-server/build.mjs
   M artifacts/api-server/package.json
   M artifacts/api-server/src/lib/seed.ts
   M artifacts/api-server/src/middlewares/idempotency.ts
   M artifacts/api-server/src/routes/webhooks.ts
   M artifacts/frontend/.env
   M artifacts/frontend/src/App.tsx
   M artifacts/frontend/src/components/core/Chrome.tsx
   M artifacts/frontend/src/contexts/WorkspaceContext.tsx
   M artifacts/frontend/src/hooks/use-toast.ts
   M artifacts/frontend/src/hooks/useObligations.ts
   M artifacts/frontend/src/pages/dashboard.tsx
   M artifacts/frontend/src/pages/delivery.tsx
   M artifacts/frontend/src/pages/obligation-detail.tsx
   M artifacts/frontend/vite.config.ts
   M playwright.config.ts
   M pnpm-lock.yaml
   M tests/e2e/dashboard.spec.ts
   M tests/e2e/unauth.spec.ts
  ```

---

## 4. Test Outputs & Command Gates

### Static Analysis (Typecheck & ESLint)
- Command: `pnpm run typecheck` -> Exit code: 0
- Command: `pnpm run lint` -> Exit code: 0
  ```
  ESLint parsed 115 files.
  No errors or warnings found.
  ```

### Unit & Integration Suite (Vitest)
- Command: `pnpm test` -> Exit code: 0
- Results: 34 passed, 0 failed.

---

## 5. Certification Conclusion

The codebase itself is fully clean and complies with all static checks, unit tests, and styling rules. However, the E2E verification path is **BLOCKED** by Clerk's Turnstile bot detection on signup.
Once Turnstile is disabled or a test account is pre-created in the Clerk dashboard, the E2E verification can be run to completion.
