# DueRadar Release Gate User Validation Evaluation Report

**Certification Status:** **BLOCKED**
**Date:** 2026-06-28

This report certifies that DueRadar's release gate verification is currently **BLOCKED** due to external platform security constraints.

---

## 1. Blocker Description

- **Credentials Attempted**:
  - Email: `admin@test.com`
  - Password: `Admin143!`
- **Encountered Issues**:
  1. **Sign-In Failure**: When attempting to sign in, Clerk returns: `"Couldn't find your account." (code: form_identifier_not_found, status: 422)`. This confirms that the user account does not currently exist in the Clerk development instance (`blessed-spider-59`).
  2. **Sign-Up Failure (Turnstile Block)**: When the test runner attempts to automatically register/sign up the account, Cloudflare Turnstile bot detection displays a `"Verify you are human"` checkbox challenge. Playwright's automated browser context cannot complete this challenge programmatically (the challenge resets dynamically).
- **Unblock Action**:
  - The user must create the account `admin@test.com` with password `Admin143!` directly inside the **Clerk Dashboard** (under **Users -> Create User**). This completely bypasses the email verification/Turnstile sign-up challenge.
  - Once the user exists on Clerk's servers, the E2E sign-in suite can run successfully without Turnstile challenges.

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

- **Commit SHA**: `b2af7d6a7ad7856cde0413860b259bcdc52de96a`
- **Git Status**:
  ```
  ## apex/release-gate/20260628-e2e-hardening-metrics-idempotency
  M  tests/e2e/auth.setup.ts
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

The codebase itself is fully clean and complies with all static checks, unit tests, and styling rules. However, the E2E verification path is **BLOCKED** because the `admin@test.com` account does not exist on Clerk, and automated signup is prevented by Turnstile.
Once the account is pre-created in the Clerk dashboard, E2E validation can complete.
