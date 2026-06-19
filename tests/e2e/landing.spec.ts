import { test, expect } from '@playwright/test';

test.describe('Unauthenticated Landing', () => {
  test('Landing page loads with DueRadar branding', async ({ page }) => {
    await page.goto('/');
    // Use domcontentloaded rather than networkidle: Clerk retries DNS for
    // test-key domains (e.g. clerk.example.com) and can prevent networkidle
    // from ever resolving in CI environments without external network access.
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=DueRadar').first()).toBeVisible({ timeout: 15000 });
  });
});
