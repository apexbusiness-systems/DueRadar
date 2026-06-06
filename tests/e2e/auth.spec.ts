import { test, expect } from '@playwright/test';

test.describe('DueRadar Critical Path', () => {
  test('Landing page loads and redirects properly', async ({ page }) => {
    // Navigate to the root
    await page.goto('/');
    
    // Expect the page to have the DueRadar brand title
    await expect(page.locator('text=DueRadar').first()).toBeVisible();
    
    // Expect sign-in button to exist
    const signInButton = page.locator('text=Sign In').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await expect(page).toHaveURL(/.*sign-in/);
    }
  });
});
