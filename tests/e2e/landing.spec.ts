import { test, expect } from '@playwright/test';

test.describe('Unauthenticated Landing', () => {
  test('Landing page loads with DueRadar branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Landing renders the brand name
    await expect(page.locator('text=DueRadar').first()).toBeVisible({ timeout: 10000 });
  });
});
