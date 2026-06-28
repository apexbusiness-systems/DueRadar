import { test, expect } from '@playwright/test';

test.describe('Unauthenticated Endpoints', () => {
  test('Landing page loads correctly', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Use domcontentloaded rather than networkidle: Clerk retries DNS for
    // test-key domains and prevents networkidle in CI without external network.
    await page.waitForLoadState('domcontentloaded');

    // Check main headline exists
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
    
    // Check Sign In button if visible
    const signInBtn = page.getByRole('link', { name: /Sign In/i }).first();
    if (await signInBtn.isVisible()) {
      await expect(signInBtn).toHaveAttribute('href', /.*\/sign-in/);
    }
    const signUpBtn = page.getByRole('link', { name: /Sign Up/i }).first();
    if (await signUpBtn.isVisible()) {
      await expect(signUpBtn).toHaveAttribute('href', /.*\/sign-up/);
    }
  });

  test('Info detail page loads correctly', async ({ page }) => {
    const response = await page.goto('/info/security');
    expect(response?.status()).toBe(200);
  });

  test('404 Not Found renders correctly', async ({ page }) => {
    await page.goto('/does-not-exist-12345');
    await expect(page.locator('text=/Not Found/i').first()).toBeVisible();
  });
});
