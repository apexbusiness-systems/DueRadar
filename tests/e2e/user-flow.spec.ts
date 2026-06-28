import { test, expect } from '@playwright/test';

test.describe('DueRadar User Lifecycle Flow', () => {
  // Clear cookies/local storage for unauthenticated tests
  test('1. Unauthenticated landing loads and routes block unauthorized users', async ({ page }) => {
    // Clear storage state to force anonymous session
    await page.context().clearCookies();
    await page.context().addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    // Landing page
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();

    // Check that accessing dashboard redirects to sign-in or blocks
    await page.goto('/dashboard');
    await page.waitForURL(/.*\/sign-in/);
    expect(page.url()).toContain('/sign-in');
  });

  // Authenticated flow runs with user storageState pre-loaded by auth.setup.ts
  test('2. First-time authenticated user lifecycle path', async ({ page }) => {
    // 3. Reach dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });

    // 4. Create a due/deadline task
    await page.getByTestId('button-new-obligation').click();
    await page.waitForURL(/.*\/obligations\/new/);

    const testTitle = `E2E License AutoTest ${Date.now()}`;
    await page.getByTestId('input-title').fill(testTitle);
    
    // Select category (Contracts)
    await page.getByTestId('select-category').click();
    await page.getByRole('option', { name: 'Contracts' }).first().click();

    // Fill in due date (15 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.getByTestId('input-due-date').fill(dateStr);

    await page.getByTestId('input-description').fill('Automated integration task created by Playwright E2E.');
    await page.getByTestId('input-owner-email').fill('owner@company.com');
    await page.getByTestId('input-notes').fill('Verification steps: check if state remains completed after toggle.');

    // Submit
    await page.getByTestId('button-submit').click();

    // 5. It should redirect to the detail view and show 'Obligation created' toast
    await page.waitForURL(/\/obligations\/\d+/);
    const detailUrl = page.url();
    const obligationId = detailUrl.split('/').pop();
    console.log(`Created obligation ID: ${obligationId}`);

    // Verify detail page has correct details
    await expect(page.locator('h1')).toHaveText(testTitle);

    // 6. See it in the register/list
    await page.getByTestId('nav-link-obligations').click();
    await page.waitForURL(/.*\/obligations/);
    await page.waitForLoadState('networkidle');

    // Wait for the obligation row to be visible in list
    const obligationRow = page.locator(`text=${testTitle}`).first();
    await expect(obligationRow).toBeVisible({ timeout: 10000 });

    // 7. Open the detail view
    await obligationRow.click();
    await page.waitForURL(new RegExp(`.*\\/obligations\\/${obligationId}`));

    // 8. Update or complete it
    const completeBtn = page.getByTestId('button-complete');
    await expect(completeBtn).toBeVisible({ timeout: 10000 });
    await completeBtn.click();

    // Verify the status badge updates to 'completed'
    const completedBadge = page.locator('text=/completed/i').first();
    await expect(completedBadge).toBeVisible({ timeout: 10000 });

    // Verify state consistency on reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/completed/i').first()).toBeVisible({ timeout: 10000 });

    // 9. Log out
    const signOutBtn = page.getByTestId('button-sign-out');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Wait for Clerk signOut redirection to landing page
    await page.waitForURL(/.*\/(sign-in)?/);

    // 10. Confirm protected routes are safely blocked
    await page.goto('/dashboard');
    await page.waitForURL(/.*\/sign-in/);
    expect(page.url()).toContain('/sign-in');
  });
});
