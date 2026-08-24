# PR 46 Root Cause Reproductions

## 1. Typecheck and Lint
- **Command:** `pnpm run typecheck`
- **Result:** PASS (Exit code 0)

## 2. API Server Tests
- **Command:** `pnpm --filter @workspace/api-server run test`
- **Result:** FAIL (Exit code 1)
- **Error Excerpt:**
  ```
  FAIL  src/tests/idempotency.test.ts > Idempotency Middleware > Case 1: same user + same key + same body -> returns cached response on second call
  AssertionError: expected 500 to be 201 // Object.is equality
  ```
- **Root Cause:** The `idempotency` middleware does not cache the response correctly or properly check the request fingerprint, returning 500 instead of 201 on replay.

## 3. Dependency Audit
- **Command:** `pnpm audit --audit-level=high`
- **Result:** FAIL (Exit code 1)
- **Error Excerpt:**
  ```
  high | LinkifyIt#match scan loop has quadratic algorithmic complexity
  Package: linkify-it
  ```
- **Root Cause:** `linkify-it@5.0.0` has a vulnerability. Need to override it to `>=5.0.1`.

## 4. Playwright Unauth Smoke Tests
- **Command:** `pnpm exec playwright test tests/e2e/unauth.spec.ts tests/e2e/landing.spec.ts --project=chromium`
- **Result:** PASS (Exit code 0) but conceptually FAILED because it ran `auth.setup.ts`.
- **Error Excerpt:**
  ```
  [RESP BODY] {"error":"Idempotency-Key header is required"}
  ok 1 [setup] › tests\e2e\auth.setup.ts:6:6 › authenticate via Clerk (23.3s)
  ```
- **Root Cause:** The `chromium` project in `playwright.config.ts` depends on `auth.setup`, which shouldn't happen for unauth tests. Additionally, the `/api/me/seed` route is failing with 400 because `Idempotency-Key` is missing from `WorkspaceContext.tsx`.
