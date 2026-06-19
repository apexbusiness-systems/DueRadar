import { test } from '@playwright/test';

// Dashboard is auth-gated; see tests/e2e/auth.spec.ts for bypass-auth tests.
// This file is a placeholder for future Clerk-token-based dashboard tests.
test.skip('Dashboard authenticated test (requires Clerk token)', async () => {
  // TODO: implement with actual Clerk test user credentials
});
