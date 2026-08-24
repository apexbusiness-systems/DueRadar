# Playwright E2E User Flow Tests

DueRadar uses Playwright for comprehensive end-to-end user flow validations.

## 1. Test Setup & Configuration
Playwright tests are configured in `playwright.config.ts`.
- **Base URL**: Local dev server `http://localhost:3000`.
- **Global Setup**: Authenticates via Clerk (see `tests/e2e/auth.setup.ts`) and stores session cookies in `playwright/.auth/user.json`.
- **Target Test Suites**:
  - `tests/e2e/auth.setup.ts`: Sets up authenticated Clerk state.
  - `tests/e2e/obligations.spec.ts` (or similar tests): Runs user actions (creation, detail navigation, modifications).

---

## 2. Test Execution Commands
Playwright tests can be run using the following command-line scripts:
- **Run all E2E tests**: `pnpm playwright test`
- **Run in headful mode (UI debug)**: `pnpm playwright test --ui`

---

## 3. Playwright Authentication Setup Logic
The authentication helper (`auth.setup.ts`) navigates to Clerk's sign-up page:
1. Clears current browser contexts.
2. Navigates to `/sign-up`.
3. Populates credentials and clicks `Continue`.
4. Checks for OTP validation. If present, populates test code `424242`.
5. Saves cookies and storage state to `playwright/.auth/user.json`.

> [!WARNING]
> In the current release gate evaluation, automatic setup is **blocked** by Cloudflare Turnstile bot-detection on Clerk's hosted authentication screen. Manual test credentials or Turnstile bypass configuration must be configured in Clerk before this test will pass headlessly in CI environments.
