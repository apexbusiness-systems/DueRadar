import { test, expect } from '@playwright/test';

// Dashboard is auth-gated; we verify the bypass mode works via auth.spec.ts
// This file exists as a placeholder for future Clerk-token-based dashboard tests.
test.skip('Dashboard authenticated test (requires Clerk token)', async () => {
  // See tests/e2e/auth.spec.ts for the bypass-auth dashboard test
});
